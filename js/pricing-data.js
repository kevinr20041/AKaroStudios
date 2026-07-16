/* AKaro Studios - shared pricing catalog, used by the bundle calculator
   and any page that needs to quote combined service pricing. */
window.AKARO_PRICING = (function () {
  'use strict';

  // Launch pricing: intentionally below industry average while AKaro Studios
  // builds its first reviews. Raise once bookings and reviews come in.
  var SERVICES = {
    email: {
      label: 'Email Marketing',
      icon: 'ph-envelope-simple-open',
      billing: 'monthly',
      tiers: { starter: 500, growth: 950, pro: 1800 }
    },
    // Website Creation now sells as 10 distinct site types (see the service
    // page); these three tiers are representative price points used only for
    // the bundle calculator's math: Starter = Trade & Simple Business,
    // Growth = Growing Business, Pro = Advanced Custom Website.
    website: {
      label: 'Website Creation',
      icon: 'ph-browser',
      billing: 'onetime',
      tiers: { starter: 125, growth: 425, pro: 950 }
    },
    gbp: {
      label: 'Google Business Profile',
      icon: 'ph-map-pin',
      billing: 'monthly',
      tiers: { starter: 199, growth: 399, pro: 699 }
    }
  };

  var TIER_LABELS = { starter: 'Starter', growth: 'Growth', pro: 'Pro' };

  // Bundle discount applied to the sum of one-time fees and, separately,
  // to the sum of monthly fees, based on how many services are selected.
  var DISCOUNTS = { 2: 0.12, 3: 0.20 };

  function quote(selectedKeys, tier) {
    var onetime = 0, monthly = 0;
    selectedKeys.forEach(function (key) {
      var svc = SERVICES[key];
      if (!svc) return;
      var price = svc.tiers[tier] || 0;
      if (svc.billing === 'onetime') onetime += price;
      else monthly += price;
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

  return { SERVICES: SERVICES, TIER_LABELS: TIER_LABELS, DISCOUNTS: DISCOUNTS, quote: quote };
})();
