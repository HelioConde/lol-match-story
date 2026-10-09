(() => {
  'use strict';
  const I = 12000;
  const V = 'version.json';
  const P = '__v';
  const L = new Set(['localhost', '127.0.0.1', '::1']);
  // Multiple products live on helioconde.github.io; updates must stay inside our scope.
  const APP_SCOPE = new URL('./', document.currentScript?.src || location.href).pathname;
  if (L.has(location.hostname)) return;

  const current = new URL(location.href);
  if (current.searchParams.has(P)) {
    current.searchParams.delete(P);
    history.replaceState(null, '', current.pathname + current.search + current.hash);
  }

  let currentVersion = null;
  let checking = false;
  let reloading = false;

  async function fetchVersion() {
    const response = await fetch(V + '?_=' + Date.now(), { cache:'no-store', credentials:'same-origin' });
    if (!response.ok) throw new Error('version-' + response.status);
    const payload = await response.json();
    return String(payload?.sha || payload?.version || '').trim();
  }

  function notice() {
    let box = document.getElementById('live-update-notice');
    if (box) return box;
    box = document.createElement('div');
    box.id = 'live-update-notice';
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    box.textContent = 'Nova versão publicada. Atualizando automaticamente…';
    Object.assign(box.style, {
      position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',
      zIndex:'2147483647',maxWidth:'calc(100vw - 24px)',padding:'10px 14px',
      borderRadius:'999px',background:'#171717',color:'#fff',
      font:'600 12px/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      boxShadow:'0 10px 35px rgba(0,0,0,.25)',textAlign:'center'
    });
    document.body.appendChild(box);
    return box;
  }

  async function refreshOwnCaches() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(registrations
          .filter(reg => new URL(reg.scope).pathname === APP_SCOPE)
          .map(reg => reg.update()));
      }
    } catch {}
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.allSettled(keys
          .filter(key => key.startsWith('lol-match-story-'))
          .map(key => caches.delete(key)));
      }
    } catch {}
  }

  async function reloadFresh(next) {
    if (reloading) return;
    reloading = true;
    notice();
    await refreshOwnCaches();
    await new Promise(resolve => setTimeout(resolve, 650));
    const url = new URL(location.href);
    url.searchParams.set(P, next.slice(0, 16) || Date.now().toString());
    location.replace(url.toString());
  }

  async function checkVersion() {
    if (checking || reloading) return;
    checking = true;
    try {
      const latest = await fetchVersion();
      if (!latest) return;
      if (currentVersion === null) {
        currentVersion = latest;
        return;
      }
      if (latest !== currentVersion) await reloadFresh(latest);
    } catch {
      // Version checks must never prevent users from viewing their stories.
    } finally {
      checking = false;
    }
  }

  checkVersion();
  setInterval(checkVersion, I);
  addEventListener('focus', checkVersion);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkVersion();
  });
})();
