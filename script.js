/* Tombstone: large gallery/lightbox/admin logic moved to modular files:
   - lib/lightbox.js
   - lib/gallery.js
   - lib/admin-controls.js
   The removed functions and logic were refactored into those modules for clarity. */

// Theme toggle: insert small icon to header next to "Отзывы" and persist choice in localStorage
(function(){
  const THEME_KEY = 'harest_theme';
  function setTheme(t){
    try{ document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : ''); localStorage.setItem(THEME_KEY, t); }catch(e){}
    updateToggle();
  }
  function getTheme(){ try{ return localStorage.getItem(THEME_KEY) || 'light'; }catch(e){ return 'light'; } }
  function updateToggle(){
    const btn = document.getElementById('themeToggleBtn');
    if(!btn) return;
    const cur = getTheme();
    btn.setAttribute('aria-pressed', cur === 'dark' ? 'true' : 'false');
    // show sun for light theme, moon for dark theme — icons are kept black via CSS
    btn.textContent = cur === 'dark' ? '☾' : '☀';
  }
  function ensureToggle(){
    const nav = document.querySelector('.main-nav');
    if(!nav) return;
    // insert after "Отзывы" link if present
    const reviewLink = Array.from(nav.querySelectorAll('.nav-link')).find(a => /отзыв/i.test(a.textContent));
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
    if(reviewLink && reviewLink.parentElement){
      reviewLink.parentElement.insertBefore(container, reviewLink.nextSibling);
    } else {
      nav.appendChild(container);
    }
    updateToggle();
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