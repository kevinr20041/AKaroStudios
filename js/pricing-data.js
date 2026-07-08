/* AKaro Studios - shared pricing catalog, used by the bundle calculator
   and any page that needs to quote combined service pricing. */
window.AKARO_PRICING = (function () {
  'use strict';

  var SERVICES = {
    email: {
      label: 'Email Marketing',
      icon: 'ph-envelope-simple-open',
      billing: 'monthly',
      tiers: { starter: 900, growth: 1800, pro: 3200 }
    },
    website: {
      label: 'Website Creation',
      icon: 'ph-browser',
      billing: 'onetime',
      tiers: { starter: 1900, growth: 4200, pro: 8500 }
    },
    gbp: {
      label: 'Google Business Profile',
      icon: 'ph-map-pin',
      billing: 'monthly',
      tiers: { starter: 350, growth: 650, pro: 1100 }
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
