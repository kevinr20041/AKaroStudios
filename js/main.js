/* AKaro Studios - shared site behaviour */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- current page / active nav ---------------- */
  var currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (currentFile === '') currentFile = 'index.html';
  document.querySelectorAll('a[data-nav-link]').forEach(function (link) {
    var href = (link.getAttribute('href') || '').toLowerCase().split('/').pop();
    if (href === currentFile || (currentFile === 'index.html' && href === './')) {
      link.classList.add('active');
    }
  });
  var serviceFiles = ['email-marketing.html', 'website-creation.html', 'google-business.html'];
  if (serviceFiles.indexOf(currentFile) !== -1) {
    var ddParent = document.querySelector('.nav-item-dropdown');
    if (ddParent) ddParent.classList.add('is-current');
  }

  /* ---------------- navbar scroll state ---------------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var ticking = false;
    var updateNav = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 12);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateNav);
        ticking = true;
      }
    }, { passive: true });
    updateNav();
  }

  /* ---------------- services dropdown ---------------- */
  document.querySelectorAll('.nav-item-dropdown').forEach(function (item) {
    var trigger = item.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var willOpen = !item.classList.contains('is-active');
      document.querySelectorAll('.nav-item-dropdown.is-active').forEach(function (open) {
        if (open !== item) open.classList.remove('is-active');
      });
      item.classList.toggle('is-active', willOpen);
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-item-dropdown')) {
      document.querySelectorAll('.nav-item-dropdown.is-active').forEach(function (open) {
        open.classList.remove('is-active');
      });
    }
  });

  /* ---------------- mobile menu ---------------- */
  var burger = document.querySelector('[data-burger]');
  var mobileMenu = document.querySelector('.mobile-menu');
  function closeMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.remove('is-open');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('is-open');
      mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a, button.mobile-menu-link').forEach(function (a) {
      a.addEventListener('click', closeMobileMenu);
    });
  }

  /* ---------------- page transitions ---------------- */
  var transitionEl = document.querySelector('.page-transition');

  function isLocalNavigable(anchor) {
    if (!anchor) return false;
    var href = anchor.getAttribute('href');
    if (!href || href.charAt(0) === '#') return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;
    if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return false;
    if (/^https?:\/\//i.test(href) && anchor.host !== location.host) return false;
    if (href.slice(-5) !== '.html' && href !== '/' && href.indexOf('.html#') === -1 && href.indexOf('.html') === -1) return false;
    return true;
  }

  if (transitionEl) {
    if (reduceMotion) {
      transitionEl.classList.remove('is-covering');
    } else {
      requestAnimationFrame(function () {
        setTimeout(function () {
          transitionEl.classList.remove('is-covering');
          transitionEl.classList.add('is-releasing');
        }, 180);
      });
    }

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var anchor = e.target.closest('a[href]');
      if (!anchor || !isLocalNavigable(anchor)) return;
      e.preventDefault();
      var dest = anchor.getAttribute('href');
      if (reduceMotion) {
        window.location.href = dest;
        return;
      }
      transitionEl.classList.remove('is-releasing');
      transitionEl.classList.add('is-covering');
      setTimeout(function () {
        window.location.href = dest;
      }, 600);
    });
  }

  /* ---------------- scroll reveal ---------------- */
  var revealTargets = document.querySelectorAll('.reveal');
  if (revealTargets.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealTargets.forEach(function (el) { el.classList.add('in-view'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      revealTargets.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------- animated counters (stat-item / result-card numbers) ---------------- */
  document.querySelectorAll('[data-count-to]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count-to'));
    var prefix = el.getAttribute('data-count-prefix') || '';
    var suffix = el.getAttribute('data-count-suffix') || '';
    var decimals = el.getAttribute('data-count-decimals') ? parseInt(el.getAttribute('data-count-decimals'), 10) : 0;
    if (isNaN(target)) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }
    var done = false;
    var counterIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !done) {
          done = true;
          var start = null;
          var duration = 1400;
          function step(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var val = target * eased;
            el.textContent = prefix + val.toFixed(decimals) + suffix;
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = prefix + target.toFixed(decimals) + suffix;
          }
          requestAnimationFrame(step);
          counterIo.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    counterIo.observe(el);
  });

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;
    btn.addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');
      var list = item.closest('.faq-list');
      if (list) {
        list.querySelectorAll('.faq-item.is-open').forEach(function (open) {
          if (open !== item) {
            open.classList.remove('is-open');
            open.querySelector('.faq-answer').style.maxHeight = 0;
            open.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          }
        });
      }
      item.classList.toggle('is-open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      answer.style.maxHeight = willOpen ? answer.scrollHeight + 'px' : 0;
    });
  });

  /* ---------------- FAQ search filter (faq.html) ---------------- */
  var faqSearchInput = document.querySelector('.faq-search input');
  if (faqSearchInput) {
    var faqItems = document.querySelectorAll('.faq-item');
    var faqCategoryLabels = document.querySelectorAll('.faq-category-label');
    var faqEmpty = document.querySelector('.faq-empty');
    faqSearchInput.addEventListener('input', function () {
      var q = faqSearchInput.value.trim().toLowerCase();
      var visibleCount = 0;
      faqItems.forEach(function (item) {
        var text = item.textContent.toLowerCase();
        var match = !q || text.indexOf(q) !== -1;
        item.classList.toggle('is-hidden', !match);
        if (match) visibleCount++;
      });
      faqCategoryLabels.forEach(function (label) {
        var next = label.nextElementSibling;
        var hasVisible = false;
        while (next && !next.classList.contains('faq-category-label')) {
          if (next.classList.contains('faq-item') && !next.classList.contains('is-hidden')) hasVisible = true;
          next = next.nextElementSibling;
        }
        label.style.display = hasVisible ? '' : 'none';
      });
      if (faqEmpty) faqEmpty.style.display = visibleCount === 0 ? 'block' : 'none';
    });
  }

  /* ---------------- generic drag-scroll carousels ---------------- */
  document.querySelectorAll('[data-carousel]').forEach(function (track) {
    var isDown = false, startX, scrollStart;
    track.addEventListener('pointerdown', function (e) {
      isDown = true;
      startX = e.pageX;
      scrollStart = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      track.scrollLeft = scrollStart - (e.pageX - startX);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evt) {
      track.addEventListener(evt, function () { isDown = false; });
    });
  });

  document.querySelectorAll('[data-carousel-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetSel = btn.getAttribute('data-carousel-btn');
      var track = document.querySelector(targetSel);
      if (!track) return;
      var card = track.querySelector(':scope > *');
      var amount = card ? card.getBoundingClientRect().width + 24 : 320;
      track.scrollBy({ left: btn.hasAttribute('data-dir-prev') ? -amount : amount, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------------- service detail modal ---------------- */
  var modalBackdrop = document.querySelector('.modal-backdrop');
  var modalCard = modalBackdrop ? modalBackdrop.querySelector('.modal-card') : null;
  var lastFocused = null;

  function openModalFromTemplate(templateId) {
    var tpl = document.getElementById(templateId);
    if (!tpl || !modalBackdrop || !modalCard) return;
    modalCard.innerHTML = tpl.innerHTML;
    lastFocused = document.activeElement;
    modalBackdrop.classList.add('is-open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var closeBtn = modalCard.querySelector('[data-modal-close]');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
  }
  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('is-open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }
  document.querySelectorAll('[data-open-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      openModalFromTemplate(trigger.getAttribute('data-open-modal'));
    });
  });
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function (e) {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  /* ---------------- explore / search overlay ---------------- */
  var SITE_INDEX = [
    { title: 'Email Marketing', tag: 'Services', excerpt: 'Strategy, flows, copy and design that turn your list into revenue.', url: 'services/email-marketing.html' },
    { title: 'Website Creation', tag: 'Services', excerpt: 'Fast, on-brand websites built to convert, not just look nice.', url: 'services/website-creation.html' },
    { title: 'Google Business Profile Optimization', tag: 'Services', excerpt: 'Win the map pack and turn local searches into calls and visits.', url: 'services/google-business.html' },
    { title: 'Email list setup & lead generation', tag: 'Packages', excerpt: 'One-time Mailchimp and landing page setup, from EUR100.', url: 'services/email-marketing.html#packages' },
    { title: 'Automation email packages', tag: 'Packages', excerpt: 'Ready-made sign-up, cart abandonment, review and win-back emails, from EUR50.', url: 'services/email-marketing.html#packages' },
    { title: 'Email Marketing retainers', tag: 'Packages', excerpt: 'Ongoing Starter, Growth and Pro campaign management.', url: 'services/email-marketing.html#retainers' },
    { title: 'Website Creation packages', tag: 'Packages', excerpt: 'Ten site types from a simple bio page to full custom builds, all one-time.', url: 'services/website-creation.html#packages' },
    { title: 'Google Business Profile packages', tag: 'Packages', excerpt: 'Starter, Growth and Pro local optimisation retainers.', url: 'services/google-business.html#packages' },
    { title: 'Bundle your services', tag: 'Bundles', excerpt: 'Pair any two services, or get all three, at a bundled rate.', url: 'bundles.html' },
    { title: 'Build your own bundle (calculator)', tag: 'Bundles', excerpt: 'Pick your services and tier for an instant estimate.', url: 'bundles.html#calculator' },
    { title: 'Selected work', tag: 'Work', excerpt: 'Real results across email, web and local search.', url: 'work.html' },
    { title: 'Client reviews', tag: 'Reviews', excerpt: 'What it is like to work with AKaro Studios.', url: 'reviews.html' },
    { title: 'About AKaro Studios', tag: 'About', excerpt: 'Why we merged three disciplines under one studio.', url: 'about.html' },
    { title: 'How long until I see results?', tag: 'FAQ', excerpt: 'What to expect in the first 90 days.', url: 'faq.html#timeline' },
    { title: 'Do you offer bundle pricing?', tag: 'FAQ', excerpt: 'How combined-service discounts work.', url: 'faq.html#bundles' },
    { title: 'Get a quote', tag: 'Contact', excerpt: 'Start a conversation about your business.', url: 'contact.html' }
  ];

  var exploreOverlay = document.querySelector('.explore-overlay');
  var exploreInput = document.querySelector('.explore-input');
  var exploreResults = document.querySelector('.explore-results');
  var exploreQuicklinks = document.querySelector('.explore-quicklinks');
  var exploreLastFocused = null;

  function pathPrefix() {
    return location.pathname.indexOf('/services/') !== -1 ? '../' : '';
  }

  function renderResults(query) {
    if (!exploreResults) return;
    var q = query.trim().toLowerCase();
    if (!q) {
      exploreResults.innerHTML = '';
      exploreResults.style.display = 'none';
      if (exploreQuicklinks) exploreQuicklinks.style.display = '';
      return;
    }
    if (exploreQuicklinks) exploreQuicklinks.style.display = 'none';
    exploreResults.style.display = 'flex';
    var matches = SITE_INDEX.filter(function (item) {
      return (item.title + ' ' + item.excerpt + ' ' + item.tag).toLowerCase().indexOf(q) !== -1;
    });
    if (!matches.length) {
      exploreResults.innerHTML = '<p class="explore-empty">No matches yet. Try “bundles”, “website”, or “reviews”.</p>';
      return;
    }
    var prefix = pathPrefix();
    exploreResults.innerHTML = matches.map(function (item) {
      return '<a class="explore-result" href="' + prefix + item.url + '">' +
        '<span class="r-tag">' + item.tag + '</span>' +
        '<span class="r-title">' + item.title + '</span>' +
        '<span class="r-excerpt">' + item.excerpt + '</span>' +
        '</a>';
    }).join('');
  }

  function openExplore(prefill) {
    if (!exploreOverlay) return;
    exploreLastFocused = document.activeElement;
    exploreOverlay.classList.add('is-open');
    exploreOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (exploreInput) {
      exploreInput.value = prefill || '';
      renderResults(exploreInput.value);
      setTimeout(function () { exploreInput.focus(); }, 60);
    }
  }
  function closeExplore() {
    if (!exploreOverlay) return;
    exploreOverlay.classList.remove('is-open');
    exploreOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (exploreLastFocused) exploreLastFocused.focus();
  }
  document.querySelectorAll('[data-explore-open]').forEach(function (btn) {
    btn.addEventListener('click', function () { openExplore(); });
  });
  document.querySelectorAll('[data-explore-close]').forEach(function (btn) {
    btn.addEventListener('click', closeExplore);
  });
  if (exploreOverlay) {
    exploreOverlay.addEventListener('click', function (e) {
      if (e.target === exploreOverlay) closeExplore();
    });
  }
  if (exploreInput) {
    exploreInput.addEventListener('input', function () { renderResults(exploreInput.value); });
  }

  /* hero search box feeds the same overlay */
  var heroSearchForm = document.querySelector('[data-hero-search]');
  if (heroSearchForm) {
    heroSearchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = heroSearchForm.querySelector('.hero-search-input');
      openExplore(input ? input.value : '');
    });
  }

  document.addEventListener('keydown', function (e) {
    var meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (exploreOverlay && exploreOverlay.classList.contains('is-open')) closeExplore();
      else openExplore();
    }
    if (e.key === 'Escape') {
      if (exploreOverlay && exploreOverlay.classList.contains('is-open')) closeExplore();
      if (modalBackdrop && modalBackdrop.classList.contains('is-open')) closeModal();
      if (mobileMenu && mobileMenu.classList.contains('is-open')) closeMobileMenu();
    }
  });

  /* ---------------- toast ---------------- */
  var toastEl = document.querySelector('.toast');
  var toastTimer = null;
  function showToast(message, icon) {
    if (!toastEl) return;
    toastEl.innerHTML = '<i class="ph ' + (icon || 'ph-check-circle') + '"></i><span>' + message + '</span>';
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }
  window.akaroToast = showToast;

  /* ---------------- copy to clipboard ---------------- */
  document.querySelectorAll('[data-copy]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var value = el.getAttribute('data-copy');
      if (!value || !navigator.clipboard) return;
      e.preventDefault();
      navigator.clipboard.writeText(value).then(function () {
        showToast('Copied ' + value + ' to your clipboard', 'ph-check-circle');
      });
    });
  });

  /* ---------------- contact forms (main + hero mini form) ---------------- */
  document.querySelectorAll('form[data-contact-form]').forEach(function (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      contactForm.querySelectorAll('[required]').forEach(function (field) {
        var wrap = field.closest('.form-field');
        var ok = field.value.trim().length > 0;
        if (field.type === 'email' && ok) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        if (wrap) wrap.classList.toggle('has-error', !ok);
        if (!ok) valid = false;
      });
      var status = contactForm.querySelector('.form-status');
      if (!valid) {
        if (status) {
          status.innerHTML = '<i class="ph ph-warning-circle"></i><span>Please fill in the highlighted fields before sending.</span>';
          status.classList.add('is-visible');
        }
        return;
      }
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="ph ph-circle-notch" style="animation:spin 0.8s linear infinite;"></i> Sending...';
      }
      var payload = {
        name: contactForm.querySelector('#name') ? contactForm.querySelector('#name').value.trim() : '',
        email: contactForm.querySelector('#email') ? contactForm.querySelector('#email').value.trim() : '',
        company: contactForm.querySelector('#company') ? contactForm.querySelector('#company').value.trim() : '',
        service: contactForm.querySelector('#package') ? contactForm.querySelector('#package').value : '',
        message: contactForm.querySelector('#message') ? contactForm.querySelector('#message').value.trim() : ''
      };
      fetch('/api/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
        .then(function () {
          if (status) {
            status.innerHTML = '<i class="ph ph-check-circle"></i><span>Thank you, your message is in. We reply to every enquiry within one business day.</span>';
            status.classList.add('is-visible');
          }
          showToast('Message sent — we’ll be in touch soon', 'ph-paper-plane-tilt');
          contactForm.reset();
        })
        .catch(function () {
          if (status) {
            status.innerHTML = '<i class="ph ph-warning-circle"></i><span>Something went wrong sending that. Please call or WhatsApp <a href="tel:+353858786327" class="btn-text">085 878 6327</a> instead.</span>';
            status.classList.add('is-visible');
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
        });
    });
  });

  /* prefill service/bundle select from query string, e.g. contact.html?bundle=complete */
  var qsSelect = document.querySelector('#package');
  if (qsSelect) {
    var qs = new URLSearchParams(location.search);
    var pre = qs.get('bundle') || qs.get('service');
    if (pre) {
      var preOpt = qsSelect.querySelector('option[value="' + pre + '"]');
      if (preOpt) qsSelect.value = pre;
    }
  }

  /* live character count for long textareas */
  document.querySelectorAll('textarea[data-maxlen]').forEach(function (ta) {
    var max = parseInt(ta.getAttribute('data-maxlen'), 10);
    var counter = ta.parentElement.querySelector('.char-count');
    if (!counter) return;
    function update() {
      var len = ta.value.length;
      counter.textContent = len + ' / ' + max;
    }
    ta.addEventListener('input', update);
    update();
  });

  /* ---------------- sub-nav scroll-spy + progress ---------------- */
  var subnav = document.querySelector('.subnav');
  if (subnav) {
    var subnavLinks = Array.prototype.slice.call(subnav.querySelectorAll('.subnav-link'));
    var sections = subnavLinks.map(function (link) {
      var id = (link.getAttribute('href') || '').replace('#', '');
      return document.getElementById(id);
    }).filter(Boolean);

    function updateSpy() {
      var offset = (nav ? nav.offsetHeight : 76) + subnav.offsetHeight + 24;
      var current = sections[0];
      sections.forEach(function (sec) {
        if (sec.getBoundingClientRect().top - offset <= 0) current = sec;
      });
      subnavLinks.forEach(function (link) {
        var id = (link.getAttribute('href') || '').replace('#', '');
        link.classList.toggle('is-active', current && id === current.id);
      });
    }
    var spyTicking = false;
    window.addEventListener('scroll', function () {
      if (!spyTicking) {
        requestAnimationFrame(function () { updateSpy(); spyTicking = false; });
        spyTicking = true;
      }
    }, { passive: true });
    updateSpy();

    subnavLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = (link.getAttribute('href') || '').replace('#', '');
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var offset = (nav ? nav.offsetHeight : 76) + subnav.offsetHeight - 4;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------------- work / reviews filter ---------------- */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var targetSel = group.getAttribute('data-filter-group');
    var items = document.querySelectorAll(targetSel);
    var buttons = group.querySelectorAll('.work-filter-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var filter = btn.getAttribute('data-filter');
        items.forEach(function (item) {
          var cat = item.getAttribute('data-category');
          item.classList.toggle('is-hidden', filter !== 'all' && cat !== filter);
        });
      });
    });
  });

  /* ---------------- back to top ---------------- */
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('is-visible', window.scrollY > 700);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- bundle pricing calculator ---------------- */
  var calc = document.querySelector('[data-calculator]');
  if (calc && window.AKARO_PRICING) {
    var PRICING = window.AKARO_PRICING;
    var checks = calc.querySelectorAll('.calc-check input');
    var tierBtns = calc.querySelectorAll('.calc-tier-btn');
    var websiteSelect = calc.querySelector('[data-website-select]');
    var activeTier = 'growth';

    function fmt(n) { return '€' + n.toLocaleString('en-US'); }

    function currentWebsiteKey() {
      return websiteSelect ? websiteSelect.value : 'trade';
    }

    function renderCalc() {
      var selected = Array.prototype.slice.call(checks).filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      checks.forEach(function (c) { c.closest('.calc-check').classList.toggle('is-checked', c.checked); });

      var websiteRow = calc.querySelector('[data-website-row]');
      if (websiteRow) websiteRow.style.display = selected.indexOf('website') !== -1 ? 'flex' : 'none';

      var resultValue = calc.querySelector('.calc-result-value');
      var resultSub = calc.querySelector('.calc-result-sub');
      var breakdown = calc.querySelector('.calc-breakdown');
      var savings = calc.querySelector('.calc-savings');
      var empty = calc.querySelector('.calc-empty');
      var resultBody = calc.querySelector('.calc-result-body');

      if (!selected.length) {
        if (resultBody) resultBody.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (resultBody) resultBody.style.display = '';
      if (empty) empty.style.display = 'none';

      var q = PRICING.quote(selected, activeTier, currentWebsiteKey());

      var parts = [];
      if (q.onetime) parts.push(fmt(q.onetime) + ' one-time');
      if (q.monthly) parts.push(fmt(q.monthly) + '/mo');
      if (resultValue) resultValue.textContent = parts.join(' + ') || '€0';
      var retainerCount = selected.filter(function (k) { return k !== 'website'; }).length;
      var subParts = [selected.length + ' service' + (selected.length > 1 ? 's' : '')];
      if (retainerCount) subParts.push(PRICING.TIER_LABELS[activeTier] + ' tier');
      if (resultSub) resultSub.textContent = subParts.join(' · ');

      if (breakdown) {
        breakdown.innerHTML = selected.map(function (key) {
          if (key === 'website') {
            var product = PRICING.getWebsiteProduct(currentWebsiteKey());
            return '<div class="calc-breakdown-row"><span>' + product.name + '</span><span>' + fmt(product.price) + ' one-time</span></div>';
          }
          var svc = PRICING.SERVICES[key];
          var price = svc.tiers[activeTier];
          return '<div class="calc-breakdown-row"><span>' + svc.label + '</span><span>' + fmt(price) + '/mo</span></div>';
        }).join('');
      }

      if (savings) {
        var totalSaved = q.savedOnetime + q.savedMonthly;
        if (totalSaved > 0) {
          savings.style.display = 'flex';
          savings.innerHTML = '<i class="ph ph-seal-percent"></i><span>Bundling saves you ' +
            [q.savedOnetime ? fmt(q.savedOnetime) + ' one-time' : null, q.savedMonthly ? fmt(q.savedMonthly) + '/mo' : null].filter(Boolean).join(' + ') +
            ' (' + Math.round(q.discount * 100) + '% off)</span>';
        } else {
          savings.style.display = 'none';
        }
      }
    }

    checks.forEach(function (c) { c.addEventListener('change', renderCalc); });
    if (websiteSelect) websiteSelect.addEventListener('change', renderCalc);
    tierBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tierBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeTier = btn.getAttribute('data-tier');
        renderCalc();
      });
    });
    renderCalc();
  }

  /* ---------------- footer year ---------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
