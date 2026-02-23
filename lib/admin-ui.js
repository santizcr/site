/* lib/admin-ui.js — DOM wiring and UI handlers for admin panel.
   Uses injected storage helpers. Keeps DOM logic separated from storage.
*/
export function AdminUI(opts){
  const storage = opts && opts.storage;
  if(!storage) throw new Error('storage required');

  const sel = document.getElementById('galleryKey');
  const loadBtn = document.getElementById('loadBtn');
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
  const revRating = document.getElementById('revRating'); // new rating input
  const addReviewBtn = document.getElementById('addReviewBtn');
  const reviewsList = document.getElementById('reviewsList');
  const clearReviewsBtn = document.getElementById('clearReviewsBtn');

  let current = { images: [], meta: {} };

  function showMsg(t, ok=true){
    if(!msg) return;
    msg.textContent = t;
    msg.style.color = ok ? 'green' : 'crimson';
    setTimeout(()=>{ if(msg) msg.textContent = ''; }, 3500);
  }

  function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // Build list UI (kept compact, similar to previous implementation)
  function renderList(){
    if(!listEl) return;
    listEl.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
    grid.style.gap = '10px';
    current.images.forEach((it, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'item';
      wrap.style.position = 'relative';
      wrap.style.padding = '6px';
      wrap.style.borderRadius = '8px';
      wrap.style.background = 'var(--panel)';

      const img = document.createElement('img');
      img.src = it.src || '';
      img.alt = it.alt || '';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '6px';
      img.style.cursor = 'pointer';

      const delBtn = document.createElement('button');
      delBtn.type='button'; delBtn.className='btn btn-outline'; delBtn.textContent='✕';
      delBtn.style.position='absolute'; delBtn.style.top='6px'; delBtn.style.right='6px';
      delBtn.addEventListener('click', (e)=>{ e.stopPropagation(); current.images.splice(i,1); renderList(); });

      const altInput = document.createElement('input');
      altInput.type='text'; altInput.value = it.alt || ''; altInput.placeholder='Альт';
      altInput.style.marginTop='6px'; altInput.style.width='100%';
      altInput.addEventListener('input', ()=> current.images[i].alt = altInput.value);

      img.addEventListener('click', ()=> {
        const urls = current.images.map(x=>x.src);
        if(window.Lightbox && typeof window.Lightbox.open === 'function') Lightbox.open(urls, i);
      });

      wrap.appendChild(img);
      wrap.appendChild(delBtn);
      wrap.appendChild(altInput);
      grid.appendChild(wrap);
    });
    listEl.appendChild(grid);
  }

  function loadDefaultsFromDOM(k){
    const g = document.querySelector('[data-gallery-key="'+k+'"]');
    if(!g) return { images: [], meta: {} };
    const stage = g.querySelector('[data-stage]');
    const meta = {};
    const details = g.closest('main') ? g.closest('main').querySelector('.details') : document.querySelector('.details');
    if(details){
      const priceEl = details.querySelector('.price');
      const specsEl = details.querySelector('.specs');
      const descEl = details.querySelector('.desc') || details.querySelector('.desc');
      const rulesEl = details.querySelector('.rules');
      if(priceEl) meta.price = priceEl.innerHTML;
      if(descEl) meta.description = descEl.innerHTML;
      if(rulesEl) meta.rules = rulesEl.innerHTML;
      if(specsEl) meta.specs = Array.from(specsEl.querySelectorAll('.spec')).map(s => s.innerText.trim());
      const titleEl = g.querySelector('.owner-sub') || document.querySelector('.owner-sub');
      if(titleEl) meta.title = titleEl.textContent.trim();
    }
    const imgs = [];
    if(stage) Array.from(stage.querySelectorAll('img')).forEach(img => imgs.push({ src: img.src, alt: img.alt||'' }));
    return { images: imgs, meta };
  }

  function loadCurrent(){
    const k = sel && sel.value;
    if(!k) return;
    const stored = storage.loadGallery(k);
    if(stored){ current = { images: stored.images.slice(), meta: Object.assign({}, stored.meta || {}) }; }
    else current = loadDefaultsFromDOM(k);
    if(metaTitle) metaTitle.value = current.meta.title || '';
    if(metaPrice) metaPrice.value = current.meta.price || '';
    if(metaDesc) metaDesc.value = current.meta.description || '';
    if(metaSpecs) metaSpecs.value = (current.meta.specs && current.meta.specs.join(',')) || '';
    if(metaRules) metaRules.value = current.meta.rules || '';
    renderList();
  }

  // file add
  if(addFilesBtn){
    addFilesBtn.addEventListener('click', ()=>{
      const files = Array.from(filePicker.files || []);
      if(files.length === 0){ showMsg('Выберите файлы', false); return; }
      const readers = files.map(f => new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res({ src: String(r.result), alt: f.name || '' });
        r.onerror = () => rej(f);
        r.readAsDataURL(f);
      }));
      Promise.allSettled(readers).then(results => {
        let added = 0;
        results.forEach(r => { if(r.status==='fulfilled'&&r.value&&r.value.src){ current.images.push(r.value); added++; }});
        if(added) { renderList(); showMsg(`${added} файл(ов) добавлено. Сохраните галерею.`); } else showMsg('Не удалось добавить файлы', false);
        if(filePicker) filePicker.value='';
      });
    });
  }

  // add by url (light normalization of google drive)
  function normalizeDriveUrl(url){
    if(!url) return url;
    try{
      const u = new URL(url);
      if(u.hostname.includes('drive.google.com')){
        const m = u.pathname.match(/\/file\/d\/([^\/]+)\/?/);
        if(m && m[1]) return 'https://drive.google.com/uc?export=download&id=' + m[1];
        if(u.searchParams.get('id')) return 'https://drive.google.com/uc?export=download&id=' + u.searchParams.get('id');
      }
    }catch(e){}
    return url;
  }
  if(addUrlBtn) addUrlBtn.addEventListener('click', ()=>{
    let u = (urlIn && urlIn.value || '').trim();
    if(!u){ showMsg('Введите URL', false); return; }
    u = normalizeDriveUrl(u);
    current.images.push({ src: u, alt: '' });
    renderList();
    if(urlIn) urlIn.value = '';
  });

  if(deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', ()=>{
    const before = current.images.length;
    current.images = current.images.filter(it => !it._selected);
    renderList();
    const removed = before - current.images.length;
    showMsg(removed ? `${removed} фото удалено` : 'Ничего не выбрано', removed > 0);
  });

  if(applyAllBtn) applyAllBtn.addEventListener('click', ()=>{
    const k = sel && sel.value;
    if(!k) { showMsg('Выберите галерею', false); return; }
    const meta = {
      title: metaTitle.value.trim(),
      price: metaPrice.value.trim(),
      description: metaDesc.value.trim(),
      specs: metaSpecs.value.trim() ? metaSpecs.value.split(',').map(s=>s.trim()) : [],
      rules: metaRules.value.trim()
    };
    const data = { images: current.images.slice(), meta: meta };
    if(!storage.saveGallery(k, data)){ showMsg('Ошибка при сохранении', false); return; }
    const g = document.querySelector('[data-gallery-key="'+k+'"]');
    if(g){
      const stage = g.querySelector('[data-stage]');
      if(stage){
        stage.innerHTML = '';
        current.images.forEach(it=>{
          const im = document.createElement('img'); im.className='card-image'; im.src=it.src||''; im.alt=it.alt||''; stage.appendChild(im);
        });
      }
      const details = g.closest('main') ? g.closest('main').querySelector('.details') : document.querySelector('.details');
      if(details){
        if(meta.title){ const ownerSub = document.querySelector('.owner-sub'); if(ownerSub) ownerSub.textContent = meta.title; }
        if(meta.price){ const priceEl = details.querySelector('.price'); if(priceEl) priceEl.innerHTML = meta.price; }
        if(meta.description){ const descEl = details.querySelector('.desc'); if(descEl) descEl.innerHTML = '<strong>Описание:</strong> ' + meta.description; }
        if(Array.isArray(meta.specs) && meta.specs.length){
          const specsEl = details.querySelector('.specs');
          if(specsEl){ specsEl.innerHTML=''; meta.specs.forEach(sp=>{ const d=document.createElement('div'); d.className='spec'; d.innerHTML=sp; specsEl.appendChild(d); }); }
        }
        if(meta.rules){
          let rulesEl = details.querySelector('.rules');
          if(!rulesEl){ rulesEl = document.createElement('p'); rulesEl.className='rules'; details.appendChild(rulesEl); }
          rulesEl.innerHTML = '<strong>Правила проживания:</strong> ' + meta.rules;
        }
      }
    } else {
      showMsg('Галерея сохранена в локальном хранилище. Перезагрузите страницу объекта, чтобы увидеть изменения', true);
      return;
    }
    showMsg('Сохранено и применено в DOM — перезагрузите страницу чтобы увидеть эффекты полностью');
  });

  if(loadBtn) loadBtn.addEventListener('click', function(e){ e && e.preventDefault && e.preventDefault(); loadCurrent(); showMsg('Галерея загружена'); });
  if(sel) sel.addEventListener('change', loadCurrent);

  // Reviews management using storage
  function renderReviews(){
    if(!reviewsList) return;
    const list = storage.loadReviews();
    reviewsList.innerHTML = '';
    if(list.length === 0){ reviewsList.innerHTML = '<div class="small" style="padding:8px;color:var(--muted)">Нет отзывов</div>'; return; }
    list.forEach((r,i)=>{
      const it = document.createElement('div'); it.className='item'; it.style.display='flex'; it.style.flexDirection='column'; it.style.gap='6px';
      const meta = document.createElement('div'); meta.style.display='flex'; meta.style.justifyContent='space-between'; meta.innerHTML=`<strong>${escapeHtml(r.author||'Аноним')}</strong><span class="small">${r.date||''}</span>`;
      const txt = document.createElement('div'); txt.style.whiteSpace='pre-wrap'; txt.textContent = r.text || '';
      const controls = document.createElement('div'); controls.style.display='flex'; controls.style.gap='8px';
      const editBtn = document.createElement('button'); editBtn.className='btn btn-outline'; editBtn.textContent='Редактировать';
      const delBtn = document.createElement('button'); delBtn.className='btn btn-outline'; delBtn.textContent='Удалить';
      editBtn.addEventListener('click', ()=>{ 
        if(revAuthor) revAuthor.value = r.author||''; 
        if(revDate) revDate.value = r.date||''; 
        if(revText) revText.value = r.text||''; 
        if(revRating) revRating.value = String(r.rating || 1); // populate rating when editing
        addReviewBtn.dataset.editIndex = String(i); 
        addReviewBtn.textContent='Обновить'; 
      });
      delBtn.addEventListener('click', ()=>{ if(!confirm('Удалить этот отзыв?')) return; const arr = storage.loadReviews(); arr.splice(i,1); storage.saveReviews(arr); renderReviews(); showMsg('Отзыв удалён'); });
      controls.appendChild(editBtn); controls.appendChild(delBtn);
      it.appendChild(meta); it.appendChild(txt); it.appendChild(controls);
      reviewsList.appendChild(it);
    });
  }

  if(addReviewBtn) addReviewBtn.addEventListener('click', ()=>{
    const author = (revAuthor && revAuthor.value || 'Аноним').trim();
    const date = (revDate && revDate.value) || (new Date()).toISOString().slice(0,10);
    const text = (revText && revText.value || '').trim();
    const rating = revRating ? parseInt(revRating.value || '1', 10) : 1;
    if(!text){ showMsg('Введите текст отзыва', false); return; }
    const arr = storage.loadReviews();
    const editIndex = typeof addReviewBtn.dataset.editIndex !== 'undefined' ? parseInt(addReviewBtn.dataset.editIndex,10) : NaN;
    if(!isNaN(editIndex)){
      arr[editIndex] = { author, date, text, rating };
      delete addReviewBtn.dataset.editIndex;
      addReviewBtn.textContent='Добавить/Обновить';
      showMsg('Отзыв обновлён');
    } else {
      arr.unshift({ author, date, text, rating });
      showMsg('Отзыв добавлен');
    }
    storage.saveReviews(arr);
    // clear inputs after save/update
    if(revAuthor) revAuthor.value='';
    if(revDate) revDate.value='';
    if(revText) revText.value='';
    if(revRating) revRating.value = '1';
    renderReviews();
  });

  if(clearReviewsBtn) clearReviewsBtn.addEventListener('click', ()=>{ if(!confirm('Удалить все отзывы?')) return; storage.saveReviews([]); renderReviews(); showMsg('Все отзывы удалены'); });

  // initializations
  if(sel && !sel.value) { sel.selectedIndex = 0; }
  loadCurrent();
  renderReviews();

  // react to storage events for gallery updates (simple re-load)
  window.addEventListener('storage', function(e){
    if(!e.key) return;
    if(e.key.startsWith('gallery_')){
      const key = (sel && sel.value) || '';
      if(e.key === storage.keyFor(key)) loadCurrent();
    }
    if(e.key === 'harest_reviews') renderReviews();
  });
}