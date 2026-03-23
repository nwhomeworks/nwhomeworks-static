/* ══════════════════════════════════════════════
   SHARED SUB-SERVICE PAGE — GSAP + Before/After
   ══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {

  gsap.registerPlugin(ScrollTrigger);

  /* ══════════════════════════════════════════════
     HEADING TEXT REVEAL
     ══════════════════════════════════════════════ */
  var h1 = document.querySelector(".subpage-heading h1") || document.querySelector(".process-page-heading h1");
  if (h1) {
    ScrollTrigger.create({
      trigger: h1,
      start: "top 85%",
      once: true,
      onEnter: function () {
        gsap.to(h1, {
          clipPath: "inset(0 0 0% 0)",
          duration: 0.8,
          ease: "power2.inOut",
        });
      }
    });
  }

  var subtitle = document.querySelector(".subpage-heading p") || document.querySelector(".process-subtitle");
  if (subtitle) {
    ScrollTrigger.create({
      trigger: subtitle,
      start: "top 85%",
      once: true,
      onEnter: function () {
        gsap.to(subtitle, {
          opacity: 1,
          duration: 0.6,
          delay: 0.3,
          ease: "power2.out",
        });
      }
    });
  }

  var processIntro = document.querySelector(".process-intro");
  if (processIntro) {
    ScrollTrigger.create({
      trigger: processIntro,
      start: "top 85%",
      once: true,
      onEnter: function () {
        gsap.to(processIntro, {
          opacity: 1,
          duration: 0.6,
          delay: 0.5,
          ease: "power2.out",
        });
      }
    });
  }

  /* ══════════════════════════════════════════════
     CONTENT BLOCKS + DIVIDERS + EXPERTISE FADE IN
     ══════════════════════════════════════════════ */
  var fadeElements = document.querySelectorAll(".content-block, .content-divider, .expertise-section, .process-step");
  fadeElements.forEach(function (el) {
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: function () {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
        });
      }
    });
  });

  /* ══════════════════════════════════════════════
     BEFORE / AFTER SLIDER
     ══════════════════════════════════════════════ */
  var sliders = document.querySelectorAll(".ba-slider");

  sliders.forEach(function (slider) {
    var beforeEl = slider.querySelector(".ba-before");
    var handle = slider.querySelector(".ba-handle");
    var isDragging = false;

    function updatePosition(x) {
      var rect = slider.getBoundingClientRect();
      var position = (x - rect.left) / rect.width;
      position = Math.max(0.02, Math.min(0.98, position));
      var percent = position * 100;
      beforeEl.style.clipPath = "inset(0 " + (100 - percent) + "% 0 0)";
      handle.style.left = percent + "%";
    }

    slider.addEventListener("mousedown", function (e) {
      isDragging = true;
      updatePosition(e.clientX);
      e.preventDefault();
    });

    window.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      updatePosition(e.clientX);
      e.preventDefault();
    });

    window.addEventListener("mouseup", function () {
      isDragging = false;
    });

    slider.addEventListener("touchstart", function (e) {
      isDragging = true;
      updatePosition(e.touches[0].clientX);
    }, { passive: true });

    slider.addEventListener("touchmove", function (e) {
      if (!isDragging) return;
      updatePosition(e.touches[0].clientX);
      e.preventDefault();
    }, { passive: false });

    slider.addEventListener("touchend", function () {
      isDragging = false;
    });
  });

});
