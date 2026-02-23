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
    }catch(e){ return null; }
  }

  function saveGallery(key, data){
    try{ localStorage.setItem(keyFor(key), JSON.stringify(data)); return true; }catch(e){ return false; }
  }

  function loadReviews(){
    try{
      const raw = localStorage.getItem(REV_KEY);
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)) return parsed;
    }catch(e){}
    return [];
  }

  function saveReviews(list){
    try{ localStorage.setItem(REV_KEY, JSON.stringify(list)); return true; }catch(e){ return false; }
  }

  return {
    loadGallery, saveGallery,
    loadReviews, saveReviews,
    keyFor
  };
}