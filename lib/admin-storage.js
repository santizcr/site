/* lib/admin-storage.js — storage helpers for admin: galleries + reviews */
export function Storage(){
  const G_PREFIX = 'gallery_';
  const REV_KEY = 'harest_reviews';

  function keyFor(k){ return G_PREFIX + (k || ''); }

  function loadGallery(key){
    try{
      const raw = localStorage.getItem(keyFor(key));
      if(!raw) return null;
      const parsed = JSON.parse(raw);
      if(parsed && Array.isArray(parsed.images)) return parsed;
      return null;
    }catch(e){ 
      console.error('Ошибка загрузки из storage:', e);
      return null; 
    }
  }

  function saveGallery(key, data){
    try{
      const k = keyFor(key);
      const v = JSON.stringify(data);
      localStorage.setItem(k, v);
      console.log('✅ Сохранено в localStorage:', k, data);
      // Notify other modules in the same window
      try{
        window.dispatchEvent(new StorageEvent('storage', { key: k, newValue: v }));
      }catch(e){
        window.dispatchEvent(new CustomEvent('storage:local', { detail: { key: k, newValue: v } }));
      }
      return true;
    }catch(e){
      console.error('❌ Ошибка сохранения в localStorage:', e);
      return false;
    }
  }

  function loadReviews(){
    try{
      const raw = localStorage.getItem(REV_KEY);
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)) return parsed;
    }catch(e){
      console.error('Ошибка загрузки отзывов:', e);
    }
    return [];
  }

  function saveReviews(list){
    try{
      const v = JSON.stringify(list);
      localStorage.setItem(REV_KEY, v);
      // Notify other modules in the same window that reviews changed
      try{
        window.dispatchEvent(new StorageEvent('storage', { key: REV_KEY, newValue: v }));
      }catch(e){
        window.dispatchEvent(new CustomEvent('storage:local', { detail: { key: REV_KEY, newValue: v } }));
      }
      return true;
    }catch(e){
      console.error('Ошибка сохранения отзывов:', e);
      return false;
    }
  }

  return {
    loadGallery, saveGallery,
    loadReviews, saveReviews,
    keyFor
  };
}