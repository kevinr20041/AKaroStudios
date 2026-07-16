/* AKaro Studios - Get Started questionnaire + Stripe Checkout handoff.
   Package prices here are for display only; the server looks the price
   up again independently in api/create-checkout-session.js. */
(function () {
  'use strict';

  var PACKAGES = {
    bio: { name: 'Personal Bio Website', price: '€50 one-time', tag: 'Simplest option' },
    portfolio: { name: 'Portfolio Website', price: '€100 one-time', tag: 'Artists & photographers' },
    trade: { name: 'Trade & Simple Business Website', price: '€125 one-time', tag: 'Most booked' },
    restaurant: { name: 'Restaurant & Café Website', price: '€175 one-time', tag: 'Cafés & restaurants' },
    'local-service': { name: 'Local Service Business Website', price: '€225 one-time', tag: 'Local services' },
    consultant: { name: 'Professional & Consultant Website', price: '€300 one-time', tag: 'Consultants & professionals' },
    'growing-business': { name: 'Growing Business Website', price: '€425 one-time', tag: 'Established brands' },
    'store-starter': { name: 'Online Store Starter', price: '€650 one-time', tag: 'First online shop' },
    'advanced-custom': { name: 'Advanced Custom Website', price: '€950 one-time', tag: 'Bespoke build' },
    'full-custom': { name: 'Full Custom / E-commerce', price: '€1,500+ one-time', tag: 'Full custom build' }
  };

  var params = new URLSearchParams(window.location.search);
  var packageKey = params.get('package');
  var pkg = PACKAGES[packageKey];

  var form = document.getElementById('get-started-form');
  var missingNotice = document.getElementById('package-missing');

  if (!pkg) {
    if (missingNotice) missingNotice.style.display = 'flex';
    if (form) form.style.display = 'none';
    return;
  }

  document.getElementById('package-tag').textContent = pkg.tag;
  document.getElementById('package-name').textContent = pkg.name;
  document.getElementById('package-price').textContent = pkg.price;

  var submitBtn = document.getElementById('gs-submit');
  var status = document.getElementById('gs-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var valid = true;
    form.querySelectorAll('[required]').forEach(function (field) {
      var wrap = field.closest('.form-field');
      var ok = field.value.trim().length > 0;
      if (field.type === 'email' && ok) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
      if (wrap) wrap.classList.toggle('has-error', !ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      status.innerHTML = '<i class="ph ph-warning-circle"></i><span>Please fill in the highlighted fields before continuing.</span>';
      status.classList.add('is-visible');
      return;
    }

    var payload = {
      package: packageKey,
      name: document.getElementById('gs-name').value.trim(),
      email: document.getElementById('gs-email').value.trim(),
      phone: document.getElementById('gs-phone').value.trim(),
      business: document.getElementById('gs-business').value.trim(),
      description: document.getElementById('gs-description').value.trim(),
      pages: document.getElementById('gs-pages').value.trim(),
      logo: document.getElementById('gs-logo').value,
      domain: document.getElementById('gs-domain').value,
      notes: document.getElementById('gs-notes').value.trim()
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph ph-circle-notch"></i> Setting up secure payment&hellip;';
    status.classList.remove('is-visible');

    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Something went wrong.');
          return data;
        });
      })
      .then(function (data) {
        window.location.href = data.url;
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ph ph-lock-simple"></i> Continue to secure payment';
        status.innerHTML = '<i class="ph ph-warning-circle"></i><span>' + err.message + ' You can also <a href="contact.html" class="btn-text">get a quote</a> instead.</span>';
        status.classList.add('is-visible');
      });
  });
})();
