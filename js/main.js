/* ══════════════════════════════════════════════
   NW HOMEWORKS — Global JavaScript
   ══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {

  /* ── Reveal body ── */
  document.body.classList.add("loaded");

  /* ══════════════════════════════════════════════
     HEADER SCROLL EFFECT
     ══════════════════════════════════════════════ */
  var header = document.querySelector(".site-header");
  var headerLogo = document.querySelector(".header-logo img");
  var logoDark = headerLogo ? headerLogo.src : "";
  var logoLight = "/images/2026/03/Main-Logo-Light.svg";

  if (header) {
    window.addEventListener("scroll", function () {
      var scrolled = window.scrollY > 50;
      header.classList.toggle("scrolled", scrolled);

      /* Swap logo on scroll */
      if (headerLogo) {
        headerLogo.src = scrolled ? logoLight : logoDark;
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════
     MOBILE MENU
     ══════════════════════════════════════════════ */
  var toggle = document.querySelector(".menu-toggle");
  var mobileNav = document.querySelector(".mobile-nav");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("active");
      mobileNav.classList.toggle("active");
      document.body.style.overflow = mobileNav.classList.contains("active") ? "hidden" : "";
    });

    /* Close menu on link click */
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.classList.remove("active");
        mobileNav.classList.remove("active");
        document.body.style.overflow = "";
      });
    });
  }

  /* ══════════════════════════════════════════════
     LIGHT PAGE DETECTION
     ══════════════════════════════════════════════ */
  var path = window.location.pathname;
  if (
    path.match(/\/portfolio\/?$/) ||
    path.match(/\/services\/?$/) ||
    path.indexOf("/services/our-process") !== -1 ||
    path.indexOf("/contact") !== -1 ||
    path.indexOf("/blog") !== -1 ||
    path.indexOf("/privacy-policy") !== -1
  ) {
    document.body.classList.add("light-page");
  }

});
