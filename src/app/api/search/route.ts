import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col } from '@/lib/server/firestore-data';
import { resolveCoreTenantId } from '@/lib/server/core-tenant';

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveCoreTenantId(request);
    const q = (request.nextUrl.searchParams.get('q') ?? '').toLowerCase().trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ ok: true, results: [] });
    }

    const [projectsSnap, tasksSnap] = await Promise.all([
      adminFirestore.collection(col.coreProjects).where('tenantId', '==', tenantId).limit(100).get(),
      adminFirestore.collection(col.coreTasks).where('tenantId', '==', tenantId).limit(500).get(),
    ]);

    const projects = projectsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as { id: string; name: string; description: string }))
      .filter((p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p) => ({ type: 'project' as const, id: p.id, title: p.name, subtitle: p.description, href: `/projects/${p.id}` }));

    const tasks = tasksSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as { id: string; title: string; description: string; projectId: string }))
      .filter((t) => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
      .slice(0, 10)
      .map((t) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        subtitle: t.description?.slice(0, 80),
        href: `/projects/${t.projectId}?taskId=${t.id}`,
        projectId: t.projectId,
      }));

    return NextResponse.json({ ok: true, results: [...projects, ...tasks] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
