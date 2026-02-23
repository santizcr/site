/* lib/admin-core.js — bootstrap for admin module
   The large admin implementation was refactored into:
     - lib/admin-storage.js  (storage helpers for galleries & reviews)
     - lib/admin-ui.js       (DOM wiring and UI handlers)

   Tombstone: removed the in-file implementations to keep this file small.
   removed functions and logic: loadGalleryData(), saveGalleryData(), loadDefaultsFromDOM(),
   renderList(), normalizeDriveUrl(), loadCurrent(), renderReviews(), and many event handlers.
*/

import { Storage } from './admin-storage.js';
import { AdminUI } from './admin-ui.js';

/* initAdmin bootstraps storage + UI. */
export function initAdmin(){
  try{
    const storage = Storage();
    AdminUI({ storage });
  }catch(err){
    console.error('Failed to init admin modules', err);
    const msg = document.getElementById && document.getElementById('msg');
    if(msg){ msg.textContent = 'Ошибка загрузки админ-модуля'; msg.style.color = 'crimson'; }
  }
}