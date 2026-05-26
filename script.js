/* SYNTRIX — small, considered interactions */

(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----- Year ----- */
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ----- Live clock in Prishtina (CET) ----- */
  const clockEls = document.querySelectorAll("[data-clock]");
  const tick = () => {
    const now = new Date();
    const t = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Belgrade",
      hour12: false
    }).format(now);
    clockEls.forEach(el => (el.textContent = t + " CET"));
  };
  tick();
  setInterval(tick, 1000 * 15);

  /* ----- Custom cursor ----- */
  const cursor = document.querySelector(".cursor");
  if (cursor && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x, ty = y;
    let ready = false;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!ready) {
        cursor.classList.add("is-ready");
        ready = true;
      }
    }, { passive: true });

    const render = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    const hoverables = "a, button, .contact-mail, .service, .btn";
    document.querySelectorAll(hoverables).forEach(el => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  /* ----- Reveal-on-scroll ----- */
  const targets = document.querySelectorAll(
    "section .section-head, .practice-body, .practice-stats li, .service, .approach-block, .contact-inner > *, .foot-col, .wordmark span"
  );
  // Per-section stagger: each target's transition-delay is set by its position
  // within its parent (so siblings reveal in source order, not intersection order).
  targets.forEach(el => {
    el.classList.add("in-view-target");
    if (el.dataset.delay) return;
    const siblings = Array.from(el.parentNode.children).filter(c =>
      c.classList.contains("in-view-target")
    );
    const idx = siblings.indexOf(el);
    el.style.transitionDelay = Math.min(idx, 5) * 50 + "ms";
  });

  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach(el => io.observe(el));
  } else {
    targets.forEach(el => el.classList.add("in-view"));
  }

  /* ----- Stat counters ----- */
  const stats = document.querySelectorAll("[data-count]");
  if (stats.length && "IntersectionObserver" in window && !reduced) {
    const countIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const end = parseInt(el.dataset.count, 10);
        const dur = 1400;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * eased);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        countIO.unobserve(el);
      });
    }, { threshold: 0.5 });
    stats.forEach(el => countIO.observe(el));
  } else {
    stats.forEach(el => (el.textContent = el.dataset.count));
  }

  /* ----- Subtle parallax on hero Now panel (rAF-throttled) ----- */
  const side = document.querySelector(".hero-now");
  if (side && !reduced && matchMedia("(hover: hover)").matches) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = Math.min(120, window.scrollY * 0.08);
          side.style.transform = `translateY(${y}px)`;
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ----- Pause marquee when off-screen ----- */
  const marquee = document.querySelector(".marquee-track");
  if (marquee && "IntersectionObserver" in window) {
    const mIO = new IntersectionObserver(
      ([entry]) => {
        marquee.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
      },
      { threshold: 0 }
    );
    mIO.observe(marquee.parentElement);
  }

  /* ----- Cursor: JS writes translate, CSS handles scale halo ----- */
  // (The cursor element keeps the dot; the halo on hover is :hover-driven CSS.)
})();
