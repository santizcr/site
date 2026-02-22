/* Enhanced gallery + lightbox viewer */

document.addEventListener('click', function(e){
  const a = e.target.closest('a');
  if(!a) return;
  if(a.getAttribute('href') === '#'){ e.preventDefault(); }
});

/* Lightweight carousel for each gallery (prev/next + thumbnails) */
(function(){
  function initGallery(root){
    const stage = root.querySelector('[data-stage]');
    const thumbContainer = root.querySelector('[data-thumbs]');
    const slides = stage ? Array.from(stage.children) : [];
    if(!stage || slides.length === 0) return;

    // build thumbs dynamically from slides
    if(thumbContainer){
      thumbContainer.innerHTML = '';
      slides.forEach((s, i) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        thumb.dataset.index = i;
        const img = document.createElement('img');
        img.src = s.getAttribute('src') || '';
        img.alt = s.getAttribute('alt') || '';
        thumb.appendChild(img);
        thumbContainer.appendChild(thumb);
      });
      // keep compact until interaction
      thumbContainer.classList.add('hidden-half');
    }

    let idx = 0;
    function update(){
      stage.style.transform = `translateX(-${idx * 100}%)`;
      if(thumbContainer){
        Array.from(thumbContainer.children).forEach(t => t.classList.remove('active'));
        const active = thumbContainer.querySelector(`[data-index="${idx}"]`);
        if(active) active.classList.add('active');
      }
    }

    // determine how many thumbs fit under the main image and show only that many initially
    function fitThumbnails(){
      if(!thumbContainer) return;
      // get available width of main stage
      const stageBox = stage.getBoundingClientRect();
      const thumbEl = thumbContainer.querySelector('.thumb');
      if(!thumbEl) return;
      const thumbStyle = getComputedStyle(thumbEl);
      const gap = parseFloat(getComputedStyle(thumbContainer).gap || 8);
      const thumbW = thumbEl.getBoundingClientRect().width + gap;
      const available = Math.max(0, stageBox.width - 1); // small tolerance
      const count = Math.max(1, Math.floor(available / thumbW));
      // mark extras as hidden via attribute (CSS will clip via hidden-half)
      Array.from(thumbContainer.children).forEach((t, i) => {
        t.style.display = i < count ? '' : 'none';
      });
    }

    // reveal thumbnails on first meaningful interaction
    function revealThumbs(){
      if(!thumbContainer) return;
      thumbContainer.classList.remove('hidden-half');
      // make all thumbs visible
      Array.from(thumbContainer.children).forEach(t => t.style.display = '');
    }

    // initial fit after images load (some images may be loading)
    function tryFit(){
      fitThumbnails();
    }
    // try after a small delay and on window resize
    setTimeout(tryFit, 80);
    window.addEventListener('resize', tryFit);

    root.querySelectorAll('[data-prev]').forEach(btn => btn.addEventListener('click', e => {
      e.preventDefault();
      revealThumbs();
      idx = (idx - 1 + slides.length) % slides.length;
      update();
    }));
    root.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', e => {
      e.preventDefault();
      revealThumbs();
      idx = (idx + 1) % slides.length;
      update();
    }));

    if(thumbContainer){
      thumbContainer.addEventListener('click', function(e){
        const t = e.target.closest('.thumb');
        if(!t) return;
        revealThumbs();
        const i = parseInt(t.dataset.index || '0',10);
        if(!isNaN(i)){ idx = i; update(); }
      });
    }

    // swipe support for touch on stage
    let startX = null;
    stage.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; revealThumbs(); }, {passive:true});
    stage.addEventListener('touchend', (e)=>{
      if(startX === null) return;
      const dx = (e.changedTouches[0].clientX - startX);
      if(Math.abs(dx) > 30){
        idx = dx < 0 ? Math.min(idx+1, slides.length-1) : Math.max(idx-1, 0);
        update();
      }
      startX = null;
    });

    // open lightbox on clicking any slide or thumb
    function openLightbox(atIndex){
      Lightbox.open(slides.map(s => s.getAttribute('src')), atIndex);
    }

    stage.addEventListener('click', function(e){
      revealThumbs();
      const slide = e.target.closest('img') || e.target;
      const i = slides.indexOf(slide);
      openLightbox(i >= 0 ? i : idx);
    });

    if(thumbContainer){
      thumbContainer.addEventListener('click', function(e){
        const t = e.target.closest('.thumb');
        if(!t) return;
        const i = parseInt(t.dataset.index || '0',10);
        if(!isNaN(i)) openLightbox(i);
      });
    }

    // keyboard arrows and other interactions may also reveal when user focuses the stage:
    stage.addEventListener('focus', revealThumbs, {passive:true});

    // init
    update();
    tryFit();
  }

  document.querySelectorAll('[data-gallery]').forEach(initGallery);
})();

