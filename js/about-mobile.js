/* ══════════════════════════════════════════════
   ABOUT SECTION — Mobile Grid Wipe + Content Reveals
   ══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {
  if (window.innerWidth > 1024) return;

  var aboutSection = document.querySelector(".about-reveal-section");
  if (!aboutSection) return;

  var wipeGrid = document.querySelector(".wipe-grid");
  var wipeCells = document.querySelectorAll(".wipe-cell");
  var contentFrame = document.querySelector(".about-content-frame");
  var contentSetA = document.querySelector(".content-set-a");
  var contentSetB = document.querySelector(".content-set-b");

  if (!wipeGrid || wipeCells.length === 0 || !contentFrame) return;

  /* Move visual elements to body */
  document.body.appendChild(wipeGrid);
  document.body.appendChild(contentFrame);
  contentFrame.style.visibility = "hidden";

  var config = {
    contentRevealDuration: 0.8
  };

  /* ══════════════════════════════════════════════
     BUILD 2x3 CELL MAP — Only first 6 cells
     ══════════════════════════════════════════════ */
  var cols = 2;
  var cellArray = Array.from(wipeCells).slice(0, 6);
  var cellMap = [];

  cellArray.forEach(function (cell, index) {
    var row = Math.floor(index / cols);
    var col = index % cols;
    cellMap.push({ el: cell, row: row, col: col });
  });

  var lastHeroSlides = document.querySelectorAll(".hero-slide");
  var lastSlide = lastHeroSlides.length > 0 ? lastHeroSlides[lastHeroSlides.length - 1] : null;
  if (!lastSlide) return;

  /* ══════════════════════════════════════════════
     PHASE 1: WIPE — 2x3 alternating rows
     ══════════════════════════════════════════════ */
  var wipeTL = gsap.timeline({
    scrollTrigger: {
      trigger: aboutSection,
      start: "top bottom",
      end: "top top",
      scrub: 0.3,
    }
  });

  wipeTL.set(wipeGrid, { visibility: "visible" });

  cellMap.forEach(function (item) {
    var rowDelay = (2 - item.row) * 0.3;
    var colPosition;
    if (item.row === 2 || item.row === 0) {
      colPosition = (1 - item.col) * 0.2;
    } else {
      colPosition = item.col * 0.2;
    }

    wipeTL.to(item.el, {
      y: 0,
      duration: 0.8,
      ease: "power2.inOut",
    }, rowDelay + colPosition);
  });

  wipeTL.set(contentFrame, { visibility: "visible" });
  wipeTL.set(wipeGrid, { visibility: "hidden" });

  /* ══════════════════════════════════════════════
     PHASES 2-5: CONTENT REVEALS
     ══════════════════════════════════════════════ */
  var masterTL = gsap.timeline({
    scrollTrigger: {
      trigger: aboutSection,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onLeaveBack: function () {
        gsap.set(contentFrame, { visibility: "hidden" });
      }
    }
  });

  /* ── Content A reveals ── */
  masterTL.to(".heading-a-line1", {
    clipPath: "inset(0 0 0% 0)",
    duration: config.contentRevealDuration,
    ease: "power2.inOut",
  });

  masterTL.to(".about-headshot", {
    clipPath: "inset(0 0 0 0%)",
    duration: config.contentRevealDuration,
    ease: "power2.inOut",
  }, "-=0.3");

  masterTL.to(".heading-a-line2", {
    clipPath: "inset(0 0 0 0%)",
    duration: config.contentRevealDuration,
    ease: "power2.inOut",
  }, "-=0.3");

  masterTL.to(".about-text-a", {
    clipPath: "inset(0 0% 0 0)",
    duration: config.contentRevealDuration,
    ease: "power2.inOut",
  }, "-=0.5");

  masterTL.to({}, { duration: 0.2 });

  /* ── Content A exits ── */
  masterTL.to(".heading-a-line1", {
    clipPath: "inset(100% 0 0 0)",
    duration: 0.6,
    ease: "power2.in",
  });

  masterTL.to(".about-headshot", {
    clipPath: "inset(0 0 0 100%)",
    duration: 0.6,
    ease: "power2.in",
  }, "-=0.4");

  masterTL.to(".heading-a-line2", {
    clipPath: "inset(0 0 0 100%)",
    duration: 0.6,
    ease: "power2.in",
  }, "-=0.4");

  masterTL.to(".about-text-a", {
    clipPath: "inset(0 100% 0 0)",
    duration: 0.6,
    ease: "power2.in",
  }, "-=0.4");

  masterTL.to(contentSetA, { opacity: 0, duration: 0.3 });
  masterTL.set(contentSetB, { opacity: 1 });
  masterTL.to({}, { duration: 0.05 });

  /* ── Content B reveals ── */
  masterTL.to(".content-b-tagline", {
    clipPath: "inset(0 0% 0 0)",
    duration: config.contentRevealDuration,
    ease: "power2.inOut",
  });

  masterTL.to(".heading-b-line1", {
    clipPath: "inset(0% 0 0 0)",
    duration: config.contentRevealDuration,
    ease: "power2.inOut",
  }, "-=0.5");

  masterTL.to(".about-action-photo", {
    clipPath: "inset(0 0 0 0%)",
    duration: config.contentRevealDuration,
    ease: "power2.inOut",
  }, "-=0.3");

  masterTL.to(".heading-b-line2", {
    clipPath: "inset(0% 0 0 0)",
    duration: config.contentRevealDuration,
    ease: "power2.inOut",
  }, "-=0.3");

  masterTL.to(".about-text-b", {
    clipPath: "inset(0 0 0% 0)",
    duration: config.contentRevealDuration,
    ease: "power2.inOut",
  }, "-=0.5");

  masterTL.to({}, { duration: 0.2 });

  /* ══════════════════════════════════════════════
     HIDE CONTENT FRAME WHEN SCROLLING PAST
     ══════════════════════════════════════════════ */
  ScrollTrigger.create({
    trigger: aboutSection,
    start: "top top",
    end: "bottom bottom",
    onLeave: function () {
      contentFrame.style.visibility = "hidden";
      wipeGrid.style.visibility = "hidden";
    },
    onEnterBack: function () {
      contentFrame.style.visibility = "visible";
    },
    onRefresh: function (self) {
      if (self.progress >= 1) {
        contentFrame.style.visibility = "hidden";
        wipeGrid.style.visibility = "hidden";
      }
    }
  });
});
