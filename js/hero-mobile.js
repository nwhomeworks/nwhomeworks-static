/* ══════════════════════════════════════════════
   MOBILE HERO SLIDER — GSAP Animations
   ══════════════════════════════════════════════ */

/* ── Mobile text animation ── */
document.addEventListener("DOMContentLoaded", function () {
  var line1 = document.querySelector(".hero-line-1");
  var line2 = document.querySelector(".hero-line-2");
  if (!line1 || !line2) return;

  gsap.set(line1, { opacity: 0, x: -60 });
  gsap.set(line2, { opacity: 0, scale: 0.55 });

  var tl = gsap.timeline({ delay: 1.5 });

  tl.to(line1, {
    opacity: 1,
    x: 0,
    duration: 1.3,
    ease: "power3.out",
  });

  tl.to(line2, {
    opacity: 1,
    scale: 1,
    duration: 0.2,
    ease: "power2.out",
  }, "-=0");
});

/* ── Mobile scroll slider ── */
document.addEventListener("DOMContentLoaded", function () {
  if (window.innerWidth > 1024) return;

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  var slides = Array.from(document.querySelectorAll(".hero-slide")).filter(
    function (slide) { return slide.offsetHeight > 0; }
  );
  var wrapper = document.querySelector(".hero-scroll-wrapper");
  if (!wrapper || slides.length === 0) return;

  wrapper.style.position = "relative";

  /* ── Fix mobile viewport height ── */
  function setSlideHeight() {
    var vh = window.innerHeight;
    slides.forEach(function (slide) {
      slide.style.height = vh + "px";
    });
  }
  setSlideHeight();

  var lastWidth = window.innerWidth;
  window.addEventListener("resize", function () {
    var newWidth = window.innerWidth;
    if (Math.abs(newWidth - lastWidth) > 50) {
      lastWidth = newWidth;
      setSlideHeight();
      ScrollTrigger.refresh();
    }
  });

  var parallaxDistance = 60;
  var spacerHeight = "40vh";

  /* ── Insert spacers ── */
  for (var s = slides.length - 2; s >= 0; s--) {
    var spacer = document.createElement("div");
    spacer.style.height = spacerHeight;
    spacer.style.position = "relative";
    spacer.style.zIndex = slides[s].style.zIndex;
    slides[s].parentNode.insertBefore(spacer, slides[s].nextSibling);
  }

  /* ── Slide pinning and parallax ── */
  slides.forEach(function (slide, i) {
    slide.style.zIndex = i + 1;

    var bg = slide.querySelector(".hero-slide-bg");
    if (!bg) return;

    if (i < slides.length - 1) {
      ScrollTrigger.create({
        trigger: slide,
        start: "top top",
        endTrigger: slides[i + 1],
        end: "top top",
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
        onUpdate: function (self) {
          var offset = self.progress * parallaxDistance;
          bg.style.transform = "translateY(" + offset + "px) translateZ(0)";
        },
        onLeaveBack: function () {
          bg.style.transform = "translateY(0px) translateZ(0)";
        },
      });
    } else {
      ScrollTrigger.create({
        trigger: slide,
        start: "top top",
        end: "max",
        pin: true,
        pinSpacing: false,
      });
    }

    if (i > 0) {
      var inner =
        slide.querySelector(".glass-card") ||
        slide.querySelector(".glass-card-light") ||
        slide.firstElementChild;
      if (inner) {
        gsap.fromTo(
          inner,
          { opacity: 0.9 },
          {
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: slide,
              start: "top 10%",
              end: "top top",
              scrub: 0.3,
            },
          }
        );
      }
    }
  });

  /* ── Manual snap ── */
  var isSnapping = false;

  function snapToNearest() {
    if (isSnapping) return;

    var wrapperRect = wrapper.getBoundingClientRect();
    if (wrapperRect.bottom < 0) return;

    var windowH = window.innerHeight;
    var closest = slides[0];
    var closestDist = Infinity;

    slides.forEach(function (slide) {
      var rect = slide.getBoundingClientRect();
      var dist = Math.abs(rect.top);
      if (dist < closestDist) {
        closestDist = dist;
        closest = slide;
      }
    });

    if (closestDist < windowH * 0.4) {
      isSnapping = true;
      gsap.to(window, {
        scrollTo: { y: closest, autoKill: true },
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: function () {
          isSnapping = false;
        },
      });
    }
  }

  var scrollTimer;
  window.addEventListener(
    "scroll",
    function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(snapToNearest, 150);
    },
    { passive: true }
  );

  /* ── Progress dots ── */
  var nav = document.createElement("div");
  nav.className = "slide-progress";

  slides.forEach(function (slide, i) {
    var dot = document.createElement("div");
    dot.className = "slide-dot";
    if (i === 0) dot.classList.add("active");

    dot.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      gsap.to(window, {
        scrollTo: { y: slide, autoKill: false },
        duration: 0.8,
        ease: "power2.inOut",
      });
    });

    nav.appendChild(dot);

    ScrollTrigger.create({
      trigger: slide,
      start: "top center",
      end: "bottom center",
      onEnter: function () {
        document.querySelectorAll(".slide-dot").forEach(function (d) { d.classList.remove("active"); });
        dot.classList.add("active");
      },
      onEnterBack: function () {
        document.querySelectorAll(".slide-dot").forEach(function (d) { d.classList.remove("active"); });
        dot.classList.add("active");
      },
    });
  });

  document.body.appendChild(nav);

  /* ── Hide dots past hero ── */
  ScrollTrigger.create({
    trigger: wrapper,
    start: "top top",
    end: "bottom top",
    onLeave: function () {
      gsap.to(nav, { opacity: 0, duration: 0.3, pointerEvents: "none" });
    },
    onEnterBack: function () {
      gsap.to(nav, { opacity: 1, duration: 0.3, pointerEvents: "auto" });
    },
  });

  setTimeout(function () {
    ScrollTrigger.refresh();
  }, 800);
});
