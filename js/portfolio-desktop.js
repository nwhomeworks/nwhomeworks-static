/* ══════════════════════════════════════════════
   PORTFOLIO PREVIEW — Desktop Scatter Animation
   ══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {
  var portfolioSection = document.querySelector(".portfolio-section");
  if (!portfolioSection) return;

  var isMobile = window.innerWidth <= 1024;

  /* ══════════════════════════════════════════════
     PROJECT DATA
     ══════════════════════════════════════════════ */
  var projects = [
    {
      name: "Queen Anne Fireplace Feature Wall",
      url: "/portfolio/queen-anne-fireplace",
      image: "/images/2026/03/Seattle-feature-wall-tile-fireplace-surround-media-wall.webp",
      orientation: "portrait"
    },
    {
      name: "Redmond Kitchen",
      url: "/portfolio/redmond-kitchen",
      image: "/images/2026/03/redmond-kitchen-remodel-white-shaker-cabinets-blue-star-professional-range.webp",
      orientation: "landscape"
    },
    {
      name: "Normandy Park Kitchen",
      url: "/portfolio/normandy-park-kitchen",
      image: "/images/2026/03/normandy-park-walnut-cabinets-farnhouse-sink-tile-backsplash.webp",
      orientation: "landscape"
    },
    {
      name: "Gig Harbor Master Bath",
      url: "/portfolio/gig-harbor-master-bath",
      image: "/images/2026/03/luxury-marble-master-bathroom-remodel-seattle-bathtub-shower-design-ideas.webp",
      orientation: "portrait"
    },
    {
      name: "Maple Leaf Master Suite",
      url: "/portfolio/maple-leaf-master-bath",
      image: "/images/2026/03/master-bath-remodel-green-tile-shower-surround-brass-hardware.webp",
      orientation: "landscape"
    }
  ];

  /* ══════════════════════════════════════════════
     SCATTERED POSITIONS
     ══════════════════════════════════════════════ */
  var scatteredStates = isMobile ? [
    { x: "5vw",  y: "10vh", w: "38vw", h: "50vw", opacity: 1,    blur: 0, scale: 1,    zIndex: 5 },
    { x: "55vw", y: "5vh",  w: "40vw", h: "28vw", opacity: 0.6,  blur: 2, scale: 0.85, zIndex: 2 },
    { x: "22vw", y: "52vh", w: "44vw", h: "30vw", opacity: 0.85, blur: 0, scale: 0.95, zIndex: 4 },
    { x: "58vw", y: "35vh", w: "32vw", h: "42vw", opacity: 1,    blur: 0, scale: 1,    zIndex: 5 },
    { x: "2vw",  y: "56vh", w: "34vw", h: "24vw", opacity: 0.5,  blur: 3, scale: 0.75, zIndex: 1 }
  ] : [
    { x: "8vw",  y: "10vh", w: "18vw", h: "26vw",  opacity: 1,    blur: 0, scale: 1,    zIndex: 5 },
    { x: "55vw", y: "5vh",  w: "22vw", h: "15vw",  opacity: 0.55, blur: 2, scale: 0.85, zIndex: 2 },
    { x: "32vw", y: "55vh", w: "26vw", h: "18vw",  opacity: 0.85, blur: 0, scale: 0.95, zIndex: 4 },
    { x: "65vw", y: "30vh", w: "16vw", h: "23vw",  opacity: 1,    blur: 0, scale: 1,    zIndex: 5 },
    { x: "3vw",  y: "52vh", w: "18vw", h: "12vw",  opacity: 0.45, blur: 3, scale: 0.75, zIndex: 1 }
  ];

  /* ══════════════════════════════════════════════
     SETTLED POSITIONS
     ══════════════════════════════════════════════ */
  var settledStates;

  if (isMobile) {
    /* Mobile: 2-column grid with 5th card centered */
    settledStates = [
      { x: "6vw",  y: "24vh", w: "40vw", h: "34vw" },
      { x: "54vw", y: "28vh", w: "40vw", h: "28vw" },
      { x: "6vw",  y: "52vh", w: "40vw", h: "28vw" },
      { x: "54vw", y: "48vh", w: "40vw", h: "34vw" },
      { x: "30vw", y: "74vh", w: "40vw", h: "28vw" }
    ];
  } else {
    var settledSizes = projects.map(function (proj) {
      if (proj.orientation === "portrait") {
        return { w: 14, h: 21 };
      } else {
        return { w: 19, h: 13 };
      }
    });

    var settledGap = 2;
    var totalRowW = 0;
    settledSizes.forEach(function (s) { totalRowW += s.w; });
    totalRowW += settledGap * (projects.length - 1);
    var startX = (100 - totalRowW) / 2;

    settledStates = [];
    var currentX = startX;
    settledSizes.forEach(function (s) {
      settledStates.push({
        x: currentX + "vw",
        w: s.w + "vw",
        h: s.h + "vw"
      });
      currentX += s.w + settledGap;
    });
  }

  /* ══════════════════════════════════════════════
     CREATE DOM ELEMENTS
     ══════════════════════════════════════════════ */
  var frame = document.createElement("div");
  frame.className = "portfolio-frame";

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
      left: s.x,
      top: s.y,
      width: s.w,
      height: s.h,
      opacity: s.opacity,
      scale: s.scale,
      filter: "blur(" + s.blur + "px)",
      zIndex: s.zIndex,
    });

    items.push(item);
  });

  document.body.appendChild(frame);

  /* ══════════════════════════════════════════════
     IDLE FLOATING
     ══════════════════════════════════════════════ */
  var isSettled = false;
  var floatingActive = false;

  function startFloating() {
    if (floatingActive || isSettled) return;
    floatingActive = true;

    items.forEach(function (item) {
      var randomX = (Math.random() - 0.5) * (isMobile ? 25 : 50);
      var randomY = (Math.random() - 0.5) * (isMobile ? 20 : 40);
      var duration = 3 + Math.random() * 3;

      var tween = gsap.to(item, {
        x: randomX,
        y: randomY,
        duration: duration,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 1.5,
      });

      floatTweens.push(tween);
    });
  }

  function stopFloating() {
    if (!floatingActive) return;
    floatingActive = false;

    floatTweens.forEach(function (tween) {
      tween.kill();
    });
    floatTweens = [];

    items.forEach(function (item) {
      gsap.to(item, { x: 0, y: 0, duration: 0.4, ease: "power2.out" });
    });
  }

  var scrollTimeout;
  window.addEventListener("scroll", function () {
    if (floatingActive && !isSettled) {
      stopFloating();
    }
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function () {
      if (!isSettled) {
        startFloating();
      }
    }, 200);
  }, { passive: true });

  /* ══════════════════════════════════════════════
     PHASE 1: SCROLL IN
     ══════════════════════════════════════════════ */
  var scrollInTL = gsap.timeline({
    scrollTrigger: {
      trigger: portfolioSection,
      start: "top bottom",
      end: "top top",
      scrub: 0.3,
      onEnter: function () {
        frame.style.visibility = "visible";
      },
      onLeaveBack: function () {
        frame.style.visibility = "hidden";
        gsap.set(frame, { top: "100vh" });
      }
    }
  });

  scrollInTL.to(frame, {
    top: "0vh",
    duration: 1,
    ease: "none",
  });

  /* ══════════════════════════════════════════════
     PHASE 2: SCATTER TO SETTLED
     ══════════════════════════════════════════════ */
  var settleTL = gsap.timeline({
    scrollTrigger: {
      trigger: portfolioSection,
      start: "8% top",
      end: "40% top",
      scrub: 0.5,
      onEnter: function () {
        stopFloating();
      },
      onLeaveBack: function () {
        isSettled = false;
        items.forEach(function (item, i) {
          item.classList.remove("is-settled");
          var s = scatteredStates[i];
          gsap.set(item, {
            left: s.x,
            top: s.y,
            yPercent: 0,
            width: s.w,
            height: s.h,
            opacity: s.opacity,
            scale: s.scale,
            filter: "blur(" + s.blur + "px)",
            zIndex: s.zIndex,
          });
        });
        gsap.set(heading, {
          top: "50%",
          left: "50%",
          xPercent: -50,
          yPercent: -50,
          fontSize: isMobile ? "42px" : "72px",
        });
        gsap.set(subtext, { opacity: 0 });
        startFloating();
      }
    }
  });

  settleTL.to(heading, {
    top: isMobile ? "8vh" : "25vh",
    fontSize: isMobile ? "36px" : "64px",
    duration: 1,
    ease: "power2.inOut",
  });

  items.forEach(function (item, i) {
    var s = settledStates[i];

    var settledProps = {
      left: s.x,
      width: s.w,
      height: s.h,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      zIndex: 10,
      duration: 1.2,
      ease: "power2.inOut",
    };

    if (isMobile) {
      settledProps.top = s.y;
      settledProps.yPercent = 0;
    } else {
      settledProps.top = "52%";
      settledProps.yPercent = -50;
    }

    settleTL.to(item, settledProps, i === 0 ? "-=1.0" : "-=1.0");
  });

  settleTL.to(subtext, { opacity: 1, duration: 0.4 }, "-=0.2");

  /* ══════════════════════════════════════════════
     PHASE 3: SETTLED STATE
     ══════════════════════════════════════════════ */
  ScrollTrigger.create({
    trigger: portfolioSection,
    start: "38% top",
    end: "80% top",
    onEnter: function () {
      isSettled = true;
      stopFloating();
      items.forEach(function (item) {
        item.classList.add("is-settled");
      });
    },
    onLeaveBack: function () {
      isSettled = false;
      items.forEach(function (item) {
        item.classList.remove("is-settled");
      });
    }
  });

  /* ══════════════════════════════════════════════
     FLOATING — Active during scattered state
     ══════════════════════════════════════════════ */
  ScrollTrigger.create({
    trigger: portfolioSection,
    start: "top top",
    end: "8% top",
    onEnter: function () {
      if (!isSettled) startFloating();
    },
    onLeave: function () {
      stopFloating();
    },
    onEnterBack: function () {
      if (!isSettled) startFloating();
    }
  });

  /* ══════════════════════════════════════════════
     PHASE 4: FADE OUT
     ══════════════════════════════════════════════ */
  var fadeOutTL = gsap.timeline({
    scrollTrigger: {
      trigger: portfolioSection,
      start: "85% top",
      end: "95% top",
      scrub: 0.3,
      onLeave: function () {
        frame.style.visibility = "hidden";
        isSettled = false;
        items.forEach(function (item) {
          item.classList.remove("is-settled");
        });
      },
      onEnterBack: function () {
        frame.style.visibility = "visible";
        isSettled = true;
        items.forEach(function (item) {
          item.classList.add("is-settled");
        });
      }
    }
  });

  fadeOutTL.to(frame, { opacity: 0, duration: 1 });
});
