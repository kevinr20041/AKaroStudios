// Vercel serverless function. Receives the contact.html form submission and
// emails it to Kevin via Resend, so enquiries actually land in an inbox
// instead of only showing a client-side "thank you" message.
//
// Requires these Vercel env vars (same ones used by the order-confirmation
// webhook):
//   RESEND_API_KEY  (from resend.com)
//   NOTIFY_EMAIL    (where enquiries should land, e.g. your Gmail)

const { Resend } = require('resend');

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

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

// Email headers (subject, reply-to, to) must never contain raw newlines -
// otherwise a crafted field like "Name\r\nBcc: someone@evil.com" could inject
// extra headers into the outgoing email. Strip all control characters from
// anything that ends up in a header position, on top of the HTML-escaping
// already applied to the message body.
function sanitizeHeaderValue(value) {
  return String(value || '').replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ').trim();
}

// Browsers send an Origin header on POST requests; reject any that names a
// different site outright (a hidden cross-site form or script trying to
// submit here on a visitor's behalf). Direct, non-browser requests (curl,
// server-to-server) send no Origin header at all and are let through -
// this is a speed bump against casual cross-site abuse, not an auth
// boundary, since raw HTTP requests can always spoof headers.
function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname;
    return host === 'akarostudios.com' || host.endsWith('.vercel.app');
  } catch (e) {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAllowedOrigin(req.headers.origin)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const body = req.body || {};

  // Honeypot: a field that's invisible and unreachable for real visitors
  // but that simple spam bots fill in anyway. If it's populated, pretend
  // the submission succeeded without actually sending anything.
  if (body.website) {
    res.status(200).json({ ok: true });
    return;
  }

  const name = sanitizeHeaderValue(truncate(body.name, 200));
  const email = sanitizeHeaderValue(truncate(body.email, 200));
  const company = sanitizeHeaderValue(truncate(body.company, 200));
  const service = sanitizeHeaderValue(truncate(body.service, 100));
  const message = truncate(body.message, 2000);

  if (!name || !email || !company || !message) {
    res.status(400).json({ error: 'Name, email, company and message are required.' });
    return;
  }

  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
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
    console.error('Contact form email failed to send:', err);
    res.status(500).json({ error: 'Something went wrong sending your message.' });
  }
};
