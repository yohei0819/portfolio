$(function () {
  'use strict';

  // =============================================
  // 1. 初期設定
  // =============================================
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  ScrollTrigger.config({ ignoreMobileResize: true });

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DURATION = prefersReducedMotion ? 0 : undefined;

  function dur(fallback) {
    return DURATION !== undefined ? DURATION : fallback;
  }

  // DOM キャッシュ
  var $body       = $('body');
  var $header     = $('#js-header');
  var $hamburger  = $('#js-hamburger');
  var $mobileMenu = $('#js-mobile-menu');
  var $pageTop    = $('#js-page-top');
  var $navLinks   = $('.js-nav-link');
  var $modal      = $('#js-modal');

  // 定数
  var HEADER_SCROLL_THRESHOLD   = 80;
  var PAGE_TOP_SCROLL_THRESHOLD = 400;
  var FALLBACK_TIMEOUT_MS       = 5000;

  var HEADER_OFFSET = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10
  ) || 80;

  // モバイル判定（共通で使用）
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
                || (navigator.maxTouchPoints > 1 && window.innerWidth <= 900);

  // =============================================
  // 2. ローディング
  // =============================================
  
  // アニメーション対象要素のセレクタリスト（初期設定とフォールバックで共用）
  var ANIMATION_TARGETS = [
    '.hero__greeting', '.hero__name-line', '.hero__title',
    '.hero__description', '.hero__cta', '.hero__scroll-indicator',
    '.section__number', '.about__text', '.about__skills',
    '.about__info-item', '.skill-card', '.work-card',
    '.contact__lead', '.form-group', '.timeline__item',
    '.works-filter'
  ];

  // アニメーション対象要素の初期状態を設定（CSS から削除した opacity: 0 を JS で管理）
  gsap.set(ANIMATION_TARGETS, { opacity: 0 });

  // ローダー完了とページロード完了の両方を待ってからアニメーション初期化
  var isLoaderDone = false;
  var isPageLoaded = false;
  var isAnimationsInitialized = false;

  function tryInitAnimations() {
    // 二重初期化を防ぐガード
    if (isAnimationsInitialized) return;
    if (!isLoaderDone || !isPageLoaded) return;
    
    isAnimationsInitialized = true;
    
    initHeroAnimation();
    initParticles();
    initTextSplit();
    initScrollAnimations();

    // レイアウト安定後に一度だけ refresh（過剰な refresh はパフォーマンスに悪影響）
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ScrollTrigger.refresh(true);
      });
    });
  }

  var loaderTl = gsap.timeline({
    onComplete: function () {
      isLoaderDone = true;
      tryInitAnimations();
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
      force3D: true,
      delay: 0.2
    })
    .set('#js-loader', { display: 'none' });

  window.addEventListener('load', function () {
    isPageLoaded = true;
    tryInitAnimations();
  });

  // フォールバックタイマー: 指定時間後にまだ opacity: 0 の要素があれば強制表示
  setTimeout(function () {
    // ANIMATION_TARGETS に split-char を追加（initTextSplit で動的に生成される）
    var fallbackSelectors = ANIMATION_TARGETS.concat(['.split-char']);
    var elementsToShow = [];
    
    // 最初にすべての要素をチェック（layout recalculation を最小化）
    fallbackSelectors.forEach(function (selector) {
      var elements = document.querySelectorAll(selector);
      elements.forEach(function (el) {
        var computedOpacity = parseFloat(getComputedStyle(el).opacity);
        if (computedOpacity === 0) {
          elementsToShow.push(el);
        }
      });
    });
    
    // バッチで opacity を設定
    if (elementsToShow.length > 0) {
      gsap.set(elementsToShow, { opacity: 1, y: 0, x: 0 });
      ScrollTrigger.refresh(true);
    }
  }, FALLBACK_TIMEOUT_MS);

  // =============================================
  // 3. ヒーローアニメーション + タイピング
  // =============================================
  function initHeroAnimation() {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.hero__name-line',
        { yPercent: 120, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: dur(1), stagger: 0.15, force3D: true }
      )
      .fromTo('.hero__greeting',
        { opacity: 0 },
        { opacity: 1, duration: dur(0.6), force3D: true },
        '-=0.6'
      )
      .fromTo('#js-typing',
        { opacity: 0 },
        { opacity: 1, duration: dur(0.3), force3D: true, onComplete: startTyping },
        '-=0.2'
      )
      .fromTo('.hero__description',
        { opacity: 0 },
        { opacity: 1, duration: dur(0.6), force3D: true },
        '+=0.5'
      )
      .fromTo('.hero__cta',
        { opacity: 0 },
        { opacity: 1, duration: dur(0.6), force3D: true },
        '-=0.3'
      )
      .fromTo('.hero__scroll-indicator',
        { opacity: 0 },
        { opacity: 1, duration: dur(0.6), force3D: true },
        '-=0.3'
      );
  }

  function startTyping() {
    var TYPING_TEXT        = 'Frontend Coder';
    var TYPING_INTERVAL_MS = 80;
    var CURSOR_LINGER_MS   = 3000;
    var $typingText = $('.hero__typing-text');
    var $cursor     = $('.hero__typing-cursor');

    if (prefersReducedMotion) {
      $typingText.text(TYPING_TEXT);
      $cursor.addClass('is-done');
      return;
    }

    var charIndex = 0;
    var timer = setInterval(function () {
      charIndex++;
      $typingText.text(TYPING_TEXT.substring(0, charIndex));
      if (charIndex >= TYPING_TEXT.length) {
        clearInterval(timer);
        setTimeout(function () {
          $cursor.addClass('is-done');
        }, CURSOR_LINGER_MS);
      }
    }, TYPING_INTERVAL_MS);
  }

  // =============================================
  // 4. パーティクル背景（最適化版）
  // =============================================
  function initParticles() {
    if (isMobile) return;

    var canvas = document.getElementById('js-particles');
    if (!canvas || prefersReducedMotion) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var heroEl = canvas.parentElement;
    var particles = [];
    var animFrameId = null;

    // キャッシュされたキャンバスサイズ（毎フレームのDOM参照を回避）
    var cachedW = 0;
    var cachedH = 0;

    var CONFIG = {
      count:        80,          // 200→80に削減（見た目は十分）
      connectDist:  100,         // 接続距離を短縮
      connectDistSq: 10000,      // connectDist^2（sqrt回避用）
      maxSpeed:     0.8,
      friction:     0.98,
      driftThresh:  0.4,
      driftForce:   0.2,
      radiusRestore: 0.05,
      dotAlpha:     0.4,
      lineAlpha:    0.15,
      mouse: {
        radius:     150,
        radiusSq:   22500,       // radius^2
        force:      2,
        lineDist:   180,
        lineDistSq: 32400,       // lineDist^2
        lineAlpha:  0.3,
        lineWidth:  0.8,
        glowScale:  2,
        glowAlpha:  0.5
      }
    };

    // 空間グリッド（O(n²)→O(n)近似）
    var gridCellSize = CONFIG.connectDist;
    var gridCols = 0;
    var gridRows = 0;
    var grid = [];

    var ACCENT_RGB = '0,212,255';
    var mouse = { x: -9999, y: -9999, active: false };

    // 事前計算した色文字列キャッシュ
    var colorCache = {};
    function rgba(alpha) {
      var key = (alpha * 100 | 0);
      if (!colorCache[key]) {
        colorCache[key] = 'rgba(' + ACCENT_RGB + ',' + alpha.toFixed(2) + ')';
      }
      return colorCache[key];
    }

    function distSq(ax, ay, bx, by) {
      var dx = ax - bx;
      var dy = ay - by;
      return dx * dx + dy * dy;
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cachedW = heroEl.offsetWidth;
      cachedH = heroEl.offsetHeight;

      if (cachedW === 0 || cachedH === 0) return;

      canvas.width  = cachedW * dpr;
      canvas.height = cachedH * dpr;
      canvas.style.width  = cachedW + 'px';
      canvas.style.height = cachedH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // グリッドサイズ更新
      gridCols = Math.ceil(cachedW / gridCellSize) + 1;
      gridRows = Math.ceil(cachedH / gridCellSize) + 1;
    }

    function createParticles() {
      if (cachedW === 0 || cachedH === 0) return;

      particles = [];
      for (var i = 0; i < CONFIG.count; i++) {
        var r = Math.random() * 1.5 + 0.5;
        particles.push({
          x: Math.random() * cachedW,
          y: Math.random() * cachedH,
          vx: (Math.random() - 0.5) * CONFIG.maxSpeed,
          vy: (Math.random() - 0.5) * CONFIG.maxSpeed,
          r: r,
          baseR: r
        });
      }
    }

    function buildGrid() {
      var len = gridCols * gridRows;
      grid = new Array(len);
      for (var i = 0; i < len; i++) grid[i] = [];

      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        var col = (p.x / gridCellSize) | 0;
        var row = (p.y / gridCellSize) | 0;
        if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
          grid[row * gridCols + col].push(j);
        }
      }
    }

    function drawParticleLinks() {
      var maxDistSq = CONFIG.connectDistSq;
      var maxDist = CONFIG.connectDist;

      ctx.lineWidth = 0.5;
      ctx.beginPath();

      for (var row = 0; row < gridRows; row++) {
        for (var col = 0; col < gridCols; col++) {
          var cellIdx = row * gridCols + col;
          var cell = grid[cellIdx];
          if (!cell.length) continue;

          // 自セル＋隣接4方向（右、下、右下、左下）のみチェック
          var neighbors = [cellIdx];
          if (col + 1 < gridCols) neighbors.push(cellIdx + 1);
          if (row + 1 < gridRows) neighbors.push(cellIdx + gridCols);
          if (col + 1 < gridCols && row + 1 < gridRows) neighbors.push(cellIdx + gridCols + 1);
          if (col - 1 >= 0 && row + 1 < gridRows) neighbors.push(cellIdx + gridCols - 1);

          for (var ci = 0; ci < cell.length; ci++) {
            var ai = cell[ci];
            var a = particles[ai];

            for (var ni = 0; ni < neighbors.length; ni++) {
              var nCell = grid[neighbors[ni]];
              var startJ = (neighbors[ni] === cellIdx) ? ci + 1 : 0;

              for (var cj = startJ; cj < nCell.length; cj++) {
                var b = particles[nCell[cj]];
                var dSq = distSq(a.x, a.y, b.x, b.y);
                if (dSq >= maxDistSq) continue;

                var alpha = (1 - Math.sqrt(dSq) / maxDist) * CONFIG.lineAlpha;
                ctx.strokeStyle = rgba(alpha);
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
              }
            }
          }
        }
      }
      ctx.stroke();
    }

    function drawMouseLinks() {
      if (!mouse.active) return;
      var mc = CONFIG.mouse;
      var maxDistSq = mc.lineDistSq;
      var maxDist = mc.lineDist;

      ctx.lineWidth = mc.lineWidth;
      ctx.beginPath();

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var dSq = distSq(p.x, p.y, mouse.x, mouse.y);
        if (dSq >= maxDistSq) continue;

        var alpha = (1 - Math.sqrt(dSq) / maxDist) * mc.lineAlpha;
        ctx.strokeStyle = rgba(alpha);
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    function updateAndDrawParticles() {
      var w = cachedW;
      var h = cachedH;
      var mc = CONFIG.mouse;
      var defaultFill = rgba(CONFIG.dotAlpha);
      var TWO_PI = Math.PI * 2;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        var interacted = false;
        if (mouse.active) {
          var dSq = distSq(p.x, p.y, mouse.x, mouse.y);
          if (dSq < mc.radiusSq && dSq > 0) {
            var dist = Math.sqrt(dSq);
            var ratio = 1 - dist / mc.radius;
            var force = ratio * mc.force;
            p.vx += ((p.x - mouse.x) / dist) * force;
            p.vy += ((p.y - mouse.y) / dist) * force;
            p.r = p.baseR * (1 + ratio * mc.glowScale);
            ctx.fillStyle = rgba(CONFIG.dotAlpha + ratio * mc.glowAlpha);
            interacted = true;
          }
        }
        if (!interacted) {
          p.r += (p.baseR - p.r) * CONFIG.radiusRestore;
          ctx.fillStyle = defaultFill;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TWO_PI);
        ctx.fill();

        p.vx *= CONFIG.friction;
        p.vy *= CONFIG.friction;

        var speedSq = p.vx * p.vx + p.vy * p.vy;
        var driftThreshSq = CONFIG.maxSpeed * CONFIG.driftThresh;
        driftThreshSq *= driftThreshSq;
        if (speedSq < driftThreshSq) {
          p.vx += (Math.random() - 0.5) * CONFIG.driftForce;
          p.vy += (Math.random() - 0.5) * CONFIG.driftForce;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, cachedW, cachedH);
      buildGrid();
      drawParticleLinks();
      drawMouseLinks();
      updateAndDrawParticles();

      animFrameId = requestAnimationFrame(draw);
    }

    function rebuild() {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      resize();
      createParticles();
      animFrameId = requestAnimationFrame(draw);
    }

    // マウスイベントはthrottle（getBoundingClientRectのキャッシュ）
    var heroRect = null;
    var rectTimer = null;
    function updateRect() {
      heroRect = heroEl.getBoundingClientRect();
    }

    heroEl.addEventListener('mousemove', function (e) {
      if (!heroRect) updateRect();
      mouse.x = e.clientX - heroRect.left;
      mouse.y = e.clientY - heroRect.top;
      mouse.active = true;
    });

    heroEl.addEventListener('mouseleave', function () {
      mouse.active = false;
    });

    heroEl.addEventListener('touchmove', function (e) {
      if (e.touches.length > 0) {
        if (!heroRect) updateRect();
        mouse.x = e.touches[0].clientX - heroRect.left;
        mouse.y = e.touches[0].clientY - heroRect.top;
        mouse.active = true;
      }
    }, { passive: true });

    heroEl.addEventListener('touchend', function () {
      mouse.active = false;
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      heroRect = null; // リサイズ時にrectキャッシュ無効化
      resizeTimer = setTimeout(rebuild, 200);
    });

    window.addEventListener('scroll', function () {
      heroRect = null; // スクロール時にrectキャッシュ無効化
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      } else {
        if (!animFrameId) {
          animFrameId = requestAnimationFrame(draw);
        }
      }
    });

    setTimeout(rebuild, 50);
  }

  // =============================================
  // 5. テキストスプリットアニメーション
  // =============================================
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function initTextSplit() {
    document.querySelectorAll('.js-split-text').forEach(function (el) {
      var nodes = Array.from(el.childNodes);
      var html = '';

      nodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          var text = node.textContent;
          for (var i = 0; i < text.length; i++) {
            if (text[i] === ' ') {
              html += ' ';
            } else {
              html += '<span class="split-char">' + escapeHtml(text[i]) + '</span>';
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          var clone = node.cloneNode(true);
          clone.classList.add('split-char');
          html += clone.outerHTML;
        }
      });

      el.innerHTML = html;

      var chars = el.querySelectorAll('.split-char');

      gsap.fromTo(chars,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: dur(0.5),
          stagger: 0.03,
          ease: 'power3.out',
          force3D: true,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
  }

  // =============================================
  // 6. スクロールアニメーション【大幅修正】
  // =============================================
  function initScrollAnimations() {
    /**
     * 【修正ポイント】
     * 旧: gsap.set() で opacity:0 → ScrollTrigger の onEnter で gsap.to()
     * 問題: ローダー完了時に既にビューポート内の要素は onEnter が発火せず
     *       永久に opacity:0 のまま（特にスマホで画面が小さく要素が見えている場合）
     *
     * 新: gsap.fromTo() + scrollTrigger オプションを使用
     *     → GSAP が自動的にビューポート内の要素を即座にアニメーション開始してくれる
     *     → toggleActions で "play none none none" を指定し 1 回だけ実行
     */
    function fadeIn(targets, triggerEl, vars) {
      var start    = (vars && vars.start) || 'top 85%';
      var x        = (vars && vars.x) || 0;
      var y        = (vars && vars.y !== undefined) ? vars.y : 40;
      var duration = (vars && vars.duration) || dur(0.8);
      var delay    = (vars && vars.delay) || 0;
      var ease     = (vars && vars.ease) || 'power3.out';

      gsap.fromTo(targets,
        {
          opacity: 0,
          y: y,
          x: x
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: duration,
          delay: delay,
          ease: ease,
          force3D: true,
          scrollTrigger: {
            trigger: triggerEl || targets,
            start: start,
            toggleActions: 'play none none none'
          }
        }
      );
    }

    /**
     * 複数要素の順次フェードイン
     */
    function staggerFadeIn(selector, vars) {
      var opts = vars || {};
      var staggerDelay = opts.staggerDelay !== undefined ? opts.staggerDelay : 0.1;

      gsap.utils.toArray(selector).forEach(function (el, i) {
        var fadeInVars = { delay: i * staggerDelay };
        for (var key in opts) {
          if (opts.hasOwnProperty(key) && key !== 'staggerDelay') {
            fadeInVars[key] = opts[key];
          }
        }
        fadeIn(el, el, fadeInVars);
      });
    }

    // セクション番号
    staggerFadeIn('.section__number', { staggerDelay: 0 });

    // About
    fadeIn('.about__text', '.about__text', { x: -40, y: 0, start: 'top 80%' });
    fadeIn('.about__skills', '.about__skills', { x: 40, y: 0, delay: 0.2, start: 'top 80%' });
    staggerFadeIn('.skill-card', { y: 20, duration: dur(0.5), staggerDelay: 0.08 });
    staggerFadeIn('.about__info-item', { x: -20, y: 0, duration: dur(0.5) });

    // Timeline
    staggerFadeIn('.timeline__item', { x: -30, y: 0, duration: dur(0.6), staggerDelay: 0.15 });

    // Works
    fadeIn('.works-filter', '.works-filter', { y: 20, duration: dur(0.5) });
    staggerFadeIn('.work-card', { y: 60, staggerDelay: 0.15 });

    // Contact
    fadeIn('.contact__lead', '.contact__lead', { y: 30, duration: dur(0.6) });
    staggerFadeIn('.form-group', { y: 30, duration: dur(0.5) });
  }

  // =============================================
  // 7. ヘッダー / ページトップ / ナビ
  // =============================================
  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        handleScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  function handleScroll() {
    var scrollY = window.scrollY;
    $header.toggleClass('is-scrolled', scrollY > HEADER_SCROLL_THRESHOLD);
    $pageTop.toggleClass('is-visible', scrollY > PAGE_TOP_SCROLL_THRESHOLD);
  }

  $pageTop.on('click', function () {
    gsap.to(window, {
      scrollTo: { y: 0, autoKill: false },
      duration: dur(1),
      ease: 'power3.inOut'
    });
  });

  var NAV_SECTIONS = ['#about', '#works', '#contact'];

  NAV_SECTIONS.forEach(function (id) {
    ScrollTrigger.create({
      trigger: id,
      start: 'top center',
      end: 'bottom center',
      onEnter: function ()     { setActiveNav(id); },
      onEnterBack: function () { setActiveNav(id); }
    });
  });

  function setActiveNav(id) {
    $navLinks.removeClass('is-active');
    $navLinks.filter('[href="' + id + '"]').addClass('is-active');
  }

  // =============================================
  // 8. ハンバーガーメニュー
  // =============================================
  var scrollLockCount = 0;

  function lockScroll() {
    scrollLockCount++;
    if (scrollLockCount === 1) {
      $body.css('overflow', 'hidden');
    }
  }

  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      $body.css('overflow', '');
    }
  }

  function openMenu() {
    $hamburger.addClass('is-active')
              .attr({ 'aria-expanded': 'true', 'aria-label': 'メニューを閉じる' });
    $mobileMenu.addClass('is-active').attr('aria-hidden', 'false');
    lockScroll();
  }

  function closeMenu() {
    $hamburger.removeClass('is-active')
              .attr({ 'aria-expanded': 'false', 'aria-label': 'メニューを開く' });
    $mobileMenu.removeClass('is-active').attr('aria-hidden', 'true');
    unlockScroll();
  }

  $hamburger.on('click', function () {
    $mobileMenu.hasClass('is-active') ? closeMenu() : openMenu();
  });

  $mobileMenu.on('click', 'a', function () {
    closeMenu();
  });

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') {
      if ($modal.hasClass('is-active')) {
        closeModal();
      } else if ($mobileMenu.hasClass('is-active')) {
        closeMenu();
        $hamburger.trigger('focus');
      }
    }
  });

  // =============================================
  // 9. スムーススクロール
  // =============================================
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

  // =============================================
  // 10. Works フィルター
  // =============================================
  var $filterBtns = $('#js-works-filter .works-filter__btn');
  var $workCards  = $('.js-work-card');

  $filterBtns.on('click', function () {
    var $btn   = $(this);
    var filter = $btn.data('filter');

    if ($btn.hasClass('is-active')) return;

    $filterBtns.removeClass('is-active');
    $btn.addClass('is-active');

    $workCards.each(function () {
      var $card = $(this);
      var tags  = String($card.data('tags')).split(',');
      var shouldShow = (filter === 'all') || tags.indexOf(filter) !== -1;

      gsap.killTweensOf($card[0]);

      if (shouldShow) {
        $card.removeClass('is-hidden');
        gsap.to($card[0], {
          opacity: 1,
          scale: 1,
          duration: dur(0.4),
          ease: 'power2.out',
          force3D: true
        });
      } else {
        if ($card.hasClass('is-hidden')) return;
        gsap.to($card[0], {
          opacity: 0,
          scale: 0.9,
          duration: dur(0.3),
          ease: 'power2.in',
          force3D: true,
          onComplete: function () {
            $card.addClass('is-hidden');
          }
        });
      }
    });
  });

  // =============================================
  // 11. Works モーダル
  // =============================================
  var $lastDetailTrigger = null;
  var $modalContainer  = $modal.find('.modal__container');

  function openModal($card) {
    $('#js-modal-title').text($card.find('.work-card__title').text());
    $('#js-modal-role').text($card.data('detail-role'));
    $('#js-modal-period').text($card.data('detail-period'));
    $('#js-modal-point').text($card.data('detail-point'));

    var tags = String($card.data('tags')).split(',');
    var $tagsWrap = $('#js-modal-tags').empty();
    tags.forEach(function (t) {
      $('<span>', { 'class': 'tag', text: t.trim() }).appendTo($tagsWrap);
    });

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
    var $card = $(this).closest('.js-work-card');
    openModal($card);
  });

  $(document).on('click', '.js-modal-close', function () {
    closeModal();
  });

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

  // =============================================
  // 12. フォームバリデーション
  // =============================================
  var $contactForm = $('#js-contact-form');
  var emailRegex   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateField($field) {
    var value      = $field.val().trim();
    var isRequired = $field.prop('required');
    var $error     = $field.siblings('.form-group__error');

    if (isRequired && value === '') {
      $field.addClass('is-error');
      $error.text($field.data('error-empty') || '入力してください');
      return false;
    }

    if ($field.attr('type') === 'email' && value !== '' && !emailRegex.test(value)) {
      $field.addClass('is-error');
      $error.text($field.data('error-format') || '正しいメールアドレスを入力してください');
      return false;
    }

    $field.removeClass('is-error');
    $error.text('');
    return true;
  }

  $contactForm.on('input', 'input, textarea', function () {
    var $el = $(this);
    if ($el.hasClass('is-error')) {
      validateField($el);
    }
  });

  $contactForm.on('blur', 'input[required], textarea[required]', function () {
    validateField($(this));
  });

  $contactForm.on('submit', function (e) {
    e.preventDefault();

    var isValid = true;
    $(this).find('input[required], textarea[required], input[type="email"]').each(function () {
      if (!validateField($(this))) {
        isValid = false;
      }
    });

    if (!isValid) {
      $(this).find('.is-error').first().trigger('focus');
      return;
    }

    var $btn = $(this).find('.btn--submit');
    var originalText = $btn.find('span').text();

    $btn.prop('disabled', true);
    $btn.find('span').text('送信中...');

    setTimeout(function () {
      $btn.find('span').text(originalText);
      $btn.prop('disabled', false);
      $('#js-form-success').text('送信が完了しました。ありがとうございます！');
      $contactForm[0].reset();

      $contactForm.find('.is-error').removeClass('is-error');
      $contactForm.find('.form-group__error').text('');

      setTimeout(function () {
        $('#js-form-success').text('');
      }, 5000);
    }, 2000);
  });

  // =============================================
  // 13. カスタムカーソル（PC ホバー��境のみ）
  // =============================================
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
    }, { passive: true });

    $(document).on('mouseenter', 'a, button, .work-card', function () {
      $cursor.addClass('is-hover');
    }).on('mouseleave', 'a, button, .work-card', function () {
      $cursor.removeClass('is-hover');
    });
  }
});