$(function () {
  'use strict';

  /* ================================================
     0. Safe init wrapper
     ================================================ */
  function safeInit(name, fn) {
    try {
      fn();
    } catch (e) {
      console.error('[Portfolio] ' + name + ' failed:', e);
    }
  }

  /* ================================================
     1. GSAP plugin & config
     ================================================ */
  gsap.registerPlugin(ScrollToPlugin);

  var prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  function dur(v) {
    return prefersReducedMotion ? 0 : v;
  }

  /* ================================================
     DOM cache
     ================================================ */
  var $body       = $('body');
  var $header     = $('#js-header');
  var $hamburger  = $('#js-hamburger');
  var $mobileMenu = $('#js-mobile-menu');
  var $pageTop    = $('#js-page-top');
  var $navLinks   = $('.js-nav-link');
  var $modal      = $('#js-modal');

  var HEADER_SCROLL_THRESHOLD   = 80;
  var PAGE_TOP_SCROLL_THRESHOLD = 400;
  var HEADER_OFFSET = 80;

  try {
    var h = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--header-height'), 10
    );
    if (h > 0) HEADER_OFFSET = h;
  } catch (ignore) {}

  /* ================================================
     2. IntersectionObserver helper
     ================================================ */
  function observeOnce(el, callback, rootMargin) {
    if (!window.IntersectionObserver) {
      callback(el);
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            callback(entries[i].target);
            observer.unobserve(entries[i].target);
          }
        }
      },
      { rootMargin: rootMargin || '0px 0px -15% 0px', threshold: 0 }
    );
    observer.observe(el);
  }

  /* ================================================
     3. Loader
     ================================================ */
  var loaderTl = gsap.timeline({
    onComplete: function () {
      safeInit('hero',       initHeroAnimation);
      safeInit('textSplit',  initTextSplit);
      safeInit('scrollAnim', initScrollAnimations);
      safeInit('navHL',      initNavHighlight);

      setTimeout(revealHiddenElements, 4000);
    }
  });

  loaderTl
    .to('.loader__bar-fill', {
      width: '100%',
      duration: dur(1.5),
      ease: 'power2.inOut'
    })
    .to('#js-loader', {
      yPercent: -100,
      duration: dur(0.8),
      ease: 'power3.inOut',
      delay: 0.2
    })
    .set('#js-loader', { display: 'none' });

  /* ================================================
     4. Reveal fallback
     ================================================ */
  function revealHiddenElements() {
    var selectors =
      '.hero__greeting,.hero__name-line,.hero__title,' +
      '.hero__description,.hero__cta,.hero__scroll-indicator,' +
      '.section__number,.about__text,.about__skills,' +
      '.skill-card,.about__info-item,.timeline__item,' +
      '.works-filter,.work-card,.contact__lead,' +
      '.form-group,.split-char';

    var all = document.querySelectorAll(selectors);
    for (var i = 0; i < all.length; i++) {
      var op = parseFloat(window.getComputedStyle(all[i]).opacity);
      if (op < 0.1) {
        all[i].style.opacity = '1';
        all[i].style.transform = 'none';
      }
    }
  }

  /* ================================================
     5. Hero animation
     ================================================ */
  function initHeroAnimation() {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
        '.hero__name-line',
        { yPercent: 120 },
        { yPercent: 0, duration: dur(1), stagger: 0.15 }
      )
      .fromTo(
        '.hero__greeting',
        { opacity: 0 },
        { opacity: 1, duration: dur(0.6) },
        '-=0.6'
      )
      .fromTo(
        '#js-typing',
        { opacity: 0 },
        { opacity: 1, duration: dur(0.3), onComplete: startTyping },
        '-=0.2'
      )
      .fromTo(
        '.hero__description',
        { opacity: 0 },
        { opacity: 1, duration: dur(0.6) },
        '+=0.5'
      )
      .fromTo(
        '.hero__cta',
        { opacity: 0 },
        { opacity: 1, duration: dur(0.6) },
        '-=0.3'
      )
      .fromTo(
        '.hero__scroll-indicator',
        { opacity: 0 },
        { opacity: 1, duration: dur(0.6) },
        '-=0.3'
      );
  }

  /* ================================================
     6. Typing effect
     ================================================ */
  function startTyping() {
    var TEXT    = 'Frontend Coder';
    var SPEED   = 80;
    var LINGER  = 3000;
    var $txt    = $('.hero__typing-text');
    var $cursor = $('.hero__typing-cursor');

    if (prefersReducedMotion) {
      $txt.text(TEXT);
      $cursor.addClass('is-done');
      return;
    }

    var idx = 0;
    var timer = setInterval(function () {
      idx++;
      $txt.text(TEXT.substring(0, idx));
      if (idx >= TEXT.length) {
        clearInterval(timer);
        setTimeout(function () { $cursor.addClass('is-done'); }, LINGER);
      }
    }, SPEED);
  }

  /* ================================================
     7. Text split animation
     ================================================ */
  var HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(ch) {
    return HTML_ESCAPE_MAP[ch] || ch;
  }

  function initTextSplit() {
    var targets = document.querySelectorAll('.js-split-text');

    for (var t = 0; t < targets.length; t++) {
      (function (el) {
        var children = el.childNodes;
        var html = '';

        for (var n = 0; n < children.length; n++) {
          var node = children[n];
          if (node.nodeType === 3) {
            var text = node.textContent;
            for (var c = 0; c < text.length; c++) {
              html += text[c] === ' '
                ? ' '
                : '<span class="split-char">' + escapeHtml(text[c]) + '</span>';
            }
          } else if (node.nodeType === 1) {
            var clone = node.cloneNode(true);
            clone.className =
              (clone.className ? clone.className + ' ' : '') + 'split-char';
            html += clone.outerHTML;
          }
        }

        el.innerHTML = html;

        var chars = el.querySelectorAll('.split-char');
        gsap.set(chars, { opacity: 0, y: 20 });

        observeOnce(el, function () {
          gsap.to(chars, {
            opacity: 1,
            y: 0,
            duration: dur(0.5),
            stagger: 0.05,
            ease: 'power3.out'
          });
        });
      })(targets[t]);
    }
  }

  /* ================================================
     8. Scroll animations (IntersectionObserver)
     ================================================ */
  function initScrollAnimations() {

    function fadeIn(selector, opts) {
      var o        = opts || {};
      var fromY    = o.y !== undefined ? o.y : 40;
      var fromX    = o.x || 0;
      var duration = o.duration || dur(0.8);
      var delay    = o.delay || 0;
      var ease     = o.ease || 'power3.out';

      var els = document.querySelectorAll(selector);
      for (var i = 0; i < els.length; i++) {
        (function (el) {
          gsap.set(el, { opacity: 0, y: fromY, x: fromX });
          observeOnce(el, function (target) {
            gsap.to(target, {
              opacity: 1, y: 0, x: 0,
              duration: duration, delay: delay, ease: ease
            });
          });
        })(els[i]);
      }
    }

    function staggerFadeIn(selector, opts) {
      var o        = opts || {};
      var fromY    = o.y !== undefined ? o.y : 40;
      var fromX    = o.x || 0;
      var duration = o.duration || dur(0.8);
      var stagger  = o.stagger !== undefined ? o.stagger : 0.1;
      var ease     = o.ease || 'power3.out';

      var els = document.querySelectorAll(selector);
      if (!els.length) return;

      gsap.set(els, { opacity: 0, y: fromY, x: fromX });

      observeOnce(els[0], function () {
        gsap.to(els, {
          opacity: 1, y: 0, x: 0,
          duration: duration, stagger: stagger, ease: ease
        });
      });
    }

    fadeIn('.section__number');

    fadeIn('.about__text',   { x: -40, y: 0 });
    fadeIn('.about__skills', { x: 40,  y: 0 });
    staggerFadeIn('.skill-card',       { y: 20, duration: dur(0.5), stagger: 0.08 });
    staggerFadeIn('.about__info-item', { x: -20, y: 0, duration: dur(0.5) });

    staggerFadeIn('.timeline__item', { x: -30, y: 0, duration: dur(0.6), stagger: 0.15 });

    fadeIn('.works-filter', { y: 20, duration: dur(0.5) });
    staggerFadeIn('.work-card', { y: 60, stagger: 0.15 });

    fadeIn('.contact__lead', { y: 30, duration: dur(0.6) });
    staggerFadeIn('.form-group', { y: 30, duration: dur(0.5) });
  }

  /* ================================================
     9. Nav highlight (IntersectionObserver)
     ================================================ */
  function initNavHighlight() {
    if (!window.IntersectionObserver) return;

    var ids = ['about', 'works', 'contact'];

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            var id = '#' + entries[i].target.id;
            $navLinks.removeClass('is-active');
            $navLinks.filter('[href="' + id + '"]').addClass('is-active');
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );

    for (var i = 0; i < ids.length; i++) {
      var sec = document.getElementById(ids[i]);
      if (sec) observer.observe(sec);
    }
  }

  /* ================================================
     10. Header scroll / Page-top button
     ================================================ */
  var scrollTicking = false;

  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset || 0;
      $header.toggleClass('is-scrolled', y > HEADER_SCROLL_THRESHOLD);
      $pageTop.toggleClass('is-visible', y > PAGE_TOP_SCROLL_THRESHOLD);
      scrollTicking = false;
    });
  }, { passive: true });

  $pageTop.on('click', function () {
    gsap.to(window, {
      scrollTo: { y: 0, autoKill: false },
      duration: dur(1),
      ease: 'power3.inOut'
    });
  });

  /* ================================================
     11. Hamburger menu
     ================================================ */
  var scrollLockCount = 0;

  function lockScroll() {
    scrollLockCount++;
    if (scrollLockCount === 1) $body.css('overflow', 'hidden');
  }

  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) $body.css('overflow', '');
  }

  function openMenu() {
    $hamburger
      .addClass('is-active')
      .attr({ 'aria-expanded': 'true', 'aria-label': 'メニューを閉じる' });
    $mobileMenu.addClass('is-active').attr('aria-hidden', 'false');
    lockScroll();
  }

  function closeMenu() {
    $hamburger
      .removeClass('is-active')
      .attr({ 'aria-expanded': 'false', 'aria-label': 'メニューを開く' });
    $mobileMenu.removeClass('is-active').attr('aria-hidden', 'true');
    unlockScroll();
  }

  $hamburger.on('click', function () {
    $mobileMenu.hasClass('is-active') ? closeMenu() : openMenu();
  });

  $mobileMenu.on('click', 'a', closeMenu);

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if ($modal.hasClass('is-active')) {
        closeModal();
      } else if ($mobileMenu.hasClass('is-active')) {
        closeMenu();
        $hamburger.trigger('focus');
      }
    }
  });

  /* ================================================
     12. Smooth scroll
     ================================================ */
  $(document).on('click', 'a[href^="#"]', function (e) {
    var href = $(this).attr('href');
    if (href === '#') return;

    e.preventDefault();
    var $target = $(href);
    if (!$target.length) return;

    gsap.to(window, {
      scrollTo: { y: $target.offset().top - HEADER_OFFSET, autoKill: false },
      duration: dur(1),
      ease: 'power3.inOut'
    });
  });

  /* ================================================
     13. Works filter
     ================================================ */
  var $filterBtns = $('#js-works-filter .works-filter__btn');
  var $workCards  = $('.js-work-card');

  $filterBtns.on('click', function () {
    var $btn   = $(this);
    var filter = $btn.data('filter');

    if ($btn.hasClass('is-active')) return;

    $filterBtns.removeClass('is-active');
    $btn.addClass('is-active');

    $workCards.each(function () {
      var $card    = $(this);
      var tags     = String($card.data('tags')).split(',');
      var show     = filter === 'all' || tags.indexOf(filter) !== -1;
      var isHidden = $card.hasClass('is-hidden');

      gsap.killTweensOf($card[0]);

      if (show) {
        if (!isHidden) return;          // 既に表示中なら何もしない
        $card.removeClass('is-hidden');
        gsap.to($card[0], {
          opacity: 1, scale: 1,
          duration: dur(0.4), ease: 'power2.out'
        });
      } else {
        if (isHidden) return;           // 既に非表示なら何もしない
        gsap.to($card[0], {
          opacity: 0, scale: 0.9,
          duration: dur(0.3), ease: 'power2.in',
          onComplete: function () { $card.addClass('is-hidden'); }
        });
      }
    });
  });

  /* ================================================
     14. Works modal
     ================================================ */
  var $lastDetailTrigger = null;
  var $modalContainer    = $modal.find('.modal__container');

  function openModal($card) {
    $('#js-modal-title').text($card.find('.work-card__title').text());
    $('#js-modal-role').text($card.data('detail-role'));
    $('#js-modal-period').text($card.data('detail-period'));
    $('#js-modal-point').text($card.data('detail-point'));

    var tags     = String($card.data('tags')).split(',');
    var $tagWrap = $('#js-modal-tags').empty();
    for (var i = 0; i < tags.length; i++) {
      $('<span>', { 'class': 'tag', text: tags[i].trim() }).appendTo($tagWrap);
    }

    $modal.addClass('is-active').attr('aria-hidden', 'false');
    lockScroll();
    $modalContainer[0].focus();
  }

  function closeModal() {
    $modal.removeClass('is-active').attr('aria-hidden', 'true');
    unlockScroll();

    if ($lastDetailTrigger) {
      $lastDetailTrigger.trigger('focus');
      $lastDetailTrigger = null;
    }
  }

  $(document).on('click', '.js-work-detail', function () {
    $lastDetailTrigger = $(this);
    openModal($(this).closest('.js-work-card'));
  });

  $(document).on('click', '.js-modal-close', closeModal);

  $modal.on('keydown', function (e) {
    if (e.key !== 'Tab') return;

    var $focusable = $modal.find('a[href], button:not([disabled]), [tabindex="-1"]');
    if (!$focusable.length) return;

    var $first = $focusable.first();
    var $last  = $focusable.last();

    if (e.shiftKey) {
      if ($(document.activeElement).is($first) || $(document.activeElement).is($modalContainer)) {
        e.preventDefault();
        $last.trigger('focus');
      }
    } else {
      if ($(document.activeElement).is($last)) {
        e.preventDefault();
        $first.trigger('focus');
      }
    }
  });

  /* ================================================
     15. Form validation
     ================================================ */
  var $form      = $('#js-contact-form');
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateField($field) {
    var value      = $field.val().trim();
    var isRequired = $field.prop('required');
    var $err       = $field.siblings('.form-group__error');

    if (isRequired && value === '') {
      $field.addClass('is-error');
      $err.text($field.data('error-empty') || '入力してください');
      return false;
    }

    if ($field.attr('type') === 'email' && value !== '' && !emailRegex.test(value)) {
      $field.addClass('is-error');
      $err.text($field.data('error-format') || '正しいメールアドレスを入力してください');
      return false;
    }

    $field.removeClass('is-error');
    $err.text('');
    return true;
  }

  $form.on('input', 'input, textarea', function () {
    var $el = $(this);
    if ($el.hasClass('is-error')) validateField($el);
  });

  $form.on('blur', 'input[required], textarea[required]', function () {
    validateField($(this));
  });

  $form.on('submit', function (e) {
    e.preventDefault();

    var ok = true;
    $(this)
      .find('input[required], textarea[required], input[type="email"]')
      .each(function () { if (!validateField($(this))) ok = false; });

    if (!ok) {
      $(this).find('.is-error').first().trigger('focus');
      return;
    }

    var $btn = $(this).find('.btn--submit');
    var orig = $btn.find('span').text();
    $btn.prop('disabled', true).find('span').text('送信中...');

    setTimeout(function () {
      $btn.find('span').text(orig);
      $btn.prop('disabled', false);
      $('#js-form-success').text('送信が完了しました。ありがとうございます！');
      $form[0].reset();
      $form.find('.is-error').removeClass('is-error');
      $form.find('.form-group__error').text('');
      setTimeout(function () { $('#js-form-success').text(''); }, 5000);
    }, 2000);
  });

  /* ================================================
     16. Custom cursor (PC only)
     ================================================ */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var $cursor = $('<div class="custom-cursor" aria-hidden="true"></div>');
    $body.append($cursor);

    document.addEventListener('mousemove', function (e) {
      gsap.to($cursor[0], {
        x: e.clientX - 10,
        y: e.clientY - 10,
        duration: 0.3,
        ease: 'power2.out'
      });
    }, false);

    $(document)
      .on('mouseenter', 'a, button, .work-card', function () {
        $cursor.addClass('is-hover');
      })
      .on('mouseleave', 'a, button, .work-card', function () {
        $cursor.removeClass('is-hover');
      });
  }
});
