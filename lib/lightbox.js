/* lib/lightbox.js — self-contained Lightbox module that exposes window.Lightbox */
export default (function(){
  let container, imgEl, prevBtn, nextBtn, idx = 0, items = [];

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
    container.querySelectorAll('[data-lbx-close]').forEach(n => n.addEventListener('click', close));
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    window.addEventListener('keydown', kb);
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
    imgEl.src = items[idx] || '';
    container.classList.add('open');
    container.style.display = 'block';
    document.body.style.overflow = 'hidden';
    container.querySelector('.lbx-total').textContent = items.length;
    container.querySelector('.lbx-current').textContent = idx + 1;
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
    imgEl.src = items[idx] || '';
    container.querySelector('.lbx-current').textContent = idx + 1;
    preload(idx - 1);
  }
  function next(){
    if(items.length === 0) return;
    idx = (idx + 1) % items.length;
    imgEl.src = items[idx] || '';
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

  const api = { open, close };
  // attach to window for legacy usage in admin and gallery code
  window.Lightbox = api;
  // also export as default for module consumers
  return api;
})();