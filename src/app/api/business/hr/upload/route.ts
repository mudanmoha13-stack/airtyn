import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/server/firebase-admin';
import { ensureBusinessTenantDoc } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const DOCUMENT_RULES: Record<string, { extensions: string[]; mimeTypes: string[]; helpText: string }> = {
  cv: { extensions: ['pdf', 'doc', 'docx'], mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], helpText: 'PDF, DOC, DOCX' },
  national_id: { extensions: ['pdf', 'jpg', 'jpeg', 'png'], mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'], helpText: 'PDF, JPG, PNG' },
  passport: { extensions: ['pdf', 'jpg', 'jpeg', 'png'], mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'], helpText: 'PDF, JPG, PNG' },
  work_permit: { extensions: ['pdf', 'jpg', 'jpeg', 'png'], mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'], helpText: 'PDF, JPG, PNG' },
  visa: { extensions: ['pdf', 'jpg', 'jpeg', 'png'], mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'], helpText: 'PDF, JPG, PNG' },
  criminal_clearance: { extensions: ['pdf'], mimeTypes: ['application/pdf'], helpText: 'PDF only' },
  certificates: { extensions: ['pdf', 'jpg', 'jpeg', 'png'], mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'], helpText: 'PDF, JPG, PNG' },
  reference_letters: { extensions: ['pdf', 'doc', 'docx'], mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], helpText: 'PDF, DOC, DOCX' },
};

function sanitizeSegment(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'document';
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const formData = await request.formData();
    const file = formData.get('file');
    const documentType = sanitizeSegment(String(formData.get('documentType') ?? 'document'));

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Missing file upload.' }, { status: 400 });
    }
    if (file.size <= 0) {
      return NextResponse.json({ ok: false, error: 'Uploaded file is empty.' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ ok: false, error: 'File is too large. Max size is 10 MB.' }, { status: 400 });
    }

    const ext = path.extname(file.name || '').toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const extension = safeExt.replace(/^\./, '');
    const contentType = String(file.type || '').toLowerCase();
    const rule = DOCUMENT_RULES[documentType];
    if (rule) {
      const extensionAllowed = rule.extensions.includes(extension);
      const mimeAllowed = !contentType || rule.mimeTypes.includes(contentType);
      if (!extensionAllowed || !mimeAllowed) {
        return NextResponse.json({ ok: false, error: `Invalid file type for ${documentType}. Allowed: ${rule.helpText}.` }, { status: 400 });
      }
    }
    const objectPath = `tenants/${tenantId}/hr/employee-attachments/${documentType}/${Date.now()}-${randomUUID()}${safeExt}`;
    const bucket = adminStorage.bucket();
    const buffer = Buffer.from(await file.arrayBuffer());

    await bucket.file(objectPath).save(buffer, {
      resumable: false,
      metadata: {
        contentType: file.type || 'application/octet-stream',
        cacheControl: 'private, max-age=0',
        metadata: {
          tenantId,
          documentType,
          originalFileName: file.name,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      attachmentRef: `gs://${bucket.name}/${objectPath}`,
      fileName: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to upload file.' },
      { status: 500 },
    );
  }
}
