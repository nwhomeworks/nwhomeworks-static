// Services hub reveal animations.
//
// The hero heading and its subtitle animate via CSS keyframes in services.css,
// not from here — they sit above the fold, and when their reveal depended on a
// ScrollTrigger that never entered, an invisible <h1> shipped on /services/.
// Only the intro paragraph, which is genuinely below the fold, is scroll-driven,
// and its hidden state is set here so it stays readable if GSAP fails to load.
document.addEventListener("DOMContentLoaded", function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  var intro = document.querySelector(".services-intro");
  if (!intro) return;

  gsap.set(intro, { opacity: 0 });
  ScrollTrigger.create({
    trigger: intro,
    start: "top 90%",
    once: true,
    onEnter: function () { gsap.to(intro, { opacity: 1, duration: .6, ease: "power2.out" }); }
  });

  // Trigger positions are computed before the hero image finishes loading.
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
});
