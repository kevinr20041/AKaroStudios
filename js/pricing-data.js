/* AKaro Studios - shared pricing catalog, used by the bundle calculator
   and any page that needs to quote combined service pricing. */
window.AKARO_PRICING = (function () {
  'use strict';

  // Launch pricing: intentionally below industry average while AKaro Studios
  // builds its first reviews. Raise once bookings and reviews come in.
  // Email Marketing is sold as monthly campaign plans, by send volume
  // (Newsletter/Bi-Weekly/Weekly/Growth/Premium). Website Creation is sold
  // as 10 distinct one-time site types instead (see
  // services/website-creation.html), so it isn't tiered - the calculator lets
  // people pick the exact product. Google Business Profile is a flat one-time
  // setup fee plus a flat monthly management fee - also not tiered.
  var SERVICES = {
    email: {
      label: 'Email Marketing',
      icon: 'ph-envelope-simple-open',
      billing: 'monthly',
      tiers: { newsletter: 60, biweekly: 110, weekly: 160, growth: 250, premium: 360 }
    }
  };

  var WEBSITE_PRODUCTS = [
    { key: 'bio', name: 'Personal Bio Website', price: 50 },
    { key: 'portfolio', name: 'Portfolio Website', price: 100 },
    { key: 'trade', name: 'Trade & Simple Business Website', price: 125 },
    { key: 'restaurant', name: 'Restaurant & Café Website', price: 175 },
    { key: 'local-service', name: 'Local Service Business Website', price: 225 },
    { key: 'consultant', name: 'Professional & Consultant Website', price: 300 },
    { key: 'growing-business', name: 'Growing Business Website', price: 425 },
    { key: 'store-starter', name: 'Online Store Starter', price: 650 },
    { key: 'advanced-custom', name: 'Advanced Custom Website', price: 950 },
    { key: 'full-custom', name: 'Full Custom / E-commerce Website', price: 1500 }
  ];

  var GBP = { label: 'Google Business Profile', icon: 'ph-map-pin', setup: 150, monthly: 20 };

  var TIER_LABELS = { newsletter: 'Newsletter', biweekly: 'Bi-Weekly', weekly: 'Weekly', growth: 'Growth', premium: 'Premium' };

  // Flat bundle discount applied to the sum of one-time fees and,
  // separately, to the sum of monthly fees, whenever two or more services
  // are selected together.
  var DISCOUNTS = { 2: 0.20, 3: 0.20 };

  function getWebsiteProduct(key) {
    var product = null;
    WEBSITE_PRODUCTS.forEach(function (p) { if (p.key === key) product = p; });
    return product || WEBSITE_PRODUCTS[2]; // default: Trade & Simple Business Website
  }

  function quote(selectedKeys, tier, websiteProductKey) {
    var onetime = 0, monthly = 0;
    selectedKeys.forEach(function (key) {
      if (key === 'website') {
        onetime += getWebsiteProduct(websiteProductKey).price;
        return;
      }
      if (key === 'gbp') {
        onetime += GBP.setup;
        monthly += GBP.monthly;
        return;
      }
      var svc = SERVICES[key];
      if (!svc) return;
      monthly += svc.tiers[tier] || 0;
    });
    var count = selectedKeys.length;
    var discount = DISCOUNTS[count] || 0;
    var onetimeDiscounted = Math.round(onetime * (1 - discount));
    var monthlyDiscounted = Math.round(monthly * (1 - discount));
    return {
      count: count,
      discount: discount,
      onetimeFull: onetime,
      monthlyFull: monthly,
      onetime: onetimeDiscounted,
      monthly: monthlyDiscounted,
      savedOnetime: onetime - onetimeDiscounted,
      savedMonthly: monthly - monthlyDiscounted
    };
  }

  return {
    SERVICES: SERVICES,
    WEBSITE_PRODUCTS: WEBSITE_PRODUCTS,
    GBP: GBP,
    TIER_LABELS: TIER_LABELS,
    DISCOUNTS: DISCOUNTS,
    getWebsiteProduct: getWebsiteProduct,
    quote: quote
  };
})();
