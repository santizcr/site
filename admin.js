/* Tombstone: admin.js was refactored — the full admin implementation was moved to lib/admin-core.js
   removed: all internal functions and DOM-heavy logic from previous admin.js (loadCurrent, renderList,
            saveGalleryData, loadGalleryData, normalizeDriveUrl, reviews management, etc.)
   admin.js now only bootstraps the admin core module.
*/

(async function(){
  try{
    const mod = await import('./lib/admin-core.js');
    if(mod && typeof mod.initAdmin === 'function') mod.initAdmin();
  }catch(err){
    console.error('Failed to load admin core:', err);
    // fallback: notify user
    const msg = document.getElementById && document.getElementById('msg');
    if(msg) { msg.textContent = 'Ошибка загрузки админ-модуля'; msg.style.color='crimson'; }
  }
})();