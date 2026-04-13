import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.RESEND_TEST_TO;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Airtyn <noreply@airtyn.com>',
      to: to ?? 'wirenext8@gmail.com',
      subject: 'Airtyn – Test Email from CRM',
      html: '<p>This is a test email sent from the <strong>Pinkplan CRM / Sales module</strong>. If you received this, your Resend integration is working correctly.</p>',
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 422 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
