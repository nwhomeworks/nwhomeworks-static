/* ══════════════════════════════════════════════
   PORTFOLIO HUB — Scroll-Scrubbed Scatter + Arc Carousel
   ══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {

  var page = document.querySelector(".portfolio-page");
  if (!page) return;

  gsap.registerPlugin(ScrollTrigger);

  var cards = document.querySelectorAll(".portfolio-card");
  var header = document.querySelector(".portfolio-header");
  var footer = document.querySelector(".portfolio-footer");
  var scatterHeading = document.querySelector(".portfolio-scatter-heading");
  var spacer = document.querySelector(".portfolio-scroll-spacer");
  var totalCards = cards.length;
  var centerIndex = 0;
  var isSettled = false;
  var isAnimating = false;
  var scrollAccumulator = 0;
  var scrollThreshold = 80;
  var isMobile = window.innerWidth <= 768;

  /* ══════════════════════════════════════════════
     ARC POSITION CALCULATOR
     ══════════════════════════════════════════════ */
  function getArcPosition(offset) {
    var absOffset = Math.abs(offset);
    var sign = offset >= 0 ? 1 : -1;

    if (isMobile) {
      var cardH = 293;
      var spacing = 0.5;
      return {
        x: 0,
        y: sign * absOffset * cardH * spacing,
        rotation: 0,
        scale: Math.max(0.5, 1 - absOffset * 0.15),
        zIndex: 10 - absOffset,
        opacity: absOffset === 0 ? 1 : Math.max(0.15, 0.6 - absOffset * 0.15)
      };
    }

    var cardW = cards[0] ? cards[0].offsetWidth : 280;
    var spacing = 0.6;
    var ySpread = Math.max(12, cardW * 0.043);
    return {
      x: sign * absOffset * cardW * spacing,
      y: absOffset * absOffset * ySpread,
      rotation: sign * absOffset * 4,
      scale: Math.max(0.45, 1 - absOffset * 0.12),
      zIndex: 10 - absOffset,
      opacity: absOffset <= 4 ? 1 : 0
    };
  }

  /* ══════════════════════════════════════════════
     HELPER — Convert vw/vh strings to pixels
     ══════════════════════════════════════════════ */
  function toPx(val) {
    if (typeof val === "number") return val;
    var str = String(val);
    if (str.indexOf("vw") !== -1) return parseFloat(str) * window.innerWidth / 100;
    if (str.indexOf("vh") !== -1) return parseFloat(str) * window.innerHeight / 100;
    return parseFloat(str) || 0;
  }

  /* ══════════════════════════════════════════════
     SCATTERED STATES
     ══════════════════════════════════════════════ */
  var desktopScatteredStates = [
    { x: "-22vw", y: "-12vh", scale: 1.15, rotation: -5, opacity: 1 },    /* close, left of center */
    { x: "28vw",  y: "-25vh", scale: 0.5,  rotation: 5,  opacity: 0.4 },  /* far, top right */
    { x: "-8vw",  y: "8vh",   scale: 1.05, rotation: -2, opacity: 0.95 }, /* close, behind title */
    { x: "18vw",  y: "12vh",  scale: 0.7,  rotation: 7,  opacity: 0.55 }, /* mid, right */
    { x: "-32vw", y: "2vh",   scale: 0.75, rotation: 4,  opacity: 0.6 },  /* mid-far, left edge */
    { x: "35vw",  y: "-3vh",  scale: 0.55, rotation: -6, opacity: 0.4 },  /* far, right edge */
    { x: "5vw",   y: "-8vh",  scale: 0.9,  rotation: 3,  opacity: 0.8 },  /* mid, behind title */
    { x: "-18vw", y: "-28vh", scale: 0.45, rotation: -5, opacity: 0.35 }, /* far, top left */
    { x: "12vw",  y: "25vh",  scale: 0.8,  rotation: 6,  opacity: 0.65 }, /* mid, bottom right */
    { x: "-4vw",  y: "30vh",  scale: 0.5,  rotation: -3, opacity: 0.4 },  /* far, bottom center */
  ];

  var mobileScatteredStates = [
    { x: "-20vw", y: "-30vh", scale: 0.6, rotation: -5, opacity: 0.6 },
    { x: "15vw",  y: "-20vh", scale: 0.5, rotation: 4, opacity: 0.5 },
    { x: "-10vw", y: "10vh",  scale: 0.75, rotation: -2, opacity: 0.8 },
    { x: "20vw",  y: "5vh",   scale: 0.55, rotation: 5, opacity: 0.5 },
    { x: "-25vw", y: "-5vh",  scale: 0.65, rotation: 3, opacity: 0.65 },
    { x: "25vw",  y: "-15vh", scale: 0.5, rotation: -4, opacity: 0.45 },
    { x: "0vw",   y: "-25vh", scale: 0.6, rotation: 2, opacity: 0.6 },
    { x: "-15vw", y: "25vh",  scale: 0.45, rotation: -3, opacity: 0.4 },
    { x: "10vw",  y: "20vh",  scale: 0.55, rotation: 4, opacity: 0.5 },
    { x: "-5vw",  y: "30vh",  scale: 0.5, rotation: -2, opacity: 0.4 },
  ];

  var scatteredStates = isMobile ? mobileScatteredStates : desktopScatteredStates;

  /* Compute pixel values */
  function computeScatteredPx() {
    return scatteredStates.map(function (s) {
      return {
        x: toPx(s.x), y: toPx(s.y),
        scale: s.scale, rotation: s.rotation,
        opacity: s.opacity, zIndex: Math.round(s.scale * 10)
      };
    });
  }

  var scatteredPx = computeScatteredPx();

  /* Compute arc targets */
  function computeArcTargets() {
    var targets = [];
    cards.forEach(function (card, i) {
      var offset = i - centerIndex;
      if (offset > totalCards / 2) offset -= totalCards;
      if (offset < -totalCards / 2) offset += totalCards;
      targets.push(getArcPosition(offset));
    });
    return targets;
  }

  var arcTargets = computeArcTargets();

  /* Set initial scattered positions — include xPercent/yPercent to preserve centering */
  function setScattered() {
    cards.forEach(function (card, i) {
      var s = scatteredPx[i];
      gsap.set(card, {
        x: s.x, y: s.y, xPercent: -50, yPercent: -50,
        scale: s.scale, rotation: s.rotation,
        opacity: s.opacity, zIndex: s.zIndex,
      });
    });
  }

  setScattered();

  /* ══════════════════════════════════════════════
     IDLE FLOATING
     ══════════════════════════════════════════════ */
  var floatTweens = [];
  var floatingActive = false;

  function startFloating() {
    if (isSettled || floatingActive) return;
    floatingActive = true;
    var floatX = isMobile ? 30 : 50;
    var floatY = isMobile ? 25 : 40;

    cards.forEach(function (card) {
      var randomX = (Math.random() - 0.5) * floatX;
      var randomY = (Math.random() - 0.5) * floatY;
      var duration = 3 + Math.random() * 3;

      var tween = gsap.to(card, {
        x: "+=" + randomX, y: "+=" + randomY,
        duration: duration, ease: "sine.inOut",
        repeat: -1, yoyo: true, delay: Math.random() * 2,
      });
      floatTweens.push(tween);
    });
  }

  function stopFloating() {
    if (!floatingActive) return;
    floatingActive = false;
    floatTweens.forEach(function (tween) { tween.kill(); });
    floatTweens = [];
  }

  startFloating();

  /* ══════════════════════════════════════════════
     SCROLL-SCRUBBED SETTLE
     Manual interpolation via onUpdate
     ══════════════════════════════════════════════ */

  var lastProgress = 0;

  ScrollTrigger.create({
    trigger: page,
    start: "top top",
    end: "+=" + window.innerHeight,
    pin: true,
    pinSpacing: true,
    onUpdate: function (self) {
      var p = self.progress;
      lastProgress = p;

      /* Stop floating once scrub starts */
      if (p > 0.02 && floatingActive) {
        stopFloating();
        /* Reset to base scattered before interpolating */
        setScattered();
      }

      if (p <= 0.02) return;

      /* Smoothstep easing */
      var ep = p * p * (3 - 2 * p);

      /* Fade heading */
      scatterHeading.style.opacity = Math.max(0, 1 - ep * 3);

      /* Interpolate each card */
      cards.forEach(function (card, i) {
        var s = scatteredPx[i];
        var a = arcTargets[i];

        gsap.set(card, {
          x: s.x + (a.x - s.x) * ep,
          y: s.y + (a.y - s.y) * ep,
          xPercent: -50,
          yPercent: -50,
          scale: s.scale + (a.scale - s.scale) * ep,
          rotation: s.rotation + (a.rotation - s.rotation) * ep,
          opacity: s.opacity + (a.opacity - s.opacity) * ep,
          zIndex: Math.round(s.zIndex + (a.zIndex - s.zIndex) * ep),
        });

        card.classList.toggle("is-center", ep > 0.9 && i === centerIndex);
      });
    },
    onLeaveBack: function () {
      isSettled = false;
      document.documentElement.classList.remove("portfolio-active");
      header.style.pointerEvents = "none";
      gsap.set(header, { opacity: 0 });
      gsap.set(footer, { opacity: 0 });
      footer.style.pointerEvents = "none";
      scatterHeading.style.opacity = 1;

      setScattered();
      cards.forEach(function (card) { card.classList.remove("is-center"); });
      startFloating();
    },
    onLeave: function () {
      isSettled = true;
      document.documentElement.classList.add("portfolio-active");

      /* Snap to exact arc positions */
      cards.forEach(function (card, i) {
        var a = arcTargets[i];
        gsap.set(card, {
          x: a.x, y: a.y, xPercent: -50, yPercent: -50,
          scale: a.scale, rotation: a.rotation,
          opacity: a.opacity, zIndex: a.zIndex,
        });
        card.classList.toggle("is-center", i === centerIndex);
      });

      gsap.to(header, {
        opacity: 1, duration: 0.4, ease: "power2.out",
        onComplete: function () { header.style.pointerEvents = "auto"; }
      });
      gsap.to(footer, {
        opacity: 1, duration: 0.4, ease: "power2.out",
        onComplete: function () { footer.style.pointerEvents = "auto"; }
      });
    },
  });

  /* Lock page scroll when carousel is active (prevents mobile scroll-back flash) */
  document.addEventListener("touchmove", function (e) {
    if (isSettled) e.preventDefault();
  }, { passive: false });

  /* Stop/restart floating on scroll */
  var scrollTimeout;
  window.addEventListener("scroll", function () {
    if (floatingActive && !isSettled) {
      stopFloating();
    }
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function () {
      if (!isSettled && lastProgress < 0.02) {
        setScattered();
        startFloating();
      }
    }, 300);
  }, { passive: true });

  /* ══════════════════════════════════════════════
     CAROUSEL ROTATION — Active after settle
     ══════════════════════════════════════════════ */

  function rotateCarousel(direction) {
    if (isAnimating) return;
    isAnimating = true;

    centerIndex = (centerIndex + direction + totalCards) % totalCards;

    var tl = gsap.timeline({ onComplete: function () { isAnimating = false; } });

    cards.forEach(function (card, i) {
      var offset = i - centerIndex;
      if (offset > totalCards / 2) offset -= totalCards;
      if (offset < -totalCards / 2) offset += totalCards;

      var pos = getArcPosition(offset);
      card.classList.toggle("is-center", offset === 0);

      tl.to(card, {
        x: pos.x, y: pos.y, xPercent: -50, yPercent: -50,
        rotation: pos.rotation, scale: pos.scale,
        zIndex: pos.zIndex, opacity: pos.opacity,
        duration: 0.5, ease: "power2.out", overwrite: true,
      }, 0);
    });
  }

  /* ══════════════════════════════════════════════
     WHEEL / TOUCH — Carousel when settled
     ══════════════════════════════════════════════ */

  page.addEventListener("wheel", function (e) {
    if (!isSettled) return;
    e.preventDefault();
    if (isAnimating) return;

    scrollAccumulator += e.deltaY;
    if (Math.abs(scrollAccumulator) >= scrollThreshold) {
      var direction = scrollAccumulator > 0 ? 1 : -1;
      scrollAccumulator = 0;
      rotateCarousel(direction);
    }
  }, { passive: false });

  var touchStartY = 0;

  page.addEventListener("touchstart", function (e) {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  page.addEventListener("touchmove", function (e) {
    if (!isSettled || isAnimating) return;
    e.preventDefault();
    var deltaY = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;

    scrollAccumulator += deltaY;
    if (Math.abs(scrollAccumulator) >= scrollThreshold / 2) {
      var direction = scrollAccumulator > 0 ? 1 : -1;
      scrollAccumulator = 0;
      rotateCarousel(direction);
    }
  }, { passive: false });

  document.addEventListener("keydown", function (e) {
    if (!isSettled || isAnimating) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") rotateCarousel(1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") rotateCarousel(-1);
  });

  /* ══════════════════════════════════════════════
     IDLE HINT
     ══════════════════════════════════════════════ */
  var idleHint = document.createElement("div");
  idleHint.className = "portfolio-idle-hint";
  idleHint.textContent = "Scroll to explore our projects";
  document.body.appendChild(idleHint);

  var idleTimer = null;
  var mouseX = 0, mouseY = 0;

  function resetIdleTimer() {
    idleHint.classList.remove("visible");
    clearTimeout(idleTimer);
    if (isSettled) return;
    idleTimer = setTimeout(function () {
      if (!isSettled) {
        idleHint.style.left = mouseX + "px";
        idleHint.style.top = mouseY + "px";
        idleHint.classList.add("visible");
      }
    }, 3000);
  }

  page.addEventListener("mousemove", function (e) {
    mouseX = e.clientX; mouseY = e.clientY;
    idleHint.style.left = mouseX + "px";
    idleHint.style.top = mouseY + "px";
    resetIdleTimer();
  });

  resetIdleTimer();

  /* ══════════════════════════════════════════════
     RESIZE HANDLER
     ══════════════════════════════════════════════ */
  var resizeTimeout;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      isMobile = window.innerWidth <= 768;
      scatteredStates = isMobile ? mobileScatteredStates : desktopScatteredStates;
      scatteredPx = computeScatteredPx();
      arcTargets = computeArcTargets();

      if (isSettled) {
        cards.forEach(function (card, i) {
          var a = arcTargets[i];
          gsap.set(card, {
            x: a.x, y: a.y, xPercent: -50, yPercent: -50,
            scale: a.scale, rotation: a.rotation,
            opacity: a.opacity, zIndex: a.zIndex,
          });
        });
      } else {
        setScattered();
      }
    }, 200);
  });

});
