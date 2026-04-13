import fs from 'node:fs';
import path from 'node:path';
import { App, applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

function resolveServiceAccountPath(): string | null {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!configuredPath || !configuredPath.trim()) {
    return null;
  }

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

function resolveServiceAccountFromEnv(): ServiceAccountJson | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson && rawJson.trim()) {
    const parsed = JSON.parse(rawJson) as ServiceAccountJson;
    return {
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      private_key: normalizePrivateKey(parsed.private_key),
    };
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.trim()) {
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as ServiceAccountJson;
    return {
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      private_key: normalizePrivateKey(parsed.private_key),
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: normalizePrivateKey(privateKey),
    };
  }

  return null;
}

function loadServiceAccountFromFile(serviceAccountPath: string): ServiceAccountJson {
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf8')
  ) as ServiceAccountJson;

  return {
    project_id: serviceAccount.project_id,
    client_email: serviceAccount.client_email,
    private_key: normalizePrivateKey(serviceAccount.private_key),
  };
}

function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  const serviceAccountFromEnv = resolveServiceAccountFromEnv();
  if (serviceAccountFromEnv) {
    return initializeApp({
      credential: cert({
        projectId: serviceAccountFromEnv.project_id,
        clientEmail: serviceAccountFromEnv.client_email,
        privateKey: serviceAccountFromEnv.private_key,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  const serviceAccountPath = resolveServiceAccountPath();
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccountFromFile = loadServiceAccountFromFile(serviceAccountPath);
    return initializeApp({
      credential: cert({
        projectId: serviceAccountFromFile.project_id,
        clientEmail: serviceAccountFromFile.client_email,
        privateKey: serviceAccountFromFile.private_key,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
