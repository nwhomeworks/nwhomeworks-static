/* ══════════════════════════════════════════════
   SERVICES PAGE — GSAP Animations
   ══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {

  gsap.registerPlugin(ScrollTrigger);

  /* ══════════════════════════════════════════════
     TEXT REVEAL ANIMATIONS
     ══════════════════════════════════════════════ */

  var heroH1 = document.querySelector(".services-hero-heading h1");
  if (heroH1) {
    ScrollTrigger.create({
      trigger: heroH1,
      start: "top 85%",
      once: true,
      onEnter: function () {
        gsap.to(heroH1, {
          clipPath: "inset(0 0 0% 0)",
          duration: 0.8,
          ease: "power2.inOut",
        });
      }
    });
  }

  var heroP = document.querySelector(".services-hero-heading p");
  if (heroP) {
    ScrollTrigger.create({
      trigger: heroP,
      start: "top 85%",
      once: true,
      onEnter: function () {
        gsap.to(heroP, {
          opacity: 1,
          duration: 0.6,
          delay: 0.3,
          ease: "power2.out",
        });
      }
    });
  }

  var intro = document.querySelector(".services-intro");
  if (intro) {
    ScrollTrigger.create({
      trigger: intro,
      start: "top 85%",
      once: true,
      onEnter: function () {
        gsap.to(intro, {
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
        });
      }
    });
  }

  /* ══════════════════════════════════════════════
     SERVICE CARDS — Scroll Stair-Step
     ══════════════════════════════════════════════ */

  var cards = document.querySelectorAll(".service-card");
  var cardsSection = document.querySelector(".services-cards-section");

  if (cards.length > 0 && cardsSection && window.innerWidth > 768) {

    cards.forEach(function (card) {
      gsap.set(card, { top: 0, opacity: 0, y: 30 });
    });

    ScrollTrigger.create({
      trigger: cardsSection,
      start: "top 60%",
      once: true,
      onEnter: function () {
        cards.forEach(function (card, i) {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.15,
            ease: "power2.out",
          });
        });
      }
    });

    var stairStepOffsets = [0, 5, 10, 15];

    var cardStairTL = gsap.timeline({
      scrollTrigger: {
        trigger: cardsSection,
        start: "top 30%",
        end: "top -10%",
        scrub: 0.4,
      }
    });

    cards.forEach(function (card, i) {
      cardStairTL.to(card, {
        top: stairStepOffsets[i] + "vh",
        duration: 1,
        ease: "power2.out",
      }, i * 0.15);
    });

  } else if (cards.length > 0) {
    /* Mobile: simple fade-in */
    cards.forEach(function (card) {
      gsap.set(card, { opacity: 0, y: 20 });
      ScrollTrigger.create({
        trigger: card,
        start: "top 90%",
        once: true,
        onEnter: function () {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
          });
        }
      });
    });
  }

  /* ══════════════════════════════════════════════
     PROCESS BAR — Stair-Step Animation
     ══════════════════════════════════════════════ */

  var processBar = document.querySelector(".process-bar");
  var processSpacer = document.querySelector(".process-scroll-spacer");
  var processRows = document.querySelectorAll(".process-row");

  if (!processBar || !processSpacer || processRows.length === 0) return;

  if (window.innerWidth > 768) {

    /* ── Gradient trail colors: closest to bar → furthest ── */
    var gradientColors = [
      "#A3CB6B",  /* slightly lighter than bar */
      "#B3D478",
      "#C5DF94",
      "#D6E9B3",
      "#E6F1D0",
      "#F3F8EA"   /* very light, near white */
    ];

    /* Attach 6 trail squares as children of ALL rows */
    [0, 1, 2, 3].forEach(function (rowIdx) {
      var row = processRows[rowIdx];
      row.style.overflow = "visible";

      for (var s = 0; s < 6; s++) {
        var trail = document.createElement("div");
        trail.className = "process-trail";
        /* Position to the LEFT of the row's left edge */
        /* Square 1 (closest) at -1 square width, square 6 at -6 square widths */
        trail.style.right = "100%";
        trail.style.marginRight = (s * 3.75) + "vh";
        trail.style.background = gradientColors[s];
        row.appendChild(trail);
      }
    });

    var stairTL = gsap.timeline({
      scrollTrigger: {
        trigger: processSpacer,
        start: "top bottom",
        end: "bottom bottom",
        scrub: 0.5,
        pin: cardsSection,
        pinSpacing: false,
      }
    });

    /* All 4 rows slide — same 14.4vw step between each */
    stairTL.to(processRows[3], {
      x: "57.6vw",
      duration: 1,
      ease: "power2.out",
    }, 0);

    stairTL.to(processRows[2], {
      x: "43.2vw",
      duration: 1,
      ease: "power2.out",
    }, 0.15);

    stairTL.to(processRows[1], {
      x: "28.8vw",
      duration: 1,
      ease: "power2.out",
    }, 0.3);

    stairTL.to(processRows[0], {
      x: "14.4vw",
      duration: 1,
      ease: "power2.out",
    }, 0.45);
  }

});
