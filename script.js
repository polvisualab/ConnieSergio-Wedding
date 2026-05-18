if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
  console.warn("GSAP or ScrollTrigger not found.");
} else {
  gsap.registerPlugin(ScrollTrigger);

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // // ── Lenis ──────────────────────────────────────────────────────────────────
  // if (typeof Lenis !== "undefined" && !prefersReduced) {
  //   const lenis = new Lenis({
  //     duration: 1.2,
  //     easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  //     smooth: true,
  //     smoothTouch: true,
  //   });

  //   gsap.ticker.add((time) => {
  //     lenis.raf(time * 1000); // gsap.ticker usa segundos, Lenis espera ms
  //   });
  //   gsap.ticker.lagSmoothing(0);

  //   window.lenis = lenis;
  // }

  // ── Textos por sección ─────────────────────────────────────────────────────
  const textSelector = "h1,h2,h3,h4,h5,p,li,span,strong,em,a,button";

  gsap.utils.toArray("section, header, footer").forEach((section) => {
    const texts = section.querySelectorAll(textSelector);
    if (!texts.length) return;

    if (prefersReduced) {
      texts.forEach((t) => {
        t.style.opacity = 1;
        t.style.transform = "none";
      });
      return;
    }

    gsap.from(texts, {
      y: 16,
      autoAlpha: 0,
      duration: 1.1,
      ease: "power2.out",
      stagger: 0.08,
      // ✅ invalidateOnRefresh recalcula valores iniciales si Lenis/ST hacen refresh
      invalidateOnRefresh: true,
      scrollTrigger: {
        trigger: section,
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
    });
  });

  if (!prefersReduced) {
    // ── Zoom de imágenes ───────────────────────────────────────────────────────
    const mediaLoop = gsap.utils.toArray("img, picture");
    if (mediaLoop.length) {
      // ✅ Cada imagen tiene su propio tween para evitar que el stagger
      //    global arranque con elementos fuera de su estado inicial correcto
      mediaLoop.forEach((el, i) => {
        gsap.to(el, {
          scale: 1.04,
          duration: 6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "50% 50%",
          delay: i * 0.4, // mismo efecto de stagger pero controlado
        });
      });
    }

    // ── SVG draw + fill ────────────────────────────────────────────────────────
    gsap.utils.toArray("svg").forEach((svg) => {
      const shapes = svg.querySelectorAll(
        "path, line, polyline, polygon, rect, circle, ellipse",
      );
      if (!shapes.length) return;

      shapes.forEach((s) => {
        try {
          const len = s.getTotalLength();
          s.style.strokeDasharray = len;
          s.style.strokeDashoffset = len;
        } catch {
          s.style.strokeDasharray = 0;
          s.style.strokeDashoffset = 0;
        }
        const fill = s.getAttribute("fill");
        if (fill && fill !== "none") s.style.fillOpacity = 0;
      });

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power1.out" },
      });

      tl.to(shapes, { strokeDashoffset: 0, duration: 1, stagger: 0.04 });
      tl.to(shapes, { fillOpacity: 1, duration: 2, stagger: 0.03 }, "-=0.25");
      tl.call(() => {
        shapes.forEach((s) => {
          s.style.strokeDasharray = "";
          s.style.strokeDashoffset = "";
        });
      });

      ScrollTrigger.create({
        trigger: svg,
        start: "top 82%",
        once: true,
        onEnter: () => tl.play(),
      });
    });
  } else {
    gsap.set("img, picture, svg", { scale: 1, fillOpacity: 1 });
  }

  // ✅ Refresh diferido un frame para que Lenis esté listo
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

// ── Mobile autoplay fallback ───────────────────────────────────────────────────
const heroVideo = document.getElementById("hero-video");
if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.playsInline = true;

  // Intenta reproducir de inmediato; si se rechaza, espera la primera interacción.
  const startVideo = () => {
    const playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const unlockEvent = "ontouchstart" in window ? "touchstart" : "click";
        const unlock = () => {
          heroVideo.play().finally(() => {
            window.removeEventListener(unlockEvent, unlock, { passive: true });
          });
        };
        window.addEventListener(unlockEvent, unlock, {
          passive: true,
          once: true,
        });
      });
    }
  };

  startVideo();
}
