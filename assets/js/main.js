/* ================================================================
   BLENDR BRANDING & DESIGN — main.js
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Header scroll state ─────────────────────────────────────── */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile nav toggle ───────────────────────────────────────── */
  const toggle     = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Active nav link ─────────────────────────────────────────── */
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    // Normalise
    const linkPath = href.replace(/\/$/, '') || '/';
    const isHome   = linkPath === '.' || linkPath === './index.html' || linkPath === '/index.html';
    const pathEnd  = currentPath.split('/').pop();
    if (isHome && (pathEnd === '' || pathEnd === 'index.html')) {
      link.classList.add('active');
    } else if (!isHome && (currentPath.includes(linkPath) || linkPath.includes(pathEnd))) {
      link.classList.add('active');
    }
  });

  /* ── Scroll-triggered fade-in animations ────────────────────── */
  const animItems = document.querySelectorAll('.fade-in, .fade-in-right, .fade-in-left');
  if (animItems.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    animItems.forEach(el => io.observe(el));
  }

  /* ── Hero bg slow zoom ───────────────────────────────────────── */
  // Skip if intro is active — intro script will trigger this after flyout
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg && !document.body.classList.contains('intro-active')) {
    requestAnimationFrame(() => heroBg.classList.add('loaded'));
  }

  /* ── Scroll-to-top button ────────────────────────────────────── */
  const scrollTopBtn = document.querySelector('.scroll-top');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Newsletter form (minimal — hooks to backend) ────────────── */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !input.value) return;
      const btn = form.querySelector('button');
      const orig = btn.textContent;
      btn.textContent = '✓';
      btn.disabled = true;
      try {
        await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: input.value })
        });
      } catch {}
      input.value = '';
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = false;
      }, 3000);
    });
  });

  /* ── Contact form ────────────────────────────────────────────── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn     = contactForm.querySelector('button[type="submit"]');
      const success = document.getElementById('form-success');
      const orig    = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled    = true;

      const data = {};
      new FormData(contactForm).forEach((v, k) => { data[k] = v; });
      // Collect checkboxes (purpose)
      data.purpose = [...contactForm.querySelectorAll('input[name="purpose"]:checked')]
        .map(cb => cb.value);

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          contactForm.reset();
          if (success) success.style.display = 'block';
        }
      } catch {
        btn.textContent = 'Error — try again';
      } finally {
        btn.textContent = orig;
        btn.disabled    = false;
      }
    });
  }

  /* ── Lightbox ────────────────────────────────────────────────── */
  const lightbox    = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (lightbox && lightboxImg) {
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const src = item.dataset.src || item.querySelector('img')?.src;
        if (src) {
          lightboxImg.src = src;
          lightbox.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      });
    });
    const closeLb = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      lightboxImg.src = '';
    };
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', closeLb);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLb(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  }

});

/* ── Carousel factory ────────────────────────────────────────────
   Usage: initCarousel('.carousel-wrapper', { slidesVisible: 3 })
   ---------------------------------------------------------------- */
function initCarousel(selector, opts = {}) {
  const wrapper = document.querySelector(selector);
  if (!wrapper) return;

  const track    = wrapper.querySelector('.carousel-track');
  const slides   = [...track.children];
  const dotsWrap = wrapper.querySelector('.carousel-dots');
  const prevBtn  = wrapper.querySelector('.carousel-prev');
  const nextBtn  = wrapper.querySelector('.carousel-next');

  if (!slides.length) return;

  let current = 0;
  const visible = opts.slidesVisible || 1;
  const maxIndex = Math.max(0, slides.length - visible);

  // Build dots
  const dotCount = maxIndex + 1;
  if (dotsWrap) {
    for (let i = 0; i < dotCount; i++) {
      const d = document.createElement('button');
      d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `Slide ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    }
  }

  function getSlideWidth() {
    const gap   = parseInt(getComputedStyle(track).gap) || 24;
    const w     = slides[0].offsetWidth;
    return w + gap;
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, maxIndex));
    const sw = getSlideWidth();
    track.style.transform = `translateX(-${current * sw}px)`;
    if (dotsWrap) {
      dotsWrap.querySelectorAll('.carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  // Touch / swipe
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });

  // Auto-play
  if (opts.autoplay) {
    setInterval(() => goTo(current >= maxIndex ? 0 : current + 1), opts.autoplay);
  }

  // Recalculate on resize
  window.addEventListener('resize', () => goTo(current), { passive: true });

  return { goTo };
}

/* ── Testimonials slider ─────────────────────────────────────────
   Self-initialising — looks for .testimonials-slider on the page
   ---------------------------------------------------------------- */
(function initTestimonials() {
  const slider  = document.querySelector('.testimonials-slider');
  if (!slider) return;
  const track   = slider.querySelector('.testimonials-track');
  const cards   = [...(track?.children || [])];
  const dotsWrap = slider.querySelector('.testimonials-controls');
  if (!cards.length) return;

  let current = 0;

  if (dotsWrap) {
    cards.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 't-dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Testimonial ${i + 1}`);
      btn.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(btn);
    });
  }

  function goTo(i) {
    current = (i + cards.length) % cards.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    if (dotsWrap) {
      dotsWrap.querySelectorAll('.t-dot').forEach((d, j) => {
        d.classList.toggle('active', j === current);
      });
    }
  }

  // Auto-advance
  const auto = setInterval(() => goTo(current + 1), 6000);
  slider.addEventListener('mouseenter', () => clearInterval(auto));

  // Touch
  let sx = 0;
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const d = sx - e.changedTouches[0].clientX;
    if (Math.abs(d) > 50) goTo(d > 0 ? current + 1 : current - 1);
  });
})();

