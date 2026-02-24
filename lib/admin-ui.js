/* lib/admin-ui.js — simplified DOM wiring for admin: drag/drop, bulk-select, add via files/URL, apply/save */
export function AdminUI(opts){
  const storage = opts && opts.storage;
  if(!storage) throw new Error('storage required');

  const sel = document.getElementById('galleryKey');
  const loadBtn = document.getElementById('loadBtn');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const addFilesBtn = document.getElementById('addFilesBtn');
  const addUrlBtn = document.getElementById('addUrlBtn');
  const applyAllBtn = document.getElementById('applyAllBtn');
  const listEl = document.getElementById('list');
  const filePicker = document.getElementById('filePicker');
  const urlIn = document.getElementById('imgUrl');
  const msg = document.getElementById('msg');

  const metaTitle = document.getElementById('metaTitle');
  const metaPrice = document.getElementById('metaPrice');
  const metaDesc = document.getElementById('metaDesc');
  const metaSpecs = document.getElementById('metaSpecs');
  const metaRules = document.getElementById('metaRules');

  // Reviews DOM
  const revAuthor = document.getElementById('revAuthor');
  const revDate = document.getElementById('revDate');
  const revText = document.getElementById('revText');
  const revRating = document.getElementById('revRating');
  const addReviewBtn = document.getElementById('addReviewBtn');
  const reviewsList = document.getElementById('reviewsList');
  const clearReviewsBtn = document.getElementById('clearReviewsBtn');

  let current = { images: [], meta: {} };

  function showMsg(text, ok=true){
    if(!msg) return;
    msg.textContent = text;
    msg.style.color = ok ? 'green' : 'crimson';
    clearTimeout(showMsg._t); 
    showMsg._t = setTimeout(()=>{ if(msg) msg.textContent = ''; }, 3500);
  }

  function clampIndex(i){ return Math.max(0, Math.min(i, current.images.length-1)); }
  
  function escapeHtml(s){ 
    return String(s||'').replace(/[&<>"']/g, m => 
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])
    ); 
  }

  // Render images as draggable cards with checkbox + alt editor
  function renderList(){
    if(!listEl) return;
    listEl.innerHTML = '';
    
    if (current.images.length === 0) {
      listEl.innerHTML = '<div class="small" style="padding:20px;text-align:center;color:var(--muted)">Нет изображений. Добавьте фото через файлы или ссылку.</div>';
      return;
    }
    
    const wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.gridTemplateColumns = 'repeat(auto-fill,minmax(140px,1fr))';
    wrap.style.gap = '10px';
    
    current.images.forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = 'item';
      card.draggable = true;
      card.dataset.index = String(idx);
      card.style.position = 'relative';
      card.style.padding = '8px';
      card.style.borderRadius = '10px';
      card.style.background = 'var(--panel)';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '8px';
      card.style.minHeight = '140px';

      const cbWrap = document.createElement('div');
      cbWrap.style.display='flex'; 
      cbWrap.style.justifyContent='space-between'; 
      cbWrap.style.alignItems='center';
      
      const label = document.createElement('label'); 
      label.style.display='flex'; 
      label.style.alignItems='center'; 
      label.style.gap='8px';
      
      const cb = document.createElement('input'); 
      cb.type='checkbox'; 
      cb.checked = !!it._selected;
      cb.addEventListener('change', ()=> { current.images[idx]._selected = cb.checked; });
      
      const titleSmall = document.createElement('small'); 
      titleSmall.textContent = `#${idx+1}`;
      label.appendChild(cb); 
      label.appendChild(titleSmall);
      
      const zoom = document.createElement('button'); 
      zoom.type='button'; 
      zoom.className='btn btn-outline'; 
      zoom.textContent='👁️';
      zoom.style.padding='4px 8px';
      zoom.style.minHeight='auto';
      zoom.addEventListener('click', (e)=> { 
        e.preventDefault();
        if(window.Lightbox && Lightbox.open) {
          Lightbox.open(current.images.map(x=>x.src), idx); 
        } else {
          alert('Просмотр: ' + (it.src || 'нет изображения'));
        }
      });
      
      cbWrap.appendChild(label); 
      cbWrap.appendChild(zoom);

      const img = document.createElement('img');
      img.src = it.src || '';
      img.alt = it.alt || '';
      img.style.width = '100%';
      img.style.height = '100px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.background = '#f0f0f0';
      img.onerror = function() {
        this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23cccccc"/><text x="10" y="50" font-family="Arial" font-size="14" fill="%23666666">Ошибка</text></svg>';
      };

      const alt = document.createElement('input');
      alt.type = 'text'; 
      alt.value = it.alt || ''; 
      alt.placeholder = 'Описание (alt)';
      alt.style.padding = '6px'; 
      alt.style.borderRadius='6px'; 
      alt.style.border='1px solid rgba(0,0,0,0.06)';
      alt.style.fontSize='13px';
      alt.addEventListener('input', ()=> { 
        current.images[parseInt(card.dataset.index,10)].alt = alt.value; 
      });

      const actions = document.createElement('div'); 
      actions.style.display='flex'; 
      actions.style.gap='4px';
      actions.style.justifyContent='space-between';
      
      const up = document.createElement('button'); 
      up.type='button'; 
      up.className='btn btn-outline'; 
      up.textContent='↑';
      up.style.padding='4px 8px';
      up.style.minHeight='auto';
      
      const down = document.createElement('button'); 
      down.type='button'; 
      down.className='btn btn-outline'; 
      down.textContent='↓';
      down.style.padding='4px 8px';
      down.style.minHeight='auto';
      
      const del = document.createElement('button'); 
      del.type='button'; 
      del.className='btn btn-outline'; 
      del.textContent='×';
      del.style.padding='4px 8px';
      del.style.minHeight='auto';
      del.style.color='crimson';
      
      up.addEventListener('click', ()=> { 
        const i = parseInt(card.dataset.index,10); 
        if(i>0){ 
          const a = current.images.splice(i,1)[0]; 
          current.images.splice(i-1,0,a); 
          renderList(); 
        }
      });
      
      down.addEventListener('click', ()=> { 
        const i = parseInt(card.dataset.index,10); 
        if(i < current.images.length-1){ 
          const a = current.images.splice(i,1)[0]; 
          current.images.splice(i+1,0,a); 
          renderList(); 
        }
      });
      
      del.addEventListener('click', ()=> { 
        const i = parseInt(card.dataset.index,10); 
        current.images.splice(i,1); 
        renderList(); 
      });
      
      actions.appendChild(up); 
      actions.appendChild(down); 
      actions.appendChild(del);

      // drag handlers
      card.addEventListener('dragstart', (e)=> { 
        e.dataTransfer && e.dataTransfer.setData('text/plain', card.dataset.index); 
        card.style.opacity='0.6'; 
      });
      
      card.addEventListener('dragend', ()=> { 
        card.style.opacity=''; 
      });
      
      card.addEventListener('dragover', (e)=> { 
        e.preventDefault(); 
        card.style.outline='2px dashed rgba(0,0,0,0.08)'; 
      });
      
      card.addEventListener('dragleave', ()=> { 
        card.style.outline=''; 
      });
      
      card.addEventListener('drop', (e)=> {
        e.preventDefault();
        card.style.outline='';
        const from = parseInt(e.dataTransfer && e.dataTransfer.getData('text/plain'),10);
        const to = parseInt(card.dataset.index,10);
        if(isNaN(from) || isNaN(to) || from===to) return;
        const item = current.images.splice(from,1)[0];
        current.images.splice(to,0,item);
        renderList();
      });

      card.appendChild(cbWrap);
      card.appendChild(img);
      card.appendChild(alt);
      card.appendChild(actions);
      wrap.appendChild(card);
    });
    listEl.appendChild(wrap);
  }

  // load from storage or DOM defaults
  function loadDefaultsFromDOM(k){
    const g = document.querySelector('[data-gallery-key="'+k+'"]');
    if(!g) return { images: [], meta: {} };
    
    const stage = g.querySelector('[data-stage]');
    const meta = {};
    
    const details = g.closest('main') ? g.closest('main').querySelector('.details') : document.querySelector('.details');
    if(details){
      const priceEl = details.querySelector('.price');
      const specsEl = details.querySelector('.specs');
      const descEl = details.querySelector('.desc');
      if(priceEl) meta.price = priceEl.innerHTML;
      if(descEl) meta.description = descEl.innerHTML;
      if(specsEl) meta.specs = Array.from(specsEl.querySelectorAll('.spec')).map(s => s.innerText.trim());
      const titleEl = g.querySelector('.owner-sub') || document.querySelector('.owner-sub');
      if(titleEl) meta.title = titleEl.textContent.trim();
    }
    
    const imgs = [];
    if(stage) {
      Array.from(stage.querySelectorAll('img')).forEach(img => {
        imgs.push({ src: img.src, alt: img.alt||'' });
      });
    }
    
    return { images: imgs, meta };
  }

  function loadCurrent(){
    const k = sel && sel.value;
    if(!k) return;
    
    console.log('Загрузка галереи:', k);
    const stored = storage.loadGallery(k);
    
    if(stored && stored.images && stored.images.length > 0){ 
      current = { 
        images: stored.images.map(img => ({...img, _selected: false})), 
        meta: Object.assign({}, stored.meta || {}) 
      };
      console.log('✅ Загружено из storage:', current.images.length, 'фото');
    } else { 
      current = loadDefaultsFromDOM(k);
      current.images = current.images.map(img => ({...img, _selected: false}));
      console.log('📄 Загружено из DOM:', current.images.length, 'фото');
    }
    
    if(metaTitle) metaTitle.value = current.meta.title || '';
    if(metaPrice) metaPrice.value = current.meta.price || '';
    if(metaDesc) metaDesc.value = current.meta.description || '';
    if(metaSpecs) metaSpecs.value = (current.meta.specs && current.meta.specs.join(', ')) || '';
    if(metaRules) metaRules.value = current.meta.rules || '';
    
    renderList();
  }

  // add files
  if(addFilesBtn){
    addFilesBtn.addEventListener('click', ()=>{
      const files = Array.from(filePicker.files || []);
      if(files.length === 0){ showMsg('Выберите файлы', false); return; }
      
      showMsg('Загрузка файлов...');
      const readers = files.map(f => new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res({ src: String(r.result), alt: f.name || '' });
        r.onerror = () => res(null);
        r.readAsDataURL(f);
      }));
      
      Promise.all(readers).then(results => {
        let added = 0;
        results.forEach(r => { 
          if(r && r.src){ 
            current.images.push({...r, _selected: false}); 
            added++; 
          }
        });
        
        if(added) { 
          renderList(); 
          showMsg(`✅ ${added} файл(ов) добавлено.`); 
        } else { 
          showMsg('❌ Не удалось добавить файлы', false); 
        }
        
        if(filePicker) filePicker.value = '';
      });
    });
  }

  // add by URL
  function normalizeDriveUrl(url){
    if(!url) return url;
    try{
      const u = new URL(url);
      if(u.hostname.includes('drive.google.com')){
        const m = u.pathname.match(/\/file\/d\/([^\/]+)\/?/);
        if(m && m[1]) return 'https://drive.google.com/uc?export=view&id=' + m[1];
        if(u.searchParams.get('id')) return 'https://drive.google.com/uc?export=view&id=' + u.searchParams.get('id');
      }
    }catch(e){}
    return url;
  }
  
  if(addUrlBtn) {
    addUrlBtn.addEventListener('click', ()=>{
      let u = (urlIn && urlIn.value || '').trim();
      if(!u){ showMsg('Введите URL', false); return; }
      
      u = normalizeDriveUrl(u);
      current.images.push({ src: u, alt: '', _selected: false });
      renderList();
      if(urlIn) urlIn.value = '';
      showMsg('✅ Добавлено по ссылке');
    });
  }

  // select all toggle
  if(selectAllBtn) {
    selectAllBtn.addEventListener('click', ()=>{
      const all = current.images.every(i=>i._selected);
      current.images.forEach(i=> i._selected = !all);
      renderList();
    });
  }

  // bulk delete
  if(deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', ()=>{
      const before = current.images.length;
      current.images = current.images.filter(it => !it._selected);
      renderList();
      const removed = before - current.images.length;
      showMsg(removed ? `✅ ${removed} фото удалено` : '❌ Ничего не выбрано', removed > 0);
    });
  }

  // save/apply
  if(applyAllBtn) {
    applyAllBtn.addEventListener('click', ()=>{
      const k = sel && sel.value;
      if(!k) { showMsg('Выберите галерею', false); return; }
      
      const meta = {
        title: metaTitle ? metaTitle.value.trim() : '',
        price: metaPrice ? metaPrice.value.trim() : '',
        description: metaDesc ? metaDesc.value.trim() : '',
        specs: metaSpecs && metaSpecs.value.trim() ? metaSpecs.value.split(',').map(s=>s.trim()) : [],
        rules: metaRules ? metaRules.value.trim() : ''
      };
      
      const data = { 
        images: current.images.map(i=>({ src: i.src, alt: i.alt })), 
        meta: meta 
      };
      
      console.log('Сохранение данных:', data);
      
      if(!storage.saveGallery(k, data)){ 
        showMsg('❌ Ошибка при сохранении', false); 
        return; 
      }
      
      showMsg('✅ Данные сохранены');
      
      // apply to DOM if present
      const g = document.querySelector('[data-gallery-key="'+k+'"]');
      if(g){
        const stage = g.querySelector('[data-stage]');
        if(stage){
          stage.innerHTML = '';
          data.images.forEach(it=>{
            const im = document.createElement('img'); 
            im.className = 'card-image'; 
            im.src = it.src || ''; 
            im.alt = it.alt || ''; 
            stage.appendChild(im);
          });
          console.log('🖼️ Галерея обновлена в DOM');
        }
        
        // Обновляем мета-информацию на странице
        const priceEl = g.closest('main')?.querySelector('.price');
        if (priceEl && meta.price) priceEl.innerHTML = meta.price;
        
        const descEl = g.closest('main')?.querySelector('.desc');
        if (descEl && meta.description) {
          const strong = descEl.querySelector('strong');
          if (strong) {
            strong.nextSibling ? strong.nextSibling.textContent = ' ' + meta.description : descEl.innerHTML = '<strong>Описание:</strong> ' + meta.description;
          } else {
            descEl.innerHTML = '<strong>Описание:</strong> ' + meta.description;
          }
        }
        
        const specsEl = g.closest('main')?.querySelector('.specs');
        if (specsEl && meta.specs && Array.isArray(meta.specs)) {
          specsEl.innerHTML = '';
          meta.specs.forEach(s => {
            if (s.trim()) {
              const div = document.createElement('div');
              div.className = 'spec';
              div.textContent = s;
              specsEl.appendChild(div);
            }
          });
        }
        
        const ownerSub = document.querySelector('.owner-sub');
        if (ownerSub && meta.title) ownerSub.textContent = meta.title;
      }
    });
  }

  // load gallery selector
  if(loadBtn) {
    loadBtn.addEventListener('click', (e)=>{ 
      e && e.preventDefault && e.preventDefault(); 
      loadCurrent(); 
      showMsg('📂 Галерея загружена'); 
    });
  }
  
  if(sel) sel.addEventListener('change', loadCurrent);

  // Reviews management
  function renderReviews(){
    if(!reviewsList) return;
    const list = storage.loadReviews();
    reviewsList.innerHTML = '';
    
    if(list.length === 0){ 
      reviewsList.innerHTML = '<div class="small" style="padding:20px;text-align:center;color:var(--muted)">Нет отзывов</div>'; 
      return; 
    }
    
    list.forEach((r,i)=>{
      const it = document.createElement('div'); 
      it.className = 'item';
      it.style.padding = '12px'; 
      it.style.borderRadius = '8px'; 
      it.style.background = 'var(--panel)'; 
      it.style.marginBottom = '8px';
      
      const meta = document.createElement('div'); 
      meta.style.display = 'flex'; 
      meta.style.justifyContent = 'space-between';
      meta.style.marginBottom = '6px';
      meta.innerHTML = `<strong>${escapeHtml(r.author||'Аноним')}</strong> <small style="color:var(--muted)">${escapeHtml(r.date||'')} • ${'★'.repeat(r.rating||1)}</small>`;
      
      const txt = document.createElement('div'); 
      txt.style.whiteSpace = 'pre-wrap'; 
      txt.style.fontSize = '14px';
      txt.textContent = r.text || '';
      
      const controls = document.createElement('div'); 
      controls.style.display = 'flex'; 
      controls.style.gap = '8px'; 
      controls.style.marginTop = '8px';
      
      const editBtn = document.createElement('button'); 
      editBtn.className = 'btn btn-outline'; 
      editBtn.textContent = '✏️';
      editBtn.style.padding = '4px 8px';
      editBtn.style.minHeight = 'auto';
      
      const delBtn = document.createElement('button'); 
      delBtn.className = 'btn btn-outline'; 
      delBtn.textContent = '🗑️';
      delBtn.style.padding = '4px 8px';
      delBtn.style.minHeight = 'auto';
      
      editBtn.addEventListener('click', ()=>{ 
        revAuthor.value = r.author||''; 
        revDate.value = r.date||''; 
        revText.value = r.text||''; 
        revRating.value = String(r.rating||1); 
        addReviewBtn.dataset.editIndex = String(i); 
        addReviewBtn.textContent = 'Обновить'; 
      });
      
      delBtn.addEventListener('click', ()=>{ 
        if(!confirm('Удалить этот отзыв?')) return; 
        const arr = storage.loadReviews(); 
        arr.splice(i,1); 
        storage.saveReviews(arr); 
        renderReviews(); 
        showMsg('✅ Отзыв удалён'); 
      });
      
      controls.appendChild(editBtn); 
      controls.appendChild(delBtn);
      
      it.appendChild(meta); 
      it.appendChild(txt); 
      it.appendChild(controls);
      reviewsList.appendChild(it);
    });
  }

  if(addReviewBtn) {
    addReviewBtn.addEventListener('click', ()=>{
      const author = (revAuthor && revAuthor.value || 'Аноним').trim();
      const date = (revDate && revDate.value) || (new Date()).toISOString().slice(0,10);
      const text = (revText && revText.value || '').trim();
      const rating = revRating ? parseInt(revRating.value || '1', 10) : 1;
      
      if(!text){ showMsg('Введите текст отзыва', false); return; }
      
      const arr = storage.loadReviews();
      const editIndex = typeof addReviewBtn.dataset.editIndex !== 'undefined' ? parseInt(addReviewBtn.dataset.editIndex,10) : NaN;
      
      if(!isNaN(editIndex) && editIndex >= 0 && editIndex < arr.length){
        arr[editIndex] = { author, date, text, rating };
        delete addReviewBtn.dataset.editIndex;
        addReviewBtn.textContent = 'Добавить/Обновить';
        showMsg('✅ Отзыв обновлён');
      } else {
        arr.unshift({ author, date, text, rating });
        showMsg('✅ Отзыв добавлен');
      }
      
      storage.saveReviews(arr);
      revAuthor.value = ''; 
      revDate.value = ''; 
      revText.value = ''; 
      if(revRating) revRating.value = '5';
      renderReviews();
    });
  }

  if(clearReviewsBtn) {
    clearReviewsBtn.addEventListener('click', ()=>{ 
      if(!confirm('Удалить все отзывы?')) return; 
      storage.saveReviews([]); 
      renderReviews(); 
      showMsg('✅ Все отзывы удалены'); 
    });
  }

  // initializations
  if(sel && !sel.value) sel.selectedIndex = 0;
  loadCurrent();
  renderReviews();

  // react to storage events
  window.addEventListener('storage', function(e){
    if(!e.key) return;
    if(e.key.startsWith('gallery_')){
      const key = (sel && sel.value) || '';
      if(e.key === storage.keyFor(key)) {
        console.log('🔄 Обновление из storage события');
        loadCurrent();
      }
    }
    if(e.key === 'harest_reviews') renderReviews();
  });
}