/* Lightbox implementation appended to body dynamically */
const Lightbox = (function(){
  let container, imgEl, prevBtn, nextBtn, closeBtn, idx = 0, items = [];

  function create(){
    container = document.createElement('div');
    container.className = 'lightbox';
    container.innerHTML = `
      <div class="lightbox-backdrop" data-lbx-close></div>
      <div class="lightbox-inner">
        <button class="lbx-close" aria-label="Закрыть" data-lbx-close>&times;</button>
        <button class="lbx-nav left" data-lbx-prev aria-label="Предыдущее">&#10094;</button>
        <img class="lbx-image" src="" alt="">
        <button class="lbx-nav right" data-lbx-next aria-label="Следующее">&#10095;</button>
        <div class="lbx-counter"><span class="lbx-current">1</span> / <span class="lbx-total">1</span></div>
      </div>
    `;
    document.body.appendChild(container);
    imgEl = container.querySelector('.lbx-image');
    prevBtn = container.querySelector('[data-lbx-prev]');
    nextBtn = container.querySelector('[data-lbx-next]');
    closeBtn = container.querySelectorAll('[data-lbx-close]');
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    container.querySelectorAll('[data-lbx-close]').forEach(n => n.addEventListener('click', close));
    // keyboard
    window.addEventListener('keydown', kb);
    // swipe
    let sx = null;
    imgEl.addEventListener('touchstart', e => sx = e.touches[0].clientX, {passive:true});
    imgEl.addEventListener('touchend', e => {
      if(sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if(Math.abs(dx) > 40) dx < 0 ? next() : prev();
      sx = null;
    }, {passive:true});
  }

  function open(list, atIndex){
    if(!container) create();
    items = list || [];
    idx = Math.max(0, Math.min(atIndex || 0, items.length - 1));
    imgEl.src = items[idx];
    container.classList.add('open');
    container.style.display = 'block';
    document.body.style.overflow = 'hidden';
    container.querySelector('.lbx-total').textContent = items.length;
    container.querySelector('.lbx-current').textContent = idx + 1;
    // preload neighbors
    preload(idx - 1); preload(idx + 1);
  }
  function close(){
    if(!container) return;
    container.classList.remove('open');
    container.style.display = 'none';
    document.body.style.overflow = '';
    imgEl.src = '';
  }
  function prev(){
    if(items.length === 0) return;
    idx = (idx - 1 + items.length) % items.length;
    imgEl.src = items[idx];
    container.querySelector('.lbx-current').textContent = idx + 1;
    preload(idx - 1);
  }
  function next(){
    if(items.length === 0) return;
    idx = (idx + 1) % items.length;
    imgEl.src = items[idx];
    container.querySelector('.lbx-current').textContent = idx + 1;
    preload(idx + 1);
  }
  function kb(e){
    if(!container || container.style.display !== 'block') return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') prev();
    if(e.key === 'ArrowRight') next();
  }
  function preload(i){
    if(i < 0 || i >= items.length) return;
    const im = new Image(); im.src = items[i];
  }

  return { open, close };
})();