/* ── Portfolio filter ────────────────────────────────────────────
   Self-initialising — looks for .portfolio-filters on the page
   ---------------------------------------------------------------- */
(function initPortfolioFilter() {
  const filterBar = document.querySelector('.portfolio-filters');
  if (!filterBar) return;
  const grid  = document.querySelector('.portfolio-grid');
  const cards = [...(grid?.querySelectorAll('.portfolio-card') || [])];

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const cat = btn.dataset.filter;
    cards.forEach(card => {
      const cats = (card.dataset.categories || '').split(',').map(s => s.trim().toLowerCase());
      const show = cat === 'all' || cats.includes(cat.toLowerCase());
      card.classList.toggle('hidden', !show);
      // Animate in
      if (show) {
        card.style.animation = 'none';
        requestAnimationFrame(() => {
          card.style.animation = '';
          card.classList.add('fade-in', 'visible');
        });
      }
    });
  });
})();

/* ── Work carousel (homepage) ────────────────────────────────────
   Initialise after DOM is ready
   ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Determine visible slides based on viewport
  const vw = window.innerWidth;
  const vis = vw >= 1024 ? 3 : vw >= 640 ? 2 : 1;
  initCarousel('.carousel-wrapper', { slidesVisible: vis, autoplay: 5000 });
});

/* ── "We ___" verb cycler ────────────────────────────────────────
   Self-initialising — looks for .h-we .design on the page
   ---------------------------------------------------------------- */
(function initVerbCycle() {
  const el = document.querySelector('.h-we .design');
  if (!el) return;

  const words = ['design', 'animate', 'develop', 'market', 'advise', 'brand'];

  // Each step: how the current word exits, how the next word enters
  const transitions = [
    { exit: 'vExitToTop',    dur_out: 420, enter: 'vEnterFromBottom', dur_in: 580 },
    { exit: 'vExitToRight',  dur_out: 380, enter: 'vEnterFromLeft',   dur_in: 540 },
    { exit: 'vExitToBottom', dur_out: 420, enter: 'vEnterFromTop',    dur_in: 560 },
    { exit: 'vExitToLeft',   dur_out: 380, enter: 'vEnterFromRight',  dur_in: 540 },
    { exit: 'vExitBloom',    dur_out: 450, enter: 'vEnterBloom',      dur_in: 600 },
    { exit: 'vExitShrink',   dur_out: 380, enter: 'vEnterFade',       dur_in: 560 },
  ];

  const HOLD = 3200; // ms each word is fully visible

  let current = 0;

  function applyAnim(name, duration, fillMode) {
    el.style.animation = `${name} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${fillMode}`;
  }

  function cycle() {
    const { exit, dur_out, enter, dur_in } = transitions[current];
    const next = (current + 1) % words.length;

    // Exit
    applyAnim(exit, dur_out, 'forwards');

    setTimeout(() => {
      // Swap word while invisible
      el.textContent = words[next];
      current = next;

      // Enter
      applyAnim(enter, dur_in, 'both');

      setTimeout(() => {
        // Settled — remove animation so it stays in natural state
        el.style.animation = 'none';
        el.style.opacity   = '1';
        el.style.transform = 'none';

        // Wait then cycle again
        setTimeout(cycle, HOLD);
      }, dur_in);
    }, dur_out);
  }

  // Start after the initial word has been shown for a full hold
  setTimeout(cycle, HOLD);
})();
