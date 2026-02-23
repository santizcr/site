/* lib/admin-controls.js — admin-only helpers: attach delete overlays and react to saved galleries */
(function(){
  function isAdmin(){ try{ return localStorage.getItem('harest_admin_authed') === '1'; }catch(e){ return false; } }

  function attachDeleteControlsToGallery(galleryEl){
    if(!galleryEl) return;
    const key = galleryEl.getAttribute('data-gallery-key');
    const stage = galleryEl.querySelector('[data-stage]');
    if(!stage) return;

    if(stage.dataset.adminControls === '1') return;
    stage.dataset.adminControls = '1';

    function persistStage(){
      try{
        const imgs = Array.from(stage.querySelectorAll('img.card-image')).map(img => ({ src: img.src, alt: img.alt || '' }));
        const existingRaw = localStorage.getItem('gallery_' + (key || ''));
        let obj = { images: imgs, meta: {} };
        if(existingRaw){
          try{ const parsed = JSON.parse(existingRaw); if(parsed && typeof parsed === 'object') obj.meta = parsed.meta || {}; }catch(e){}
        }
        localStorage.setItem('gallery_' + (key || ''), JSON.stringify(obj));
        try{
          window.dispatchEvent(new StorageEvent('storage', { key: 'gallery_' + (key || ''), newValue: JSON.stringify(obj) }));
        }catch(e){
          window.dispatchEvent(new CustomEvent('storage:local', { detail: { key: 'gallery_' + (key || ''), newValue: JSON.stringify(obj) } }));
        }
      }catch(e){}
    }

    function addButtonForImage(img){
      if(img._adminDelAttached) return;
      img._adminDelAttached = true;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-del-btn';
      btn.title = 'Удалить фото (админ)';
      btn.innerHTML = '✕';
      btn.style.position = 'absolute';
      btn.style.zIndex = '60';
      btn.style.top = '8px';
      btn.style.right = '8px';
      btn.style.width = '36px';
      btn.style.height = '36px';
      btn.style.borderRadius = '8px';
      btn.style.border = 'none';
      btn.style.background = 'rgba(255,255,255,0.9)';
      btn.style.boxShadow = '0 6px 18px rgba(16,24,40,0.06)';
      btn.style.cursor = 'pointer';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.fontSize = '18px';
      btn.style.padding = '0';

      let wrapper = img.parentElement;
      if(!wrapper || wrapper === stage){
        wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = img.style.width || img.getAttribute('width') || '100%';
        wrapper.style.height = img.style.height || img.getAttribute('height') || 'auto';
        stage.replaceChild(wrapper, img);
        wrapper.appendChild(img);
      } else {
        const pos = getComputedStyle(wrapper).position;
        if(pos === 'static') wrapper.style.position = 'relative';
      }
      wrapper.appendChild(btn);

      btn.addEventListener('click', function(e){
        e.stopPropagation();
        if(!confirm('Удалить это фото?')) return;
        try{
          img.remove();
          btn.remove();
          persistStage();
          galleryEl.dispatchEvent(new CustomEvent('gallery:updated',{bubbles:true}));
        }catch(err){
          console.warn('Ошибка удаления фото', err);
        }
      });
    }

    Array.from(stage.querySelectorAll('img.card-image')).forEach(addButtonForImage);

    const obs = new MutationObserver(muts => {
      muts.forEach(m => {
        if(m.addedNodes && m.addedNodes.length){
          Array.from(m.addedNodes).forEach(n => { if(n.nodeType === 1 && n.tagName === 'IMG') addButtonForImage(n); });
        }
      });
    });
    obs.observe(stage, { childList: true, subtree: false });
  }

  // Only enable admin delete controls when the user is authenticated AND we're inside the admin panel.
  // This avoids injecting delete buttons/overlays into public object pages.
  if(isAdmin() && document.querySelector('.admin')){
    document.querySelectorAll('[data-gallery]').forEach(g => attachDeleteControlsToGallery(g));
    window.addEventListener('storage', function(e){
      if(!isAdmin()) return;
      if(!e.key || !e.key.startsWith('gallery_')) return;
      const key = e.key.replace(/^gallery_/, '');
      const g = document.querySelector('[data-gallery-key="'+key+'"]');
      if(g) attachDeleteControlsToGallery(g);
    });
    window.addEventListener('storage:local', function(ev){
      if(!isAdmin()) return;
      try{
        const key = (ev.detail && ev.detail.key) ? ev.detail.key.replace(/^gallery_/, '') : null;
        if(!key) return;
        const g = document.querySelector('[data-gallery-key="'+key+'"]');
        if(g) attachDeleteControlsToGallery(g);
      }catch(e){}
    });
    document.addEventListener('gallery:updated', function(e){
      if(!isAdmin()) return;
      const g = e.target.closest && e.target.closest('[data-gallery]');
      if(g) attachDeleteControlsToGallery(g);
    }, true);
  }
})();