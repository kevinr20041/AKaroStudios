// Vercel serverless function. Listens for Stripe's checkout.session.completed
// event and sends a branded confirmation email to the customer plus a new-order
// notification to Kevin, automatically, the moment a real payment clears.
//
// Requires these Vercel env vars:
//   STRIPE_SECRET_KEY     (already set)
//   STRIPE_WEBHOOK_SECRET (from the Stripe Dashboard webhook you create)
//   RESEND_API_KEY        (from resend.com)
//   NOTIFY_EMAIL          (where new-order alerts should land, e.g. your Gmail)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

module.exports.config = { api: { bodyParser: false } };

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function customerEmailHtml(meta, session) {
  const amount = ((session.amount_total || 0) / 100).toFixed(2);
  return `
  <div style="font-family:Georgia,serif;background:#0c0b0a;color:#f2eee9;padding:40px 24px;">
    <div style="max-width:480px;margin:0 auto;">
      <p style="color:#d75872;font-style:italic;font-size:22px;margin:0 0 24px;">AK &mdash; AKaro Studios</p>
      <h1 style="font-size:24px;margin:0 0 16px;">You're booked in.</h1>
      <p style="line-height:1.6;color:#c9c3bd;">Hi ${escapeHtml(meta.name) || 'there'}, thanks for booking <strong>${escapeHtml(meta.package_name)}</strong> (&euro;${amount}). A strategist will reach out to ${escapeHtml(session.customer_email)} within one business day to kick things off.</p>
      <p style="line-height:1.6;color:#c9c3bd;">Questions in the meantime? Call or WhatsApp <a href="tel:+353858786327" style="color:#d75872;">085 878 6327</a>.</p>
      <p style="margin-top:32px;color:#8a8681;font-size:13px;">AKaro Studios &mdash; Email. Web. Local search. One studio.</p>
    </div>
  </div>`;
}

function internalNotificationHtml(meta, session) {
  const amount = ((session.amount_total || 0) / 100).toFixed(2);
  const rows = [
    ['Package', meta.package_name],
    ['Amount', `€${amount}`],
    ['Name', meta.name],
    ['Email', session.customer_email],
    ['Phone', meta.phone],
    ['Business', meta.business],
    ['Description', meta.description],
    ['Pages', meta.pages],
    ['Logo', meta.logo],
    ['Domain', meta.domain],
    ['Notes', meta.notes]
  ].filter(([, v]) => v);

  const rowsHtml = rows
    .map(([label, value]) => `<tr><td style="padding:6px 12px 6px 0;color:#8a8681;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(value)}</td></tr>`)
    .join('');

  return `
  <div style="font-family:Georgia,serif;background:#0c0b0a;color:#f2eee9;padding:40px 24px;">
    <div style="max-width:560px;margin:0 auto;">
      <h1 style="font-size:22px;margin:0 0 16px;">New order paid</h1>
      <table style="border-collapse:collapse;">${rowsHtml}</table>
    </div>
  </div>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed');
    return;
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(500).end('Webhook not configured');
    return;
  }

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
        if (session.customer_email) {
          await resend.emails.send({
            from: 'AKaro Studios <onboarding@resend.dev>',
            to: session.customer_email,
            subject: `You're booked in - ${meta.package_name || 'AKaro Studios'}`,
            html: customerEmailHtml(meta, session)
          });
        }
        if (process.env.NOTIFY_EMAIL) {
          await resend.emails.send({
            from: 'AKaro Studios <onboarding@resend.dev>',
            to: process.env.NOTIFY_EMAIL,
            subject: `New order: ${meta.package_name || 'Unknown package'}`,
            html: internalNotificationHtml(meta, session)
          });
        }
      } catch (err) {
        console.error('Order confirmation email failed to send:', err.message);
      }
    }
  }

  res.status(200).json({ received: true });
};
