/* Minimal JS: keep link placeholders from jumping and enable small UI tweaks,
   plus a lightweight carousel for listing galleries. */

document.addEventListener('click', function(e){
  const a = e.target.closest('a');
  if(!a) return;
  if(a.getAttribute('href') === '#'){ e.preventDefault(); }
});

/* Carousel: supports prev/next and thumbnails; works for each [data-gallery] */
(function(){
  function initGallery(root){
    const stage = root.querySelector('[data-stage]');
    const thumbs = root.querySelectorAll('[data-thumbs] .thumb, [data-thumbs] .thumb') || root.querySelectorAll('.thumb');
    const thumbContainer = root.querySelector('[data-thumbs]');
    const slides = stage ? Array.from(stage.children) : [];
    if(!stage || slides.length === 0) return;

    let idx = 0;
    function update(){
      stage.style.transform = `translateX(-${idx * 100}%)`;
      if(thumbContainer){
        Array.from(thumbContainer.children).forEach(t => t.classList.remove('active'));
        const active = thumbContainer.querySelector(`[data-index="${idx}"]`);
        if(active) active.classList.add('active');
      }
    }

    root.querySelectorAll('[data-prev]').forEach(btn => btn.addEventListener('click', e => {
      e.preventDefault();
      idx = (idx - 1 + slides.length) % slides.length;
      update();
    }));
    root.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', e => {
      e.preventDefault();
      idx = (idx + 1) % slides.length;
      update();
    }));

    if(thumbContainer){
      thumbContainer.addEventListener('click', function(e){
        const t = e.target.closest('.thumb');
        if(!t) return;
        const i = parseInt(t.dataset.index || '0',10);
        if(!isNaN(i)){ idx = i; update(); }
      });
    }

    // swipe support for touch
    let startX = null;
    stage.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; }, {passive:true});
    stage.addEventListener('touchend', (e)=>{
      if(startX === null) return;
      const dx = (e.changedTouches[0].clientX - startX);
      if(Math.abs(dx) > 30){
        idx = dx < 0 ? Math.min(idx+1, slides.length-1) : Math.max(idx-1, 0);
        update();
      }
      startX = null;
    });

    // init
    update();
  }

  document.querySelectorAll('[data-gallery]').forEach(initGallery);
})();