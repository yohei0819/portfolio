/**
 * main.js - ポートフォリオサイト
 * jQuery + GSAP (ScrollTrigger / ScrollToPlugin)
 *
 * 構成:
 *   1.  初期設定
 *   2.  ローディング
 *   3.  ヒーローアニメーション + タイピング
 *   4.  パーティクル背景（マウスインタラクション対応）
 *   5.  テキストスプリットアニメーション
 *   6.  スクロールアニメーション
 *   7.  ヘッダー / ページトップ / ナビ
 *   8.  ハンバーガーメニュー
 *   9.  スムーススクロール
 *   10. Works フィルター
 *   11. Works モーダル
 *   12. フォームバリデーション
 *   13. カスタムカーソル
 */

$(function () {
  'use strict';

  // =============================================
  // 1. 初期設定
  // =============================================
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  // prefers-reduced-motion を尊重
  // true → DURATION = 0（即座に完了） / false → undefined（?? でデフォルト値を適用）
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION = prefersReducedMotion ? 0 : undefined;

  // DOM キャッシュ
  const $body       = $('body');
  const $header     = $('#js-header');
  const $hamburger  = $('#js-hamburger');
  const $mobileMenu = $('#js-mobile-menu');
  const $pageTop    = $('#js-page-top');
  const $navLinks   = $('.js-nav-link');
  const $modal      = $('#js-modal');

  // 定数
  const HEADER_SCROLL_THRESHOLD   = 80;
  const PAGE_TOP_SCROLL_THRESHOLD = 400;

  // CSS カスタムプロパティからヘッダー高さを取得（フォールバック: 80px）
  const HEADER_OFFSET = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10
  ) || 80;

  // =============================================
  // 2. ローディング
  // =============================================
  const loaderTl = gsap.timeline({
    onComplete() {
      initHeroAnimation();
      initParticles();
      initTextSplit();
      initScrollAnimations();

      // モバイルブラウザではローダー除去後にレイアウトが変わるため
      // ScrollTrigger の位置計算を再実行する
      requestAnimationFrame(function () {
        ScrollTrigger.refresh();
      });
    }
  });

  loaderTl
    .to('.loader__bar-fill', {
      width: '100%',
      duration: DURATION ?? 1.5,
      ease: 'power2.inOut'
    })
    .to('#js-loader', {
      yPercent: -100,
      duration: DURATION ?? 0.8,
      ease: 'power3.inOut',
      delay: 0.2
    })
    .set('#js-loader', { display: 'none' });

  // =============================================
  // 3. ヒーローアニメーション + タイピング
  // =============================================
  function initHeroAnimation() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.hero__name-line', {
        yPercent: 120,
        duration: DURATION ?? 1,
        stagger: 0.15
      })
      .to('.hero__greeting', {
        opacity: 1,
        duration: DURATION ?? 0.6
      }, '-=0.6')
      .to('#js-typing', {
        opacity: 1,
        duration: DURATION ?? 0.3,
        onComplete: startTyping
      }, '-=0.2')
      .to('.hero__description', {
        opacity: 1,
        duration: DURATION ?? 0.6
      }, '+=0.5')
      .to('.hero__cta', {
        opacity: 1,
        duration: DURATION ?? 0.6
      }, '-=0.3')
      .to('.hero__scroll-indicator', {
        opacity: 1,
        duration: DURATION ?? 0.6
      }, '-=0.3');
  }

  /**
   * タイピングエフェクト — 「Frontend Coder」を 1 文字ずつ打ち出す
   * 打ち終わったらカーソルの点滅を止め、一定時間後にカーソルをフェードアウトする
   */
  function startTyping() {
    const TYPING_TEXT        = 'Frontend Coder';
    const TYPING_INTERVAL_MS = 80;
    const CURSOR_LINGER_MS   = 3000;
    const $typingText = $('.hero__typing-text');
    const $cursor     = $('.hero__typing-cursor');

    if (prefersReducedMotion) {
      $typingText.text(TYPING_TEXT);
      $cursor.addClass('is-done');
      return;
    }

    let charIndex = 0;
    const timer = setInterval(function () {
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
  // 4. パーティクル背景
  // =============================================
  function initParticles() {
    const canvas = document.getElementById('js-particles');
    if (!canvas || prefersReducedMotion) return;

    const ctx      = canvas.getContext('2d');
    if (!ctx) return;

    const heroEl   = canvas.parentElement;
    let particles  = [];
    let animFrameId = null;

    // モバイル判定
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
                  || (navigator.maxTouchPoints > 1 && window.innerWidth <= 900);

    // --- 設定定数 ---
    const CONFIG = {
      count:        isMobile ? 50 : 200,     // パーティクル数（モバイルは軽量化）
      connectDist:  isMobile ? 80 : 120,     // パーティクル間の接続距離
      maxSpeed:     isMobile ? 0.8 : 1.2,    // 基本最大速度
      friction:     0.98,         // 摩擦係数（1 に近いほど滑らか）
      driftThresh:  0.5,          // 最低速度の閾値（maxSpeed の倍率）
      driftForce:   0.3,          // 停滞時に加えるランダム力
      radiusRestore: 0.05,        // 半径の復元速度

      dotAlpha:     isMobile ? 0.6 : 0.4,    // パーティクルの基本透明度
      lineAlpha:    0.15,         // 接続線の基本透明度

      mouse: {
        radius:     150,          // マウスの影響範囲（px）
        force:      2,            // 押し出す力の強さ
        lineDist:   180,          // マウス接続線の距離
        lineAlpha:  0.3,          // マウス接続線の透明度
        lineWidth:  0.8,          // マウス接続線の太さ
        glowScale:  2,            // マウス近接時の半径倍率
        glowAlpha:  0.5           // マウス近接時の追加透明度
      }
    };

    // アクセントカラー（RGB）
    const ACCENT_RGB = '0,212,255';

    // マウス座標（CSS ピクセル座標、heroEl 相対）
    const mouse = { x: -9999, y: -9999, active: false };

    // --- ユーティリティ ---

    /** 2 点間の距離を算出 */
    function distance(ax, ay, bx, by) {
      const dx = ax - bx;
      const dy = ay - by;
      return Math.sqrt(dx * dx + dy * dy);
    }

    /** アクセントカラーの rgba 文字列を返す */
    function rgba(alpha) {
      return 'rgba(' + ACCENT_RGB + ',' + alpha + ')';
    }

    /** 2 点間に接続線を描画する（距離がしきい値以内の場合のみ） */
    function drawLine(x1, y1, x2, y2, dist, maxDist, baseAlpha, width) {
      if (dist >= maxDist) return;
      const alpha = (1 - dist / maxDist) * baseAlpha;
      ctx.strokeStyle = rgba(alpha);
      ctx.lineWidth   = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // --- コア処理 ---

    /** キャンバスサイズを親要素に合わせる（Retina 対応） */
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // dpr上限2で省メモリ化
      const w   = heroEl.offsetWidth;
      const h   = heroEl.offsetHeight;

      if (w === 0 || h === 0) return; // レイアウト未確定なら何もしない

      canvas.width        = w * dpr;
      canvas.height       = h * dpr;
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 累積しないようリセット+スケール
    }

    /** パーティクルを生成（CSS ピクセル座標で管理） */
    function createParticles() {
      const w = heroEl.offsetWidth;
      const h = heroEl.offsetHeight;
      if (w === 0 || h === 0) return;

      particles = [];
      for (let i = 0; i < CONFIG.count; i++) {
        const r = isMobile
          ? Math.random() * 2 + 1        // モバイル: 1〜3px（視認性向上）
          : Math.random() * 1.5 + 0.5;   // PC: 0.5〜2px
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * CONFIG.maxSpeed,
          vy: (Math.random() - 0.5) * CONFIG.maxSpeed,
          r: r,
          baseR: r
        });
      }
    }

    /** パーティクル同士の接続線を描画 */
    function drawParticleLinks() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dist = distance(a.x, a.y, b.x, b.y);
          drawLine(a.x, a.y, b.x, b.y, dist, CONFIG.connectDist, CONFIG.lineAlpha, 0.5);
        }
      }
    }

    /** マウスとパーティクル間の接続線を描画 */
    function drawMouseLinks() {
      if (!mouse.active) return;
      const mc = CONFIG.mouse;
      for (let i = 0; i < particles.length; i++) {
        const p    = particles[i];
        const dist = distance(p.x, p.y, mouse.x, mouse.y);
        drawLine(mouse.x, mouse.y, p.x, p.y, dist, mc.lineDist, mc.lineAlpha, mc.lineWidth);
      }
    }

    /**
     * マウスインタラクションを適用
     * @param {Object} p    - パーティクル
     * @param {number} dist - マウスとの距離
     * @return {boolean} インタラクションが発生したか
     */
    function applyMouseInteraction(p, dist) {
      const mc = CONFIG.mouse;
      if (dist >= mc.radius || dist <= 0) return false;

      const ratio = 1 - dist / mc.radius;

      // 押し出し
      const force = ratio * mc.force;
      p.vx += ((p.x - mouse.x) / dist) * force;
      p.vy += ((p.y - mouse.y) / dist) * force;

      // グロー（サイズ＆輝度アップ）
      p.r = p.baseR * (1 + ratio * mc.glowScale);
      ctx.fillStyle = rgba(CONFIG.dotAlpha + ratio * mc.glowAlpha);
      return true;
    }

    /** 各パーティクルの描画・物理更新 */
    function updateAndDrawParticles(w, h) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // マウスインタラクション or デフォルト描画色
        let interacted = false;
        if (mouse.active) {
          const dist = distance(p.x, p.y, mouse.x, mouse.y);
          interacted = applyMouseInteraction(p, dist);
        }
        if (!interacted) {
          p.r += (p.baseR - p.r) * CONFIG.radiusRestore;
          ctx.fillStyle = rgba(CONFIG.dotAlpha);
        }

        // 描画
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // 摩擦
        p.vx *= CONFIG.friction;
        p.vy *= CONFIG.friction;

        // 停滞防止（最低速度を維持）
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < CONFIG.maxSpeed * CONFIG.driftThresh) {
          p.vx += (Math.random() - 0.5) * CONFIG.driftForce;
          p.vy += (Math.random() - 0.5) * CONFIG.driftForce;
        }

        // 位置更新
        p.x += p.vx;
        p.y += p.vy;

        // 画面端で反対側にワープ
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }
    }

    /** メイン描画ループ */
    function draw() {
      const w = heroEl.offsetWidth;
      const h = heroEl.offsetHeight;

      ctx.clearRect(0, 0, w, h);
      drawParticleLinks();
      drawMouseLinks();
      updateAndDrawParticles(w, h);

      animFrameId = requestAnimationFrame(draw);
    }

    /** キャンバスを再構築（リサイズ時） */
    function rebuild() {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      resize();
      createParticles();
      animFrameId = requestAnimationFrame(draw);
    }

    // --- イベントリスナー ---

    // マウスイベント（キャンバスは pointer-events:none のため親要素で監視）
    heroEl.addEventListener('mousemove', function (e) {
      const rect = heroEl.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });

    heroEl.addEventListener('mouseleave', function () {
      mouse.active = false;
    });

    // タッチイベント（スマホ対応）
    heroEl.addEventListener('touchmove', function (e) {
      if (e.touches.length > 0) {
        const rect = heroEl.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
        mouse.active = true;
      }
    }, { passive: true });

    heroEl.addEventListener('touchend', function () {
      mouse.active = false;
    });

    // リサイズ時にデバウンスして再構築
    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 200);
    });

    // 画面外では描画を停止してバッテリー節約
    if ('IntersectionObserver' in window) {
      var isVisible = true;
      var observer = new IntersectionObserver(function (entries) {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !animFrameId) {
          animFrameId = requestAnimationFrame(draw);
        }
      }, { threshold: 0.1 });
      observer.observe(heroEl);

      // draw 関数でスキップ判定
      var origDraw = draw;
      draw = function () {
        if (!isVisible) {
          animFrameId = null;
          return;
        }
        origDraw();
      };
    }

    // 初期化
    rebuild();
  }

  // =============================================
  // 5. テキストスプリットアニメーション
  // =============================================

  /**
   * HTML 特殊文字をエスケープ
   * @param  {string} str - 生テキスト
   * @return {string} エスケープ済み文字列
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function initTextSplit() {
    document.querySelectorAll('.js-split-text').forEach(function (el) {
      const nodes = Array.from(el.childNodes);
      let html = '';

      nodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          // テキストノード → 1 文字ずつ span で囲む
          const text = node.textContent;
          for (let i = 0; i < text.length; i++) {
            if (text[i] === ' ') {
              html += ' ';
            } else {
              html += '<span class="split-char">' + escapeHtml(text[i]) + '</span>';
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // 既存の要素ノード（<span class="u-accent"> 等）を保持
          const clone = node.cloneNode(true);
          clone.classList.add('split-char');
          html += clone.outerHTML;
        }
      });

      el.innerHTML = html;

      const chars = el.querySelectorAll('.split-char');
      gsap.set(chars, { opacity: 0, y: 20 });

      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter() {
          gsap.to(chars, {
            opacity: 1,
            y: 0,
            duration: DURATION ?? 0.5,
            stagger: 0.05,
            ease: 'power3.out'
          });
        }
      });
    });
  }

  // =============================================
  // 6. スクロールアニメーション
  // =============================================
  function initScrollAnimations() {
    /**
     * スクロールトリガー付きフェードインヘルパー
     * @param {string|Element} targets   - GSAP ターゲット
     * @param {string|Element} triggerEl - ScrollTrigger のトリガー要素
     * @param {Object}  [vars]           - tween プロパティ（start / end は scrollTrigger へ振り分け）
     */
    function fadeIn(targets, triggerEl, vars) {
      const { start, end, staggerDelay, ...tweenVars } = vars || {};

      // 初期状態を明示的にセットし、gsap.from のちらつきを防止
      gsap.set(targets, {
        y: tweenVars.y !== undefined ? tweenVars.y : 40,
        x: tweenVars.x || 0,
        opacity: 0
      });

      gsap.to(targets, {
        scrollTrigger: {
          trigger: triggerEl || targets,
          start: start || 'top 90%',
          end: end,
          toggleActions: 'play none none none'
        },
        y: 0,
        x: 0,
        opacity: 1,
        duration: DURATION ?? 0.8,
        ease: 'power3.out',
        ...tweenVars,
        // tweenVars の y/x は初期セット用なので上書き
      });
    }

    /**
     * 複数要素の順次フェードイン
     * @param {string} selector - 対象セレクタ
     * @param {Object} [vars]   - fadeIn オプション（staggerDelay で間隔指定、デフォルト 0.1s）
     */
    function staggerFadeIn(selector, vars) {
      const { staggerDelay = 0.1, ...fadeInVars } = vars || {};

      gsap.utils.toArray(selector).forEach(function (el, i) {
        fadeIn(el, el, {
          delay: i * staggerDelay,
          ...fadeInVars
        });
      });
    }

    // セクション番号（タイトルは initTextSplit で管理）
    staggerFadeIn('.section__number', { staggerDelay: 0 });

    // About
    fadeIn('.about__text', '.about__text', { x: -40, y: 0, start: 'top 90%' });
    fadeIn('.about__skills', '.about__skills', { x: 40, y: 0, delay: 0.2, start: 'top 90%' });
    staggerFadeIn('.skill-card', { y: 20, duration: DURATION ?? 0.5, staggerDelay: 0.08 });
    staggerFadeIn('.about__info-item', { x: -20, y: 0, duration: DURATION ?? 0.5 });

    // Timeline
    staggerFadeIn('.timeline__item', { x: -30, y: 0, duration: DURATION ?? 0.6, staggerDelay: 0.15 });

    // Works
    fadeIn('.works-filter', '.works-filter', { y: 20, duration: DURATION ?? 0.5 });
    staggerFadeIn('.work-card', { y: 60, staggerDelay: 0.15 });

    // Contact
    fadeIn('.contact__lead', '.contact__lead', { y: 30, duration: DURATION ?? 0.6 });
    staggerFadeIn('.form-group', { y: 30, duration: DURATION ?? 0.5 });
  }

  // =============================================
  // 7. ヘッダー / ページトップ / ナビ
  // =============================================

  // スクロールイベントを requestAnimationFrame でスロットリング
  let scrollTicking = false;
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
    const scrollY = window.scrollY;
    $header.toggleClass('is-scrolled', scrollY > HEADER_SCROLL_THRESHOLD);
    $pageTop.toggleClass('is-visible', scrollY > PAGE_TOP_SCROLL_THRESHOLD);
  }

  // モバイルアドレスバーの表示/非表示でビューポートサイズが変わった際に
  // ScrollTrigger の位置計算を更新する
  if (window.visualViewport) {
    let vpResizeTimer;
    window.visualViewport.addEventListener('resize', function () {
      clearTimeout(vpResizeTimer);
      vpResizeTimer = setTimeout(function () {
        ScrollTrigger.refresh();
      }, 300);
    });
  }

  // ページトップボタン
  $pageTop.on('click', function () {
    gsap.to(window, {
      scrollTo: { y: 0, autoKill: false },
      duration: DURATION ?? 1,
      ease: 'power3.inOut'
    });
  });

  // ナビゲーション アクティブ（スクロールスパイ）
  const NAV_SECTIONS = ['#about', '#works', '#contact'];

  NAV_SECTIONS.forEach(function (id) {
    ScrollTrigger.create({
      trigger: id,
      start: 'top center',
      end: 'bottom center',
      onEnter()     { setActiveNav(id); },
      onEnterBack() { setActiveNav(id); }
    });
  });

  function setActiveNav(id) {
    $navLinks.removeClass('is-active');
    $navLinks.filter('[href="' + id + '"]').addClass('is-active');
  }

  // =============================================
  // 8. ハンバーガーメニュー
  // =============================================

  /**
   * body のスクロールロックを管理するカウンター
   * 複数のコンポーネント（メニュー・モーダル）が同時にロックを要求しても
   * 全てが解除されるまで body の overflow を復元しない
   */
  let scrollLockCount = 0;

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

  // ESC キーで閉じる（メニュー & モーダル共通）
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
    const href = $(this).attr('href');
    if (href === '#') return;

    e.preventDefault();
    const $target = $(href);
    if (!$target.length) return;

    gsap.to(window, {
      scrollTo: { y: $target.offset().top - HEADER_OFFSET, autoKill: false },
      duration: DURATION ?? 1,
      ease: 'power3.inOut'
    });
  });

  // =============================================
  // 10. Works フィルター
  // =============================================
  const $filterBtns = $('#js-works-filter .works-filter__btn');
  const $workCards  = $('.js-work-card');

  $filterBtns.on('click', function () {
    const $btn   = $(this);
    const filter = $btn.data('filter');

    // 同じボタンの連打を無視
    if ($btn.hasClass('is-active')) return;

    // ボタンの active 切り替え
    $filterBtns.removeClass('is-active');
    $btn.addClass('is-active');

    $workCards.each(function () {
      const $card = $(this);
      const tags  = String($card.data('tags')).split(',');
      const shouldShow = (filter === 'all') || tags.indexOf(filter) !== -1;

      // 進行中のアニメーションを即座に停止
      gsap.killTweensOf($card[0]);

      if (shouldShow) {
        // 表示する — is-hidden 解除 & 必ず visible 状態にリセット
        $card.removeClass('is-hidden');
        gsap.to($card[0], {
          opacity: 1,
          scale: 1,
          duration: DURATION ?? 0.4,
          ease: 'power2.out'
        });
      } else {
        // 非表示にする（既に非表示なら何もしない）
        if ($card.hasClass('is-hidden')) return;
        gsap.to($card[0], {
          opacity: 0,
          scale: 0.9,
          duration: DURATION ?? 0.3,
          ease: 'power2.in',
          onComplete() {
            $card.addClass('is-hidden');
          }
        });
      }
    });
  });

  // =============================================
  // 11. Works モーダル
  // =============================================
  let $lastDetailTrigger = null;
  const $modalContainer  = $modal.find('.modal__container');

  /**
   * モーダルを開く
   * @param {jQuery} $card - 対象の work-card 要素
   */
  function openModal($card) {
    // データ注入（.text() でエスケープ済み）
    $('#js-modal-title').text($card.find('.work-card__title').text());
    $('#js-modal-role').text($card.data('detail-role'));
    $('#js-modal-period').text($card.data('detail-period'));
    $('#js-modal-point').text($card.data('detail-point'));

    // タグ生成（XSS 安全: jQuery .text() で生成）
    const tags = String($card.data('tags')).split(',');
    const $tagsWrap = $('#js-modal-tags').empty();
    tags.forEach(function (t) {
      $('<span>', { 'class': 'tag', text: t.trim() }).appendTo($tagsWrap);
    });

    $modal.addClass('is-active').attr('aria-hidden', 'false');
    lockScroll();

    // コンテナにフォーカスを移して Tab トラップを機能させる
    $modalContainer[0].focus();
  }

  /**
   * モーダルを閉じる
   */
  function closeModal() {
    $modal.removeClass('is-active').attr('aria-hidden', 'true');
    unlockScroll();

    // フォーカスを元のトリガーに戻す
    if ($lastDetailTrigger) {
      $lastDetailTrigger.trigger('focus');
      $lastDetailTrigger = null;
    }
  }

  // Detail ボタンクリック
  $(document).on('click', '.js-work-detail', function () {
    $lastDetailTrigger = $(this);
    const $card = $(this).closest('.js-work-card');
    openModal($card);
  });

  // モーダルを閉じる（オーバーレイ or 閉じるボタン）
  $(document).on('click', '.js-modal-close', function () {
    closeModal();
  });

  /**
   * モーダル内フォーカストラップ — Tab キーがモーダル外に漏れないようにする
   */
  $modal.on('keydown', function (e) {
    if (e.key !== 'Tab') return;

    const $focusable = $modal.find('a[href], button:not([disabled]), [tabindex="-1"]');
    if (!$focusable.length) return;

    const $first = $focusable.first();
    const $last  = $focusable.last();

    if (e.shiftKey) {
      // Shift+Tab: 最初の要素にいたら最後へ
      if ($(document.activeElement).is($first) || $(document.activeElement).is($modalContainer)) {
        e.preventDefault();
        $last.trigger('focus');
      }
    } else {
      // Tab: 最後の要素にいたら最初へ
      if ($(document.activeElement).is($last)) {
        e.preventDefault();
        $first.trigger('focus');
      }
    }
  });

  // =============================================
  // 12. フォームバリデーション
  // =============================================
  const $contactForm = $('#js-contact-form');
  const emailRegex   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * フィールド単体バリデーション
   * @param  {jQuery}  $field - バリデーション対象の input / textarea
   * @return {boolean} バリデーション通過なら true
   */
  function validateField($field) {
    const value      = $field.val().trim();
    const isRequired = $field.prop('required');
    const $error     = $field.siblings('.form-group__error');

    // 必須チェック（空欄）
    if (isRequired && value === '') {
      $field.addClass('is-error');
      $error.text($field.data('error-empty') || '入力してください');
      return false;
    }

    // メール形式チェック
    if ($field.attr('type') === 'email' && value !== '' && !emailRegex.test(value)) {
      $field.addClass('is-error');
      $error.text($field.data('error-format') || '正しいメールアドレスを入力してください');
      return false;
    }

    // OK
    $field.removeClass('is-error');
    $error.text('');
    return true;
  }

  // リアルタイムバリデーション（エラー表示中のフィールドのみ再検証）
  $contactForm.on('input', 'input, textarea', function () {
    const $el = $(this);
    if ($el.hasClass('is-error')) {
      validateField($el);
    }
  });

  // blur 時バリデーション
  $contactForm.on('blur', 'input[required], textarea[required]', function () {
    validateField($(this));
  });

  // 送信処理
  $contactForm.on('submit', function (e) {
    e.preventDefault();

    let isValid = true;
    $(this).find('input[required], textarea[required], input[type="email"]').each(function () {
      if (!validateField($(this))) {
        isValid = false;
      }
    });

    if (!isValid) {
      $(this).find('.is-error').first().trigger('focus');
      return;
    }

    const $btn = $(this).find('.btn--submit');
    const originalText = $btn.find('span').text();

    $btn.prop('disabled', true);
    $btn.find('span').text('送信中...');

    // デモ用: 2 秒後に完了表示
    setTimeout(function () {
      $btn.find('span').text(originalText);
      $btn.prop('disabled', false);
      $('#js-form-success').text('送信が完了しました。ありがとうございます！');
      $contactForm[0].reset();

      // エラー表示をクリア
      $contactForm.find('.is-error').removeClass('is-error');
      $contactForm.find('.form-group__error').text('');

      setTimeout(function () {
        $('#js-form-success').text('');
      }, 5000);
    }, 2000);
  });

  // =============================================
  // 13. カスタムカーソル（PC ホバー環境のみ）
  // =============================================
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const $cursor = $('<div class="custom-cursor" aria-hidden="true"></div>');
    $body.append($cursor);

    document.addEventListener('mousemove', function (e) {
      gsap.to($cursor[0], {
        x: e.clientX - 10,
        y: e.clientY - 10,
        duration: 0.3,
        ease: 'power2.out'
      });
    }, { passive: true });

    // イベント委任でホバー対象を管理
    $(document).on('mouseenter', 'a, button, .work-card', function () {
      $cursor.addClass('is-hover');
    }).on('mouseleave', 'a, button, .work-card', function () {
      $cursor.removeClass('is-hover');
    });
  }
});
