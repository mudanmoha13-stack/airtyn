import fs from 'node:fs';
import path from 'node:path';

const projectId = process.argv[2] || 'studio-3730844695-50170';
const indexesPath = path.resolve(process.cwd(), 'firestore.indexes.json');
const outPath = path.resolve(process.cwd(), 'firestore.create-composite-urls.txt');

function encodeVarint(value) {
  const out = [];
  let v = Number(value) >>> 0;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
  return Buffer.from(out);
}

function encodeTag(fieldNo, wireType) {
  return encodeVarint((fieldNo << 3) | wireType);
}

function encodeString(fieldNo, value) {
  const bytes = Buffer.from(String(value), 'utf8');
  return Buffer.concat([encodeTag(fieldNo, 2), encodeVarint(bytes.length), bytes]);
}

function encodeEnum(fieldNo, enumValue) {
  return Buffer.concat([encodeTag(fieldNo, 0), encodeVarint(enumValue)]);
}

function encodeMessage(fieldNo, messageBuffer) {
  return Buffer.concat([encodeTag(fieldNo, 2), encodeVarint(messageBuffer.length), messageBuffer]);
}

function encodeIndexField(field) {
  const parts = [];
  parts.push(encodeString(1, field.fieldPath));

  if (field.order) {
    const orderMap = {
      ORDER_UNSPECIFIED: 0,
      ASCENDING: 1,
      DESCENDING: 2,
    };
    parts.push(encodeEnum(2, orderMap[field.order] ?? 0));
  } else if (field.arrayConfig) {
    const arrayMap = {
      ARRAY_CONFIG_UNSPECIFIED: 0,
      CONTAINS: 1,
    };
    parts.push(encodeEnum(3, arrayMap[field.arrayConfig] ?? 0));
  } else {
    throw new Error(`Unsupported field mode for ${field.fieldPath}.`);
  }

  return Buffer.concat(parts);
}

function encodeIndex(indexSpec) {
  const parts = [];

  const scopeMap = {
    QUERY_SCOPE_UNSPECIFIED: 0,
    COLLECTION: 1,
    COLLECTION_GROUP: 2,
    COLLECTION_RECURSIVE: 3,
  };

  parts.push(encodeEnum(2, scopeMap[indexSpec.queryScope] ?? 1));

  for (const f of indexSpec.fields) {
    parts.push(encodeMessage(3, encodeIndexField(f)));
  }

  return Buffer.concat(parts);
}

function encodeCreateIndexRequest(project, indexSpec) {
  const parent = `projects/${project}/databases/(default)/collectionGroups/${indexSpec.collectionGroup}`;
  const parts = [];
  parts.push(encodeString(1, parent));
  parts.push(encodeMessage(2, encodeIndex(indexSpec)));
  return Buffer.concat(parts);
}

function buildUrl(project, indexSpec) {
  const payload = encodeCreateIndexRequest(project, indexSpec).toString('base64');
  const encodedPayload = encodeURIComponent(payload);
  return `https://console.firebase.google.com/v1/r/project/${project}/firestore/indexes?create_composite=${encodedPayload}`;
}

const config = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
const indexes = Array.isArray(config.indexes) ? config.indexes : [];

const lines = [];
lines.push(`# Firestore create_composite URLs`);
lines.push(`# Project: ${projectId}`);
lines.push(`# Count: ${indexes.length}`);
lines.push('');

indexes.forEach((idx, i) => {
  const title = `${String(i + 1).padStart(2, '0')}. ${idx.collectionGroup} :: ${idx.fields.map((f) => `${f.fieldPath}:${f.order ?? f.arrayConfig}`).join(', ')}`;
  lines.push(title);
  lines.push(buildUrl(projectId, idx));
  lines.push('');
});

fs.writeFileSync(outPath, lines.join('\n'));
console.log(`Generated ${indexes.length} links at ${outPath}`);
