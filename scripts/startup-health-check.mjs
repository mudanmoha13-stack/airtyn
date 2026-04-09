const BASE_URL = process.env.HEALTH_BASE_URL || 'http://localhost:9002';
const REQUEST_TIMEOUT_MS = Number(process.env.HEALTH_TIMEOUT_MS || 8000);

const checks = [
  {
    name: 'Infra health',
    path: '/api/infra/health',
    validate(status, json) {
      if (status !== 200) return `expected status 200, got ${status}`;
      if (!json?.ok) return 'expected ok=true';
      if (json?.services?.postgres !== 'up') return 'postgres is not up';
      if (json?.services?.redis !== 'up') return 'redis is not up';
      return null;
    },
  },
  {
    name: 'Users list',
    path: '/api/users',
    validate(status, json) {
      if (status !== 200) return `expected status 200, got ${status}`;
      if (json?.ok !== true) return 'expected ok=true';
      if (!Array.isArray(json?.users)) return 'expected users array';
      return null;
    },
  },
  {
    name: 'HR employees list',
    path: '/api/business/hr/employees',
    validate(status, json) {
      if (status !== 200) return `expected status 200, got ${status}`;
      if (json?.ok !== true) return 'expected ok=true';
      if (!Array.isArray(json?.employees)) return 'expected employees array';
      return null;
    },
  },
];

const authErrorPattern = /(authentication failed|invalid credentials|provided database credentials|p1000|p1010|prisma:error)/i;

function withTimeout(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  return undefined;
}

async function runCheck(check) {
  const url = `${BASE_URL}${check.path}`;
  let status = null;
  let text = '';
  let json = null;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: withTimeout(REQUEST_TIMEOUT_MS),
    });
    status = response.status;
    text = await response.text();

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
  } catch (error) {
    return {
      ok: false,
      name: check.name,
      path: check.path,
      reason: `request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (authErrorPattern.test(text)) {
    return {
      ok: false,
      name: check.name,
      path: check.path,
      reason: 'database auth/credentials error pattern detected in response',
      status,
    };
  }

  const validationError = check.validate(status, json);
  if (validationError) {
    return {
      ok: false,
      name: check.name,
      path: check.path,
      reason: validationError,
      status,
    };
  }

  return {
    ok: true,
    name: check.name,
    path: check.path,
    status,
  };
}

async function main() {
  console.log(`Running startup health checks against ${BASE_URL}`);

  const results = [];
  for (const check of checks) {
    const result = await runCheck(check);
    results.push(result);

    if (result.ok) {
      console.log(`PASS ${result.name} (${result.path}) [${result.status}]`);
    } else {
      const statusPart = result.status ? ` [${result.status}]` : '';
      console.error(`FAIL ${result.name} (${result.path})${statusPart}: ${result.reason}`);
    }
  }

  const hasFailures = results.some((result) => !result.ok);
  if (hasFailures) {
    process.exitCode = 1;
    return;
  }

  console.log('All startup health checks passed.');
}

main().catch((error) => {
  console.error(`Startup health check crashed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
