(function(){
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(max-width:820px)').matches;

  /* ---------------- header scroll state ---------------- */
  var header = document.getElementById('header');
  function onScrollHeader(){ header.classList.toggle('scrolled', window.scrollY > 24); }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, {passive:true});

  /* ---------------- mobile menu ---------------- */
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  menuBtn.addEventListener('click', function(){ navLinks.classList.toggle('open'); });
  navLinks.addEventListener('click', function(e){ if(e.target.tagName==='A') navLinks.classList.remove('open'); });

  /* ---------------- marquee fill ---------------- */
  var words = ['Backends','Distributed Systems','Kubernetes','Observability','Reliability','Cloud Native','Infrastructure as Code','Latency','Resilience','Data Platforms'];
  var track = document.getElementById('marquee');
  function buildMarquee(){
    var html='';
    for(var pass=0; pass<2; pass++){
      for(var i=0;i<words.length;i++){
        html += '<span class="item">'+words[i]+'<span class="sep">◆</span></span>';
      }
    }
    track.innerHTML = html;
  }
  buildMarquee();

  /* ---------------- reveal on scroll ---------------- */
  var revealObs = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); revealObs.unobserve(en.target); } });
  }, {threshold:.14, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){ revealObs.observe(el); });

  /* ---------------- stat counters ---------------- */
  var statObs = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting) return;
      statObs.unobserve(en.target);
      en.target.classList.add('in');
      var stats = en.target.querySelectorAll('.stat');
      stats.forEach(function(stat){
        stat.classList.add('in');
        var target = parseFloat(stat.getAttribute('data-count'));
        var dec = stat.getAttribute('data-dec'); // e.g. .95 appended via suffix already
        var valEl = stat.querySelector('.val');
        if(reduced){ valEl.textContent = target; return; }
        var start = null, dur = 1500;
        function step(ts){
          if(!start) start = ts;
          var p = Math.min((ts-start)/dur, 1);
          var eased = 1 - Math.pow(1-p, 3);
          valEl.textContent = Math.round(eased*target);
          if(p<1) requestAnimationFrame(step);
          else valEl.textContent = target;
        }
        requestAnimationFrame(step);
      });
    });
  }, {threshold:.3});
  var statsEl = document.getElementById('stats');
  if(statsEl) statObs.observe(statsEl);

  /* ---------------- service card cursor glow ---------------- */
  document.querySelectorAll('.svc').forEach(function(card){
    card.addEventListener('mousemove', function(e){
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX-r.left)+'px');
      card.style.setProperty('--my', (e.clientY-r.top)+'px');
    });
  });

  /* ---------------- custom cursor + magnetic ---------------- */
  if(!isTouch && !reduced){
    var cursor = document.getElementById('cursor');
    var dot = document.getElementById('cursorDot');
    var cx=window.innerWidth/2, cy=window.innerHeight/2, tx=cx, ty=cy;
    document.addEventListener('mousemove', function(e){
      tx=e.clientX; ty=e.clientY;
      dot.style.transform='translate('+tx+'px,'+ty+'px) translate(-50%,-50%)';
    });
    (function loop(){
      cx += (tx-cx)*0.18; cy += (ty-cy)*0.18;
      cursor.style.transform='translate('+cx+'px,'+cy+'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, [data-magnetic]').forEach(function(el){
      el.addEventListener('mouseenter', function(){ cursor.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function(){ cursor.classList.remove('is-hover'); });
    });
    // magnetic buttons
    document.querySelectorAll('[data-magnetic]').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left+r.width/2);
        var my = e.clientY - (r.top+r.height/2);
        el.style.transform='translate('+(mx*0.25)+'px,'+(my*0.35)+'px)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform=''; });
    });
  }

  /* ============================================================
     THREE.JS — fluid "submerged" hero
     Full-bleed shader plane: domain-warped fractal noise flows like
     dark blue-black liquid, with cyan caustic filaments. Mouse warps
     the current; scroll fades it down. Graceful static fallback.
     ============================================================ */
  var canvas = document.getElementById('scene');
  var fallback = document.getElementById('heroFallback');

  if(typeof THREE === 'undefined' || !canvas.getContext){
    canvas.style.display='none';
    fallback.style.display='block';
    return;
  }

  try{
    var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.75));

    var hero = document.querySelector('.hero');
    var W = hero.clientWidth, H = hero.clientHeight;
    renderer.setSize(W, H, false);

    var scene = new THREE.Scene();
    var camera = new THREE.Camera(); // full-screen quad in clip space

    var VERT = [
      'varying vec2 vUv;',
      'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
    ].join('\n');

    var FRAG = [
      'precision highp float;',
      'uniform float uTime;',
      'uniform vec2  uResolution;',
      'uniform vec2  uMouse;',   // eased, -0.5..0.5
      'uniform float uScroll;',  // 0..1
      'varying vec2 vUv;',

      'vec2 hash2(vec2 p){',
      '  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));',
      '  return -1.0 + 2.0*fract(sin(p)*43758.5453123);',
      '}',
      'float noise(vec2 p){',
      '  vec2 i=floor(p), f=fract(p);',
      '  vec2 u=f*f*(3.0-2.0*f);',
      '  return mix(mix(dot(hash2(i+vec2(0.0,0.0)), f-vec2(0.0,0.0)),',
      '                 dot(hash2(i+vec2(1.0,0.0)), f-vec2(1.0,0.0)), u.x),',
      '             mix(dot(hash2(i+vec2(0.0,1.0)), f-vec2(0.0,1.0)),',
      '                 dot(hash2(i+vec2(1.0,1.0)), f-vec2(1.0,1.0)), u.x), u.y);',
      '}',
      'float fbm(vec2 p){',
      '  float v=0.0, a=0.5;',
      '  mat2 m=mat2(1.6,1.2,-1.2,1.6);',
      '  for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=0.5; }',
      '  return v;',
      '}',

      'void main(){',
      '  vec2 uv = vUv;',
      '  vec2 p = uv - 0.5;',
      '  p.x *= uResolution.x / uResolution.y;',
      '  p *= 2.2;',

      '  float t = uTime * 0.06;',
      '  vec2 m = uMouse * 1.4;',
      '  p += m * 0.18;',

      // domain warp -> flowing liquid
      '  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2,1.3) - t));',
      '  vec2 r = vec2(fbm(p + 1.8*q + vec2(1.7,9.2) + t*0.7),',
      '                fbm(p + 1.8*q + vec2(8.3,2.8) - t*0.6));',
      '  float f = fbm(p + 2.2*r + t*0.4);',

      // caustic filaments
      '  float caustic = abs(fbm(p*1.6 + r*2.0 - t*1.2));',
      '  caustic = pow(1.0 - caustic, 6.0);',

      // color ramp: deep blue-black -> blue -> cyan highlight
      '  vec3 deep = vec3(0.012, 0.027, 0.063);',
      '  vec3 mid  = vec3(0.020, 0.137, 0.255);',
      '  vec3 cyan = vec3(0.203, 0.890, 1.000);',
      '  float v = smoothstep(-0.6, 0.9, f);',
      '  vec3 col = mix(deep, mid, v);',
      '  col = mix(col, cyan, smoothstep(0.55, 1.0, v) * 0.5);',
      '  col += cyan * caustic * 0.5;',

      // soft glow around the cursor
      '  float d = length(p - m);',
      '  col += cyan * 0.07 * smoothstep(1.3, 0.0, d);',

      // vignette keeps the headline legible
      '  float vig = smoothstep(1.45, 0.25, length(uv-0.5));',
      '  col *= 0.5 + 0.5*vig;',

      // fade as the hero scrolls away
      '  col *= 1.0 - uScroll*0.35;',

      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    var uniforms = {
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2(W, H) },
      uMouse:      { value: new THREE.Vector2(0, 0) },
      uScroll:     { value: 0 }
    };

    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG
    });
    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    scene.add(quad);

    // ---- mouse current + scroll ----
    var tmx=0, tmy=0, mx=0, my=0;
    if(!isTouch){
      window.addEventListener('mousemove', function(e){
        tmx = (e.clientX/window.innerWidth  - 0.5);
        tmy = -(e.clientY/window.innerHeight - 0.5);
      });
    }
    var scrollY = 0;
    window.addEventListener('scroll', function(){ scrollY = window.scrollY; }, {passive:true});

    var running = true;
    var clock = new THREE.Clock();

    function animate(){
      if(!running) return;
      requestAnimationFrame(animate);

      uniforms.uTime.value += clock.getDelta();

      // ease the cursor so the current drifts rather than snaps
      mx += (tmx - mx) * 0.045;
      my += (tmy - my) * 0.045;
      uniforms.uMouse.value.set(mx, my);

      uniforms.uScroll.value = Math.min(scrollY / Math.max(H, 1), 1);

      renderer.render(scene, camera);
    }

    function resize(){
      W = hero.clientWidth; H = hero.clientHeight;
      renderer.setSize(W, H, false);
      uniforms.uResolution.value.set(W, H);
    }
    window.addEventListener('resize', resize);

    if(reduced){
      // static single frame
      uniforms.uTime.value = 12.0;
      renderer.render(scene, camera);
    } else {
      animate();
    }

    // pause when hero off-screen (perf)
    var heroObs = new IntersectionObserver(function(en){
      en.forEach(function(e){
        if(e.isIntersecting && !reduced){ if(!running){ running=true; clock.getDelta(); animate(); } }
        else { running=false; }
      });
    }, {threshold:0});
    heroObs.observe(hero);

  } catch(err){
    canvas.style.display='none';
    fallback.style.display='block';
  }
})();
