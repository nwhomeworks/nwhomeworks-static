/* ══════════════════════════════════════════════
   PORTFOLIO PREVIEW — Mobile Scatter Animation
   ══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {
  if (window.innerWidth > 1024) return;

  var portfolioSection = document.querySelector(".portfolio-section");
  if (!portfolioSection) return;

  var projects = [
    { name: "Queen Anne Fireplace Feature Wall", url: "/portfolio/queen-anne-fireplace", image: "/images/2026/03/Seattle-feature-wall-tile-fireplace-surround-media-wall.webp", orientation: "portrait" },
    { name: "Redmond Kitchen", url: "/portfolio/redmond-kitchen", image: "/images/2026/03/redmond-kitchen-remodel-white-shaker-cabinets-blue-star-professional-range.webp", orientation: "landscape" },
    { name: "Normandy Park Kitchen", url: "/portfolio/normandy-park-kitchen", image: "/images/2026/03/normandy-park-walnut-cabinets-farnhouse-sink-tile-backsplash.webp", orientation: "landscape" },
    { name: "Gig Harbor Master Bath", url: "/portfolio/gig-harbor-master-bath", image: "/images/2026/03/luxury-marble-master-bathroom-remodel-seattle-bathtub-shower-design-ideas.webp", orientation: "portrait" },
    { name: "Maple Leaf Master Suite", url: "/portfolio/maple-leaf-master-bath", image: "/images/2026/03/master-bath-remodel-green-tile-shower-surround-brass-hardware.webp", orientation: "landscape" }
  ];

  var scatteredStates = [
    { x: "5vw",  y: "8vh",  w: "40vw", h: "55vw",  opacity: 1,    blur: 0, scale: 1,   zIndex: 4 },
    { x: "50vw", y: "3vh",  w: "42vw", h: "30vw",  opacity: 0.5,  blur: 2, scale: 0.8, zIndex: 2 },
    { x: "15vw", y: "50vh", w: "50vw", h: "35vw",  opacity: 0.8,  blur: 0, scale: 0.9, zIndex: 3 },
    { x: "55vw", y: "40vh", w: "35vw", h: "50vw",  opacity: 1,    blur: 0, scale: 1,   zIndex: 5 },
    { x: "8vw",  y: "68vh", w: "38vw", h: "26vw",  opacity: 0.45, blur: 2, scale: 0.75, zIndex: 1 }
  ];

  /* Settled positions — vertical cascade */
  var imgW = 54;
  var imgH_landscape = 34;
  var imgH_portrait = 40;
  var overlapAmount = 13;
  var leftOffset = 8;
  var rightOffset = 40;

  var settledStates = [];
  var currentTop = 42;

  projects.forEach(function (proj, i) {
    var isPortrait = proj.orientation === "portrait";
    var h = isPortrait ? imgH_portrait : imgH_landscape;
    var xPos = (i % 2 === 0) ? leftOffset : rightOffset;

    settledStates.push({
      x: xPos + "vw",
      y: currentTop + "vw",
      w: imgW + "vw",
      h: h + "vw",
      zIndex: 5 + i
    });

    currentTop += h - overlapAmount;
  });

  /* Create DOM elements */
  var frame = document.querySelector(".portfolio-frame");

  if (!frame) {
    frame = document.createElement("div");
    frame.className = "portfolio-frame";
    document.body.appendChild(frame);
  }

  frame.innerHTML = "";
  frame.style.visibility = "hidden";
  frame.style.top = "100vh";

  var heading = document.createElement("div");
  heading.className = "portfolio-heading";
  heading.textContent = "Our Work";
  frame.appendChild(heading);

  var subtext = document.createElement("div");
  subtext.className = "portfolio-subtext";
  subtext.innerHTML = '<a href="/portfolio/">See the full portfolio \u2192</a>';
  frame.appendChild(subtext);

  var items = [];
  var floatTweens = [];

  projects.forEach(function (proj, i) {
    var item = document.createElement("div");
    item.className = "portfolio-item";

    var link = document.createElement("a");
    link.href = proj.url;

    var img = document.createElement("div");
    img.className = "portfolio-item-img";
    img.style.backgroundImage = "url(" + proj.image + ")";

    var label = document.createElement("div");
    label.className = "portfolio-item-label";
    label.textContent = proj.name;

    link.appendChild(img);
    item.appendChild(link);
    item.appendChild(label);
    frame.appendChild(item);

    var s = scatteredStates[i];
    gsap.set(item, {
      left: s.x, top: s.y, width: s.w, height: s.h,
      opacity: s.opacity, scale: s.scale,
      filter: "blur(" + s.blur + "px)", zIndex: s.zIndex,
    });

    items.push(item);
  });

  /* Idle floating — lighter for mobile, only 3 images */
  var isSettled = false;
  var floatingActive = false;
  var floatIndices = [0, 2, 3];

  function startFloating() {
    if (floatingActive || isSettled) return;
    floatingActive = true;

    floatIndices.forEach(function (idx) {
      var randomX = (Math.random() - 0.5) * 15;
      var randomY = (Math.random() - 0.5) * 10;
      var duration = 3.5 + Math.random() * 2.5;

      var tween = gsap.to(items[idx], {
        x: randomX, y: randomY,
        duration: duration, ease: "sine.inOut",
        repeat: -1, yoyo: true, delay: Math.random() * 1.5,
      });
      floatTweens.push(tween);
    });
  }

  function stopFloating() {
    if (!floatingActive) return;
    floatingActive = false;
    floatTweens.forEach(function (tween) { tween.kill(); });
    floatTweens = [];
    items.forEach(function (item) {
      gsap.to(item, { x: 0, y: 0, duration: 0.4, ease: "power2.out" });
    });
  }

  var scrollTimeout;
  window.addEventListener("scroll", function () {
    if (floatingActive && !isSettled) stopFloating();
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function () {
      if (!isSettled) startFloating();
    }, 200);
  }, { passive: true });

  /* Phase 1: Scroll in */
  var scrollInTL = gsap.timeline({
    scrollTrigger: {
      trigger: portfolioSection,
      start: "top bottom",
      end: "top top",
      scrub: 0.3,
      onEnter: function () { frame.style.visibility = "visible"; },
      onLeaveBack: function () {
        frame.style.visibility = "hidden";
        gsap.set(frame, { top: "100vh" });
      }
    }
  });

  scrollInTL.to(frame, { top: "0vh", duration: 1, ease: "none" });

  /* Phase 2: Scatter to settled */
  var settleTL = gsap.timeline({
    scrollTrigger: {
      trigger: portfolioSection,
      start: "8% top",
      end: "40% top",
      scrub: 0.5,
      onEnter: function () { stopFloating(); },
      onLeaveBack: function () {
        isSettled = false;
        items.forEach(function (item, i) {
          var s = scatteredStates[i];
          gsap.set(item, {
            left: s.x, top: s.y, yPercent: 0,
            width: s.w, height: s.h,
            opacity: s.opacity, scale: s.scale,
            filter: "blur(" + s.blur + "px)", zIndex: s.zIndex,
          });
        });
        gsap.set(heading, {
          top: "50%", left: "50%", xPercent: -50, yPercent: -50, fontSize: "42px",
        });
        gsap.set(subtext, { opacity: 0 });
        startFloating();
      }
    }
  });

  settleTL.to(heading, { top: "10vh", fontSize: "36px", zIndex: 30, duration: 1, ease: "power2.inOut" });

  items.forEach(function (item, i) {
    var s = settledStates[i];
    settleTL.to(item, {
      left: s.x, top: s.y, yPercent: 0,
      width: s.w, height: s.h,
      opacity: 1, scale: 1, filter: "blur(0px)",
      duration: 1.2, ease: "power2.inOut",
    }, i === 0 ? "-=1.0" : "-=1.0");
  });

  settleTL.to(subtext, { opacity: 1, duration: 0.4 }, "-=0.2");

  /* Phase 3: Settled state */
  ScrollTrigger.create({
    trigger: portfolioSection,
    start: "38% top",
    end: "80% top",
    onEnter: function () { isSettled = true; stopFloating(); },
    onLeaveBack: function () { isSettled = false; }
  });

  /* Floating during scatter */
  ScrollTrigger.create({
    trigger: portfolioSection,
    start: "top top",
    end: "8% top",
    onEnter: function () { if (!isSettled) startFloating(); },
    onLeave: function () { stopFloating(); },
    onEnterBack: function () { if (!isSettled) startFloating(); }
  });

  /* Phase 4: Fade out */
  var fadeOutTL = gsap.timeline({
    scrollTrigger: {
      trigger: portfolioSection,
      start: "85% top",
      end: "95% top",
      scrub: 0.3,
      onLeave: function () { frame.style.visibility = "hidden"; isSettled = false; },
      onEnterBack: function () { frame.style.visibility = "visible"; isSettled = true; }
    }
  });

  fadeOutTL.to(frame, { opacity: 0, duration: 1 });
});
