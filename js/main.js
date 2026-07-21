document.addEventListener("DOMContentLoaded",function(){document.body.classList.add("loaded");var e=document.querySelector(".site-header"),o=document.querySelector(".header-logo img"),t=o?o.src:"";e&&window.addEventListener("scroll",function(){var c=window.scrollY>50;e.classList.toggle("scrolled",c),o&&(o.src=c?"/images/2026/03/Main-Logo-Light.svg":t)},{passive:!0});var c=document.querySelector(".menu-toggle"),i=document.querySelector(".mobile-nav");c&&i&&(c.addEventListener("click",function(){c.classList.toggle("active"),i.classList.toggle("active"),document.body.style.overflow=i.classList.contains("active")?"hidden":""}),i.querySelectorAll("a").forEach(function(e){e.addEventListener("click",function(){c.classList.remove("active"),i.classList.remove("active"),document.body.style.overflow=""})}));var s=window.location.pathname;(s.match(/\/portfolio\/?$/)||s.match(/\/services\/?$/)||-1!==s.indexOf("/services/our-process")||-1!==s.indexOf("/contact")||s.match(/\/blog\/?$/)||-1!==s.indexOf("/privacy-policy"))&&document.body.classList.add("light-page");document.querySelectorAll('a[href^="tel:"]').forEach(function(a){a.addEventListener("click",function(){var n=a.getAttribute("href").replace(/^tel:/,"").replace(/\s+/g,""),p={phone_number:n,link_text:(a.textContent||"").trim().substring(0,100),link_location:a.closest("header")?"header":a.closest("footer")?"footer":a.closest(".cta-strip")?"cta_strip":a.closest(".testimonial-cta-section")?"page_cta":a.closest(".mobile-nav")?"mobile_nav":"other",page_location:window.location.href,page_path:window.location.pathname};window.dataLayer=window.dataLayer||[];if(typeof window.gtag!=="function")window.gtag=function(){window.dataLayer.push(arguments)};window.gtag("event","phone_click",p)})});(function(){var canon=document.querySelector('link[rel="canonical"]'),pageUrl=canon?canon.href:window.location.href,imgs=[],pc=document.querySelector(".post-content");if(pc){var hero=document.querySelector(".post-featured-image img");if(hero)imgs.push(hero);pc.querySelectorAll("figure img").forEach(function(i){imgs.push(i)})}if(document.querySelector(".project-hero,.project-gallery"))document.querySelectorAll(".project-hero img,.project-story-aside img,.project-gallery-item img").forEach(function(i){imgs.push(i)});if(!imgs.length)return;var SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12c0 5.1 3.2 9.4 7.6 11.1-.1-.9-.2-2.4 0-3.4l1.4-6s-.3-.7-.3-1.8c0-1.7 1-3 2.2-3 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.2 0 3.8-2.3 3.8-5.6 0-2.9-2.1-5-5.1-5-3.5 0-5.5 2.6-5.5 5.3 0 1 .4 2.2.9 2.8.1.1.1.2.1.3l-.3 1.3c0 .2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.7 0-3.8 2.8-7.3 8-7.3 4.2 0 7.4 3 7.4 7 0 4.2-2.6 7.5-6.3 7.5-1.2 0-2.4-.6-2.8-1.4l-.8 2.9c-.3 1-1 2.3-1.5 3.1 1.1.3 2.3.5 3.5.5 6.6 0 12-5.4 12-12S18.6 0 12 0z"/></svg><span>Save</span>';imgs.forEach(function(img){if(img.closest(".pin-img-wrap"))return;var wrap=document.createElement("div");wrap.className="pin-img-wrap";img.parentNode.insertBefore(wrap,img);wrap.appendChild(img);var btn=document.createElement("a");btn.className="pin-save-btn";btn.href="#";btn.setAttribute("aria-label","Save this image to Pinterest");btn.innerHTML=SVG;btn.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();var media=img.getAttribute("data-full")||img.currentSrc||img.src;if("/"===media.charAt(0)&&"/"!==media.charAt(1))media=window.location.origin+media;var desc=img.getAttribute("alt")||document.title,u="https://www.pinterest.com/pin/create/button/?url="+encodeURIComponent(pageUrl)+"&media="+encodeURIComponent(media)+"&description="+encodeURIComponent(desc);window.open(u,"pinterest","width=750,height=650,scrollbars=yes,resizable=yes");if("function"==typeof window.gtag)window.gtag("event","pinterest_save",{page_path:window.location.pathname,image_url:media})});wrap.appendChild(btn)})})()});


/* Adaptive header text color (site-wide).
   For each header region (left nav, right nav, mobile toggle) this finds
   whatever the page actually paints behind it -- an <img>, a CSS
   background-image, a gradient, or a solid color, including
   semi-transparent overlay layers -- measures its brightness, and flips
   that region to dark text on light backdrops or white text on dark ones.
   Samples at load, on resize, and when the homepage slideshow advances.
   Never re-samples during scroll; the .scrolled solid header takes over. */
(function(){
  var header=document.querySelector(".site-header");
  if(!header)return;
  var regions=[
    {sel:".header-nav-left",dark:"nav-left-dark",light:"nav-left-light"},
    {sel:".header-nav-right",dark:"nav-right-dark",light:"nav-right-light"},
    {sel:".menu-toggle",dark:"toggle-dark",light:"toggle-light"}
  ];
  var canvas=document.createElement("canvas");
  var ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx)return;
  var THRESHOLD=150;
  var PAD=8;
  var imgCache={};

  function parseColor(str){
    var m=str&&str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/);
    if(!m)return null;
    return {r:+m[1],g:+m[2],b:+m[3],a:m[4]===undefined?1:+m[4]};
  }
  function lumOf(c){return .2126*c.r+.7152*c.g+.0722*c.b}

  /* Approximate a CSS gradient's color at horizontal fraction frac (0-1).
     Stops are assumed evenly spaced; only "to right" is direction-aware,
     anything else returns the average of the stops. */
  function gradientAt(bgi,frac){
    var stops=[],re=/rgba?\([^)]*\)/g,m;
    while((m=re.exec(bgi))){var c=parseColor(m[0]);if(c)stops.push(c);}
    if(!stops.length)return null;
    if(stops.length===1)return stops[0];
    if(bgi.indexOf("to right")===-1){
      var r=0,g=0,b=0,a=0;
      stops.forEach(function(c){r+=c.r;g+=c.g;b+=c.b;a+=c.a});
      var n=stops.length;
      return {r:r/n,g:g/n,b:b/n,a:a/n};
    }
    var pos=Math.min(Math.max(frac,0),1)*(stops.length-1);
    var i=Math.min(Math.floor(pos),stops.length-2),t=pos-i;
    var c1=stops[i],c2=stops[i+1];
    return {r:c1.r+(c2.r-c1.r)*t,g:c1.g+(c2.g-c1.g)*t,b:c1.b+(c2.b-c1.b)*t,a:c1.a+(c2.a-c1.a)*t};
  }

  /* Average luminance of the part of a cover-fitted image behind rect.
     box = the element box the image fills; posX/posY = background-position
     fractions (0.5 = center). Returns null if unsampleable. */
  function imageLum(source,natW,natH,box,rect,posX,posY){
    if(!natW||!natH||box.width<1||box.height<1)return null;
    var scale=Math.max(box.width/natW,box.height/natH);
    var offX=(box.width-natW*scale)*posX;
    var offY=(box.height-natH*scale)*posY;
    var sx=Math.max(0,(rect.left-box.left-PAD-offX)/scale);
    var sy=Math.max(0,(rect.top-box.top-PAD-offY)/scale);
    var sx2=Math.min(natW,(rect.right-box.left+PAD-offX)/scale);
    var sy2=Math.min(natH,(rect.bottom-box.top+PAD-offY)/scale);
    if(sx2-sx<2||sy2-sy<2)return null;
    var w=16,h=6;
    canvas.width=w;canvas.height=h;
    try{
      ctx.drawImage(source,sx,sy,sx2-sx,sy2-sy,0,0,w,h);
      var d=ctx.getImageData(0,0,w,h).data,lum=0;
      for(var i=0;i<d.length;i+=4){lum+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];}
      return lum/(w*h);
    }catch(e){return null;}
  }

  function posFraction(str,idx){
    var parts=(str||"50% 50%").split(" ");
    var p=parseFloat(parts[idx]||"50");
    return isNaN(p)?.5:p/100;
  }

  /* Walk the painted layers under the center of rect (top down) and return
     {lum} once resolved, or {pending:true} if a background image is still
     loading (a re-apply is queued for when it arrives). */
  function resolve(rect,reapply){
    var px=Math.min(Math.max((rect.left+rect.right)/2,1),window.innerWidth-1);
    var py=Math.min(Math.max((rect.top+rect.bottom)/2,1),window.innerHeight-1);
    var layers=document.elementsFromPoint(px,py);
    var overlays=[];
    function finish(baseLum){
      for(var i=overlays.length-1;i>=0;i--){
        var o=overlays[i];
        baseLum=baseLum*(1-o.a)+lumOf(o)*o.a;
      }
      return {lum:baseLum};
    }
    for(var i=0;i<layers.length;i++){
      var el=layers[i];
      if(header.contains(el)||(el.closest&&el.closest(".mobile-nav")))continue;
      var st=getComputedStyle(el);
      if(st.visibility==="hidden"||parseFloat(st.opacity)<.5)continue;
      if(el.tagName==="IMG"){
        var l=imageLum(el,el.naturalWidth,el.naturalHeight,el.getBoundingClientRect(),rect,.5,.5);
        if(l!==null)return finish(l);
        continue;
      }
      var bgi=st.backgroundImage;
      if(bgi&&bgi!=="none"){
        var um=bgi.match(/url\(["']?([^"')]+)["']?\)/);
        if(um){
          var url=um[1];
          var cached=imgCache[url];
          if(cached&&cached.complete&&cached.naturalWidth){
            var box=el.getBoundingClientRect();
            var l2=imageLum(cached,cached.naturalWidth,cached.naturalHeight,box,rect,
              posFraction(st.backgroundPosition,0),posFraction(st.backgroundPosition,1));
            if(l2!==null)return finish(l2);
            continue;
          }
          if(!cached){
            var im=new Image();
            imgCache[url]=im;
            im.addEventListener("load",reapply);
            im.src=url;
          }
          return {pending:true};
        }
        if(bgi.indexOf("gradient")!==-1){
          var ebox=el.getBoundingClientRect();
          var gc=gradientAt(bgi,(px-ebox.left)/Math.max(1,ebox.width));
          if(gc){
            if(gc.a>=.99)return finish(lumOf(gc));
            overlays.push(gc);
          }
        }
      }
      var bc=parseColor(st.backgroundColor);
      if(bc&&bc.a>0){
        if(bc.a>=.99)return finish(lumOf(bc));
        overlays.push(bc);
      }
    }
    return finish(255); /* nothing painted: page default is white */
  }

  function applyAll(){
    if(window.scrollY>10){needsApply=true;return;}
    regions.forEach(function(r){
      var el=document.querySelector(r.sel);
      if(!el)return;
      var rect=el.getBoundingClientRect();
      if(rect.width<1||rect.height<1)return;
      var res=resolve(rect,applyAll);
      if(res.pending)return;
      var dark=res.lum>THRESHOLD;
      header.classList.toggle(r.dark,dark);
      header.classList.toggle(r.light,!dark);
    });
  }

  var needsApply=false;
  window.addEventListener("scroll",function(){
    if(needsApply&&window.scrollY<=10){needsApply=false;applyAll();}
  },{passive:true});
  var rt;
  window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(applyAll,150);});

  /* Homepage Ken Burns slideshow: opacity is animation-driven, so poll for
     the active slide and re-sample when it changes. */
  var slides=document.querySelectorAll(".hero-slide");
  if(slides.length>1){
    var lastActive=-1;
    setInterval(function(){
      if(document.hidden||window.scrollY>10)return;
      var best=-1,bestOp=.5;
      for(var i=0;i<slides.length;i++){
        var op=parseFloat(getComputedStyle(slides[i]).opacity);
        if(op>bestOp){bestOp=op;best=i;}
      }
      if(best!==-1&&best!==lastActive){lastActive=best;applyAll();}
    },1000);
  }

  function start(){
    applyAll();
    /* re-run once everything (hero image included) has loaded */
    if(document.readyState!=="complete")window.addEventListener("load",applyAll);
  }
  start();
})();
