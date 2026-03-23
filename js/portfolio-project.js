/* ══════════════════════════════════════════════
   PORTFOLIO PROJECT PAGE — GSAP + Lightbox
   ══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {

  gsap.registerPlugin(ScrollTrigger);

  /* ── Heading reveal ── */
  var h1 = document.querySelector(".project-heading h1");
  if (h1) {
    ScrollTrigger.create({
      trigger: h1, start: "top 85%", once: true,
      onEnter: function () {
        gsap.to(h1, { clipPath: "inset(0 0 0% 0)", duration: 0.8, ease: "power2.inOut" });
      }
    });
  }

  var location = document.querySelector(".project-location");
  if (location) {
    ScrollTrigger.create({
      trigger: location, start: "top 85%", once: true,
      onEnter: function () {
        gsap.to(location, { opacity: 1, duration: 0.5, delay: 0.2, ease: "power2.out" });
      }
    });
  }

  var desc = document.querySelector(".project-description");
  if (desc) {
    ScrollTrigger.create({
      trigger: desc, start: "top 85%", once: true,
      onEnter: function () {
        gsap.to(desc, { opacity: 1, duration: 0.5, delay: 0.4, ease: "power2.out" });
      }
    });
  }

  /* ── Gallery items fade in ── */
  var galleryItems = document.querySelectorAll(".project-gallery-item");
  galleryItems.forEach(function (item, i) {
    ScrollTrigger.create({
      trigger: item, start: "top 90%", once: true,
      onEnter: function () {
        gsap.to(item, { opacity: 1, y: 0, duration: 0.5, delay: (i % 3) * 0.1, ease: "power2.out" });
      }
    });
  });

  /* ══════════════════════════════════════════════
     LIGHTBOX
     ══════════════════════════════════════════════ */
  var lightbox = document.querySelector(".lightbox");
  var lightboxImg = document.querySelector(".lightbox-img");
  var lightboxCounter = document.querySelector(".lightbox-counter");
  var lightboxPrev = document.querySelector(".lightbox-prev");
  var lightboxNext = document.querySelector(".lightbox-next");
  var lightboxClose = document.querySelector(".lightbox-close");

  if (!lightbox) return;

  var galleryImages = [];
  var currentLightboxIndex = 0;

  galleryItems.forEach(function (item) {
    var img = item.querySelector("img");
    if (img) galleryImages.push(img.getAttribute("data-full") || img.src);
  });

  function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightboxImage();
    lightbox.style.display = "flex";
    requestAnimationFrame(function () { lightbox.classList.add("active"); });
    document.body.style.overflow = "hidden";
  }

  function closeLightboxFn() {
    lightbox.classList.remove("active");
    setTimeout(function () { lightbox.style.display = "none"; }, 300);
    document.body.style.overflow = "";
  }

  function updateLightboxImage() {
    lightboxImg.src = galleryImages[currentLightboxIndex];
    lightboxCounter.textContent = (currentLightboxIndex + 1) + " / " + galleryImages.length;
  }

  function nextImage() {
    currentLightboxIndex = (currentLightboxIndex + 1) % galleryImages.length;
    updateLightboxImage();
  }

  function prevImage() {
    currentLightboxIndex = (currentLightboxIndex - 1 + galleryImages.length) % galleryImages.length;
    updateLightboxImage();
  }

  galleryItems.forEach(function (item, i) {
    item.addEventListener("click", function () { openLightbox(i); });
  });

  lightboxClose.addEventListener("click", closeLightboxFn);
  lightboxNext.addEventListener("click", function (e) { e.stopPropagation(); nextImage(); });
  lightboxPrev.addEventListener("click", function (e) { e.stopPropagation(); prevImage(); });

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightboxFn();
  });

  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightboxFn();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  });

  var touchStartX = 0;
  lightbox.addEventListener("touchstart", function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener("touchend", function (e) {
    var deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) prevImage();
      else nextImage();
    }
  });

});
