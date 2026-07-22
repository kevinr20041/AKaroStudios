// Vercel serverless function. Requires the STRIPE_SECRET_KEY environment
// variable to be set in the Vercel project settings before this will work.
// Prices are looked up here (server-side) rather than trusted from the
// client, so a visitor can never change what they're actually charged.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

const PACKAGES = {
  bio: { name: 'Personal Bio Website', amount: 5000 },
  portfolio: { name: 'Portfolio Website', amount: 10000 },
  trade: { name: 'Trade & Simple Business Website', amount: 12500 },
  restaurant: { name: 'Restaurant & Café Website', amount: 17500 },
  'local-service': { name: 'Local Service Business Website', amount: 22500 },
  consultant: { name: 'Professional & Consultant Website', amount: 30000 },
  'growing-business': { name: 'Growing Business Website', amount: 42500 },
  'store-starter': { name: 'Online Store Starter', amount: 65000 },
  'advanced-custom': { name: 'Advanced Custom Website', amount: 95000 },
  'full-custom': { name: 'Full Custom / E-commerce Website (starting deposit)', amount: 150000 }
};

function truncate(value, max) {
  if (!value) return '';
  return String(value).slice(0, max);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: 'Payments are not configured yet. Please contact us directly instead.' });
    return;
  }

  try {
    const body = req.body || {};
    const pkg = PACKAGES[body.package];
    if (!pkg) {
      res.status(400).json({ error: 'Unknown package selected.' });
      return;
    }
    if (!body.name || !body.email) {
      res.status(400).json({ error: 'Name and email are required.' });
      return;
    }
    if (!EMAIL_RE.test(String(body.email).trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // No payment_method_types here on purpose: omitting it lets Stripe's
      // dynamic payment methods pick the best options per customer (card,
      // Apple Pay, Google Pay, etc.) based on currency, device and location.
      // Manage which methods are eligible from the Stripe Dashboard instead:
      // https://dashboard.stripe.com/settings/payment_methods
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: pkg.name },
            unit_amount: pkg.amount
          },
          quantity: 1
        }
      ],
      customer_email: body.email,
      metadata: {
        package: body.package,
        package_name: pkg.name,
        name: truncate(body.name, 200),
        phone: truncate(body.phone, 100),
        business: truncate(body.business, 200),
        description: truncate(body.description, 490),
        pages: truncate(body.pages, 300),
        logo: truncate(body.logo, 100),
        domain: truncate(body.domain, 100),
        notes: truncate(body.notes, 490)
      },
      success_url: `${origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/get-started.html?package=${encodeURIComponent(body.package)}`
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout session creation failed:', err);
    res.status(500).json({ error: 'Something went wrong creating your checkout session. Please contact us directly instead.' });
  }
};
