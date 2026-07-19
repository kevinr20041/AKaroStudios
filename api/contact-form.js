// Vercel serverless function. Receives the contact.html form submission and
// emails it to Kevin via Resend, so enquiries actually land in an inbox
// instead of only showing a client-side "thank you" message.
//
// Requires these Vercel env vars (same ones used by the order-confirmation
// webhook):
//   RESEND_API_KEY  (from resend.com)
//   NOTIFY_EMAIL    (where enquiries should land, e.g. your Gmail)

const { Resend } = require('resend');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(value, max) {
  if (!value) return '';
  return String(value).slice(0, max);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const name = truncate(body.name, 200);
  const email = truncate(body.email, 200);
  const company = truncate(body.company, 200);
  const service = truncate(body.service, 100);
  const message = truncate(body.message, 2000);

  if (!name || !email || !company || !message) {
    res.status(400).json({ error: 'Name, email, company and message are required.' });
    return;
  }

  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL) {
    // Email isn't configured yet - tell the frontend so it can fall back
    // to phone/WhatsApp instead of silently pretending this worked.
    res.status(503).json({ error: 'Enquiry form is not fully configured yet.' });
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const rows = [
      ['Name', name],
      ['Email', email],
      ['Company', company],
      ['Interested in', service],
      ['Message', message]
    ];
    const rowsHtml = rows
      .map(([label, value]) => `<tr><td style="padding:6px 12px 6px 0;color:#8a8681;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(value)}</td></tr>`)
      .join('');

    await resend.emails.send({
      from: 'AKaro Studios <onboarding@resend.dev>',
      to: process.env.NOTIFY_EMAIL,
      replyTo: email,
      subject: `New enquiry: ${company}`,
      html: `<div style="font-family:Georgia,serif;background:#0c0b0a;color:#f2eee9;padding:40px 24px;"><div style="max-width:560px;margin:0 auto;"><h1 style="font-size:22px;margin:0 0 16px;">New contact form enquiry</h1><table style="border-collapse:collapse;">${rowsHtml}</table></div></div>`
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong sending your message.' });
  }
};
