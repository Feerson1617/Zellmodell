// SCORM 1.2 session lifecycle. The SCO never reads or writes learner data.
(() => {
  let api = null;
  function find(start) {
    let w = start;
    for (let i = 0; w && i < 32; i++) {
      try {
        if (typeof w.API?.LMSInitialize === 'function') return w.API;
        if (w === w.parent) break;
        w = w.parent;
      } catch {
        break;
      }
    }
    return null;
  }
  function start() {
    if (api) return;
    const candidate = find(window) || find(window.opener);
    try {
      if (candidate && String(candidate.LMSInitialize('')) === 'true') api = candidate;
    } catch {
      /* Standalone use remains available when the LMS is unreachable. */
    }
  }
  function finish() {
    const active = api;
    api = null;
    if (active) active.LMSFinish('');
  }
  start();
  window.addEventListener('pagehide', finish);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) start();
  });
})();
