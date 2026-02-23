/* lib/gallery.js — initializes galleries on the page; expects window.Lightbox available */
(function(){
  function storageKeyFor(key){ return 'gallery_' + key; }

  function loadGalleryList(key){
    try{
      const raw = localStorage.getItem(storageKeyFor(key));
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)) return parsed;
      if(parsed && Array.isArray(parsed.images)) return parsed.images;
    }catch(e){}
    return null;
  }

  function buildStageFromList(stageEl, list){
    stageEl.innerHTML = '';
    list.forEach(item => {
      const img = document.createElement('img');
      img.className = 'card-image';
      img.src = item.src || '';
      img.alt = item.alt || '';
      stageEl.appendChild(img);
    });
  }

  function initGallery(root){
    const key = root.getAttribute('data-gallery-key');
    const stage = root.querySelector('[data-stage]');
    const thumbContainer = root.querySelector('[data-thumbs]');
    if(!stage) return;

    if(key){
      const list = loadGalleryList(key);
      if(list && list.length){
        buildStageFromList(stage, list);
      }
    }

    let slides = Array.from(stage.querySelectorAll('img.card-image'));
    if(slides.length === 0) slides = Array.from(stage.querySelectorAll('img'));
    if(slides.length === 0) return;

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

    function fitThumbnails(){
      if(!thumbContainer) return;
      if(window.innerWidth < 720){
        thumbContainer.classList.remove('hidden-half');
        Array.from(thumbContainer.children).forEach(t => t.style.display = '');
        return;
      }
      const stageBox = stage.getBoundingClientRect();
      const thumbEl = thumbContainer.querySelector('.thumb');
      if(!thumbEl) return;
      const gap = parseFloat(getComputedStyle(thumbContainer).gap || 8);
      const thumbW = thumbEl.getBoundingClientRect().width + gap;
      const available = Math.max(0, stageBox.width - 1);
      const count = Math.max(1, Math.floor(available / thumbW));
      Array.from(thumbContainer.children).forEach((t, i) => {
        t.style.display = i < count ? '' : 'none';
      });
      thumbContainer.classList.add('hidden-half');
    }

    function revealThumbs(){
      if(!thumbContainer) return;
      thumbContainer.classList.remove('hidden-half');
      Array.from(thumbContainer.children).forEach(t => t.style.display = '');
    }

    setTimeout(fitThumbnails, 80);
    window.addEventListener('resize', fitThumbnails);

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

    function openLightbox(atIndex){
      const list = slides.map(s => s.getAttribute('src'));
      if(window.Lightbox && typeof window.Lightbox.open === 'function'){
        window.Lightbox.open(list, atIndex);
      }
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

    stage.addEventListener('focus', revealThumbs, {passive:true});

    update();
    fitThumbnails();
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('[data-gallery]').forEach(initGallery);
  });

  // react to storage updates to rebuild stage (kept minimal here)
  function handleStorageEvent(e){
    try{
      let key = null;
      let raw = null;
      if(e && e.key && e.key.startsWith('gallery_')){
        key = e.key.replace(/^gallery_/, '');
        raw = e.newValue;
      } else if(e && e.detail && e.detail.key && e.detail.key.startsWith('gallery_')){
        key = e.detail.key.replace(/^gallery_/, '');
        raw = e.detail.newValue;
      } else {
        return;
      }
      const g = document.querySelector('[data-gallery-key="'+key+'"]');
      if(!g) return;
      const stage = g.querySelector('[data-stage]');
      if(!stage) return;
      if(!raw){ stage.innerHTML = ''; g.dispatchEvent(new CustomEvent('gallery:updated',{bubbles:true})); return; }
      const parsed = JSON.parse(raw);
      const imgs = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.images) ? parsed.images : []);
      stage.innerHTML = '';
      imgs.forEach(it=>{
        const im = document.createElement('img');
        im.className = 'card-image';
        im.src = it.src || '';
        im.alt = it.alt || '';
        stage.appendChild(im);
      });
      g.dispatchEvent(new CustomEvent('gallery:updated',{bubbles:true}));
    }catch(err){ console.warn('Failed to apply gallery update', err); }
  }

  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('storage:local', handleStorageEvent);
})();