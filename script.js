/* Tombstone: large gallery/lightbox/admin logic moved to modular files:
   - lib/lightbox.js
   - lib/gallery.js
   - lib/admin-controls.js
   The removed functions and logic were refactored into those modules for clarity. */

 // Theme toggle: use provided image icons (light.png / dark.png) and persist choice in localStorage
 (function(){
   const THEME_KEY = 'harest_theme';
   function setTheme(t){
     try{ document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : ''); localStorage.setItem(THEME_KEY, t); }catch(e){}
     updateToggle();
   }
   function getTheme(){ try{ return localStorage.getItem(THEME_KEY) || 'light'; }catch(e){ return 'light'; } }

   // update the <img> inside the toggle button according to current theme
   function updateToggle(){
     const btn = document.getElementById('themeToggleBtn');
     if(!btn) return;
     const cur = getTheme();
     btn.setAttribute('aria-pressed', cur === 'dark' ? 'true' : 'false');
     // ensure there's an <img> inside the button
     let img = btn.querySelector('img.theme-icon');
     if(!img){
       img = document.createElement('img');
       img.className = 'theme-icon';
       img.alt = 'theme';
       img.width = 28;
       img.height = 28;
       // keep pointer events off the image so button receives clicks reliably
       img.style.pointerEvents = 'none';
       // clear any text nodes
       btn.textContent = '';
       btn.appendChild(img);
     }
     // swap source depending on theme
     if(cur === 'dark'){
       img.src = 'dark.png';
     } else {
       img.src = 'light.png';
     }
   }

   function ensureToggle(){
     const nav = document.querySelector('.main-nav');
     if(!nav) return;

     // build toggle node
     const container = document.createElement('span');
     container.style.display='inline-flex';
     container.style.alignItems='center';
     container.style.marginLeft='8px';
     const btn = document.createElement('button');
     btn.type='button';
     btn.id='themeToggleBtn';
     btn.className='btn';
     btn.style.width='44px';
     btn.style.height='44px';
     btn.style.padding='6px';
     btn.style.borderRadius='10px';
     btn.title='Тема: тёмная/светлая';
     btn.addEventListener('click', function(){ const next = getTheme() === 'dark' ? 'light' : 'dark'; setTheme(next); });
     container.appendChild(btn);

     // On small screens place toggle to the right of the HAREST text (.brand > div),
     // otherwise place it next to the "Отзывы" link in nav (or at end of nav).
     const isMobile = window.matchMedia && window.matchMedia('(max-width:520px)').matches;
     if(isMobile){
       const brandTextWrap = document.querySelector('.brand > div');
       if(brandTextWrap && brandTextWrap.parentElement){
         const wrapper = document.createElement('span');
         wrapper.style.display = 'inline-flex';
         wrapper.style.alignItems = 'center';
         wrapper.style.marginLeft = '8px';
         wrapper.appendChild(container);
         brandTextWrap.parentElement.insertBefore(wrapper, brandTextWrap.nextSibling);
       } else {
         nav.appendChild(container);
       }
     } else {
       const reviewLink = Array.from(nav.querySelectorAll('.nav-link')).find(a => /отзыв/i.test(a.textContent));
       if(reviewLink && reviewLink.parentElement){
         reviewLink.parentElement.insertBefore(container, reviewLink.nextSibling);
       } else {
         nav.appendChild(container);
       }
     }

     // update icon state
     updateToggle();

     // keep placement responsive on resize: move toggle if layout crosses mobile threshold
     let placedWrapper = container.parentElement;
     function handleResize(){
       const nowMobile = window.matchMedia && window.matchMedia('(max-width:520px)').matches;
       if(nowMobile && !document.querySelector('.brand > div + span > #themeToggleBtn')){
         const brandTextWrap = document.querySelector('.brand > div');
         if(brandTextWrap && placedWrapper){
           brandTextWrap.parentElement.insertBefore(placedWrapper, brandTextWrap.nextSibling);
         }
       } else if(!nowMobile && !document.querySelector('.main-nav > span > #themeToggleBtn')){
         const reviewLink = Array.from(nav.querySelectorAll('.nav-link')).find(a => /отзыв/i.test(a.textContent));
         if(reviewLink && reviewLink.parentElement && placedWrapper){
           reviewLink.parentElement.insertBefore(placedWrapper, reviewLink.nextSibling);
         } else if(placedWrapper){
           nav.appendChild(placedWrapper);
         }
       }
     }
     window.addEventListener('resize', handleResize);
   }
   document.addEventListener('DOMContentLoaded', function(){ ensureToggle(); setTheme(getTheme()); });
 })();

// Minimal bootstrap: prevent default on empty-href links and support triple-tap brand unlock.
document.addEventListener('click', function(e){
  const a = e.target.closest('a');
  if(!a) return;
  if(a.getAttribute('href') === '#'){ e.preventDefault(); }
});

// Triple-press on brand logo -> go to admin page (kept small here)
(function(){
  const logo = document.querySelector('.brand-logo');
  if(!logo) return;
  let count = 0;
  let timer = null;
  const RESET_MS = 900;
  function reset(){ count = 0; if(timer){ clearTimeout(timer); timer = null; } }
  function activate(){ window.location.href = 'admin-login.html'; }
  function pressed(){ count += 1; if(timer) clearTimeout(timer); timer = setTimeout(reset, RESET_MS); if(count >= 3){ reset(); activate(); } }
  logo.addEventListener('click', pressed);
  logo.addEventListener('touchend', function(e){ if(e.changedTouches && e.changedTouches.length > 1) return; pressed(); }, {passive:true});
})();

// Dynamically import modules (browser-native modules). Modules attach required globals (Lightbox, Gallery init, AdminControls).
(async function(){
  try{
    await Promise.all([
      import('./lib/lightbox.js'),
      import('./lib/gallery.js'),
      import('./lib/admin-controls.js')
    ]);
  }catch(err){
    // log but don't break the page
    console.warn('Failed to load gallery modules:', err);
  }
})();