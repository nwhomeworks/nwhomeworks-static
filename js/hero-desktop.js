/* ══════════════════════════════════════════════
   DESKTOP HERO SLIDER — GSAP Animations
   ══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {
  if (window.innerWidth <= 1024) return;

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  var slides = Array.from(document.querySelectorAll(".hero-slide-desktop")).filter(
    function (slide) { return slide.offsetHeight > 0; }
  );
  var wrapper = document.querySelector(".hero-scroll-wrapper-desktop");
  if (!wrapper || slides.length === 0) return;

  wrapper.style.position = "relative";

  /* ══════════════════════════════════════════════
     IMAGE DATA
     ══════════════════════════════════════════════ */
  var slideImages = [
    [
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/seattle-modern-farmhouse-kitchen-remodel-with-white-cabinets-and-wood-island-2500.webp"
    ],
    [
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/sammamish-ikea-kitchen-installation-custom-teak-doors-side-by-side-integrated-fridge-freezer.webp",
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/normandy-park-walnut-cabinets-farnhouse-sink-tile-backsplash.webp",
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/modern-craftsman-farmhouse-kitchen-shaker-cabinets-butcher-block-island-subway-tile-2500.webp"
    ],
    [
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/gig-harbor-master-bath-remodel-wall-mount-faucets-vessel-sinks.webp",
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/master-bath-remodel-green-tile-shower-surround-brass-hardware-1.webp",
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/luxury-marble-master-bathroom-remodel-seattle-bathtub-shower-design-ideas-2500-1.webp",
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/kids-bathroom-remodel-seattle-light-blue-tile-brass-hardware-walnut-vanity.webp"
    ],
    [
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/ikea-kitchen-remodel-seattle-white-kitchen-island-with-open-shelves-and-wine-rack-1.webp",
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/mid-century-modern-kitchen-teak-cabinets-copper-pendant-lights-design-ideas-2500-2.webp",
      "https://www.nwhomeworks.com/wp-content/uploads/2026/03/seattle-contemporary-kitchen-custom-ikea-cabinet-installation-grey-and-white-design-2500.webp"
    ]
  ];

  /* ══════════════════════════════════════════════
     CONFIGURATION
     ══════════════════════════════════════════════ */
  var config = {
    kenBurnsScale: 1.08,
    kenBurnsDuration: 17,
    subSlideInterval: 7000,
    dissolveDuration: 1.5,
    parallaxDistance: 60,
    spacerHeight: "40vh",
    progressBarHeight: 3
  };

  /* ══════════════════════════════════════════════
     SET SLIDE HEIGHTS
     ══════════════════════════════════════════════ */
  function setSlideHeight() {
    var vh = window.innerHeight;
    slides.forEach(function (slide) {
      slide.style.height = vh + "px";
    });
  }
  setSlideHeight();

  window.addEventListener("resize", function () {
    setSlideHeight();
    ScrollTrigger.refresh();
  });

  /* ══════════════════════════════════════════════
     CREATE IMAGE LAYERS + KEN BURNS
     ══════════════════════════════════════════════ */
  var subSlideshows = [];
  var parallaxWraps = [];

  slides.forEach(function (slide, i) {
    var images = slideImages[i];
    var layers = [];

    var parallaxWrap = document.createElement("div");
    parallaxWrap.className = "hero-parallax-wrap";
    slide.insertBefore(parallaxWrap, slide.firstChild);
    parallaxWraps.push(parallaxWrap);

    images.forEach(function (url, j) {
      var layer = document.createElement("div");
      layer.className = "hero-kb-layer";
      layer.style.backgroundImage = "url(" + url + ")";
      layer.style.opacity = j === 0 ? "1" : "0";
      layer.style.zIndex = 1;
      parallaxWrap.appendChild(layer);
      layers.push(layer);

      if (j === 0) {
        startKenBurns(layer);
      }
    });

    var progressBar = null;
    var progressFill = null;
    if (images.length > 1) {
      progressBar = document.createElement("div");
      progressBar.className = "slide-progress-bar";
      progressFill = document.createElement("div");
      progressFill.className = "slide-progress-fill";
      progressBar.appendChild(progressFill);
      slide.appendChild(progressBar);
    }

    subSlideshows.push({
      layers: layers,
      currentIndex: 0,
      interval: null,
      progressFill: progressFill,
      progressAnimation: null
    });
  });

  /* ══════════════════════════════════════════════
     KEN BURNS EFFECT
     ══════════════════════════════════════════════ */
  function startKenBurns(layer) {
    var origins = [
      "50% 50%", "30% 30%", "70% 30%",
      "30% 70%", "70% 70%", "50% 30%"
    ];
    var origin = origins[Math.floor(Math.random() * origins.length)];
    layer.style.transformOrigin = origin;

    gsap.fromTo(layer,
      { scale: 1 },
      {
        scale: config.kenBurnsScale,
        duration: config.kenBurnsDuration,
        ease: "none",
        repeat: -1,
        yoyo: true
      }
    );
  }

  /* ══════════════════════════════════════════════
     SUB-SLIDESHOW WITH DISSOLVE
     ══════════════════════════════════════════════ */
  function startSubSlideshow(slideIndex) {
    var show = subSlideshows[slideIndex];
    if (show.layers.length <= 1) return;
    if (show.interval) return;

    startProgressBar(slideIndex);

    show.interval = setInterval(function () {
      var currentLayer = show.layers[show.currentIndex];
      show.currentIndex = (show.currentIndex + 1) % show.layers.length;
      var nextLayer = show.layers[show.currentIndex];

      gsap.killTweensOf(nextLayer);
      nextLayer.style.transform = "scale(1)";
      startKenBurns(nextLayer);

      nextLayer.style.zIndex = 2;
      gsap.fromTo(nextLayer,
        { opacity: 0 },
        {
          opacity: 1,
          duration: config.dissolveDuration,
          ease: "power1.inOut",
          onComplete: function () {
            currentLayer.style.opacity = "0";
            currentLayer.style.zIndex = 1;
            nextLayer.style.zIndex = 1;
            gsap.killTweensOf(currentLayer);
          }
        }
      );

      startProgressBar(slideIndex);
    }, config.subSlideInterval);
  }

  function stopSubSlideshow(slideIndex) {
    var show = subSlideshows[slideIndex];
    if (show.interval) {
      clearInterval(show.interval);
      show.interval = null;
    }
    if (show.progressAnimation) {
      show.progressAnimation.kill();
    }
  }

  /* ══════════════════════════════════════════════
     PROGRESS BAR
     ══════════════════════════════════════════════ */
  function startProgressBar(slideIndex) {
    var show = subSlideshows[slideIndex];
    if (!show.progressFill) return;

    if (show.progressAnimation) {
      show.progressAnimation.kill();
    }

    show.progressFill.style.width = "0%";
    show.progressAnimation = gsap.to(show.progressFill, {
      width: "100%",
      duration: config.subSlideInterval / 1000,
      ease: "none"
    });
  }

  /* ══════════════════════════════════════════════
     INSERT SPACERS BETWEEN SLIDES
     ══════════════════════════════════════════════ */
  for (var s = slides.length - 2; s >= 0; s--) {
    var spacer = document.createElement("div");
    spacer.style.height = config.spacerHeight;
    spacer.style.position = "relative";
    spacer.style.zIndex = slides[s].style.zIndex;
    slides[s].parentNode.insertBefore(spacer, slides[s].nextSibling);
  }

  /* ══════════════════════════════════════════════
     SCROLL STACKING + PARALLAX
     ══════════════════════════════════════════════ */
  slides.forEach(function (slide, i) {
    slide.style.zIndex = i + 1;

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
          var offset = self.progress * config.parallaxDistance;
          parallaxWraps[i].style.transform = "translateY(" + offset + "px) translateZ(0)";
        },
        onLeaveBack: function () {
          parallaxWraps[i].style.transform = "translateY(0px) translateZ(0)";
        },
        onEnter: function () {
          startSubSlideshow(i);
        },
        onEnterBack: function () {
          startSubSlideshow(i);
        },
        onLeave: function () {
          stopSubSlideshow(i);
        },
        onLeaveBack: function () {
          if (i > 0) stopSubSlideshow(i);
        }
      });
    } else {
      ScrollTrigger.create({
        trigger: slide,
        start: "top top",
        end: "max",
        pin: true,
        pinSpacing: false,
        onEnter: function () { startSubSlideshow(i); },
        onEnterBack: function () { startSubSlideshow(i); },
      });
    }

    /* Subtle fade on arrival for slides 2+ */
    if (i > 0) {
      var inner =
        slide.querySelector(".glass-card-desktop") ||
        slide.querySelector(".glass-card-desktop-light") ||
        slide.firstElementChild;
      if (inner) {
        gsap.fromTo(
          inner,
          { opacity: 0.85 },
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

  /* Start slideshow for first slide */
  startSubSlideshow(0);

  /* ══════════════════════════════════════════════
     SLIDE 1 TEXT ANIMATION
     ══════════════════════════════════════════════ */
  var line1 = document.querySelector(".hero-line-1-desktop");
  var line2 = document.querySelector(".hero-line-2-desktop");

  if (line1 && line2) {
    gsap.set(line1, { opacity: 0, x: -80 });
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
      duration: 1.4,
      ease: "power2.out",
    }, "-=0.3");
  }

  /* ══════════════════════════════════════════════
     MANUAL SNAP BEHAVIOR
     ══════════════════════════════════════════════ */
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

  /* ══════════════════════════════════════════════
     PROGRESS DOTS
     ══════════════════════════════════════════════ */
  var nav = document.createElement("div");
  nav.className = "slide-progress-desktop";

  slides.forEach(function (slide, i) {
    var dot = document.createElement("div");
    dot.className = "slide-dot-desktop";
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
        document.querySelectorAll(".slide-dot-desktop").forEach(function (d) { d.classList.remove("active"); });
        dot.classList.add("active");
      },
      onEnterBack: function () {
        document.querySelectorAll(".slide-dot-desktop").forEach(function (d) { d.classList.remove("active"); });
        dot.classList.add("active");
      },
    });
  });

  document.body.appendChild(nav);

  /* ══════════════════════════════════════════════
     HIDE DOTS PAST HERO
     ══════════════════════════════════════════════ */
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

  /* Force refresh after everything settles */
  setTimeout(function () {
    ScrollTrigger.refresh();
  }, 800);
});
