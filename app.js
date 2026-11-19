(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const { cells, organs, parts } = AtlasData;
  const glyphs = {
    animal: '<path d="M3 13C2 7 7 3 13 4s9 5 8 10-6 7-12 6-5-3-6-7Z"/><circle cx="10" cy="11" r="2.8"/>',
    plant: '<path d="m5 5 12-2 4 5-1 11-14 2-3-5Z"/><path d="m8 8 7-1 2 3-1 6-7 1-2-3Z"/>',
    ciliate:
      '<ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-30 12 12)"/><path d="m5 8-1-2m5 0-1-2m5 1v-2m5 3 1-2m-4 14 1 2m-6-1v2m-6-5-2 1"/>',
    book: '<path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>',
    section: '<circle cx="12" cy="12" r="8"/><path d="m6 18 12-12m-5 13 6-6m-1-4-9 9"/>',
    whole: '<circle cx="12" cy="12" r="8"/><path d="M5 15c5 1 11-3 13-8"/>',
    full: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
    reset: '<path d="M4 10a8 8 0 1 1 1 8M4 5v5h5"/>',
    tag: '<path d="M3 4h8l10 10-7 7L3 10Z"/><circle cx="8" cy="8" r="1"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/>',
    off: '<path d="m3 3 18 18M5 8l-3 4s4 7 10 7c2 0 3-.5 4-1m-7-12 3-1c6 0 10 7 10 7l-3 3"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    rotate:
      '<path d="M18 9c4 1 5 3 2 5s-11 4-16 0c-3-2 0-5 4-5m-3-2 3 2-3 2"/><path d="M9 15V7c0-3 5-3 5 0v8"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.4"/>',
  };
  const icon = (id) => '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + glyphs[id] + '</svg>';
  document.querySelectorAll('[data-icon]').forEach((i) => (i.innerHTML = icon(i.dataset.icon)));
  const s = {
    cell: 'animal',
    organ: null,
    part: null,
    selected: null,
    cut: true,
    labels: true,
    auto: false,
    entries: [],
    hidden: new Set(),
  };
  let pane = null,
    opener = null,
    cooldown = 0;
  const hiddenSets = new Map();
  const details = (title, body, open = false) =>
    '<details' + (open ? ' open' : '') + '><summary>' + title + '</summary><p>' + body + '</p></details>';
  const depth = () => (s.part ? 3 : s.organ ? 2 : 1);
  const itemName = (id) => (s.organ ? parts : organs)[id][0];
  function noGL(message) {
    $('status').textContent = 'Textansicht';
    $('fallback').hidden = false;
    $('fallback').textContent = message;
  }
  let view;
  try {
    view = createView($('scene'), $('labels'), {
      select,
      level,
      magnify: (z) => ($('magnification').textContent = Math.round(z * 100) + ' %'),
      lost: () =>
        noGL(
          'Die Grafikverbindung wurde unterbrochen. Die Informationen bleiben über Bestandteile erreichbar.',
        ),
    });
  } catch (error) {
    console.error(error);
  }
  if (!view) {
    noGL(
      'WebGL 2 ist hier nicht verfügbar. Alle Bau- und Funktionstexte sind über die Bestandteile erreichbar.',
    );
    for (const id of ['minus', 'plus', 'names', 'reset', 'cut', 'whole']) $(id).disabled = true;
  } else $('status').textContent = 'WebGL 2';
  function fallback() {
    const layer = $('fallback');
    $('status').textContent = s.organ ? 'Textansicht' : '2D-Ersatzansicht';
    layer.innerHTML = s.organ
      ? '<p>Die räumliche Detailansicht benötigt WebGL 2. Alle Erläuterungen sind im Strukturverzeichnis verfügbar.</p>'
      : AtlasFallback[s.cell]();
    layer.querySelectorAll('[data-part]').forEach((el) => {
      el.style.display = s.hidden.has(el.dataset.part) ? 'none' : '';
      el.onclick = () => select(el.dataset.part);
      el.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(el.dataset.part);
        }
      };
    });
  }
  function updateView() {
    if (view) view.update(s);
    else fallback();
  }
  function select(id) {
    if (s.part) {
      openPane('info');
      return;
    }
    if (!s.entries.includes(id)) return;
    s.selected = id;
    s.hidden.delete(id);
    updateView();
    openPane('info');
  }
  function level(forward) {
    if (performance.now() < cooldown) return false;
    if (forward && s.selected && !s.part) enter();
    else if (!forward && s.organ) back();
    else return false;
    cooldown = performance.now() + 650;
    return true;
  }
  function enter() {
    if (!s.selected) return;
    if (s.organ) s.part = s.selected;
    else s.organ = s.selected;
    s.selected = null;
    rebuild();
    openPane(s.part ? 'info' : null);
  }
  function back() {
    if (s.part) {
      s.selected = s.part;
      s.part = null;
    } else {
      s.selected = s.organ;
      s.organ = null;
    }
    rebuild();
    openPane(null);
  }
  function rebuild(keepCamera = false) {
    const cell = cells[s.cell],
      scope = [s.cell, s.organ, s.part].join('/');
    if (!hiddenSets.has(scope)) hiddenSets.set(scope, new Set());
    s.hidden = hiddenSets.get(scope);
    s.entries = s.part ? [s.part] : (s.organ ? organs[s.organ][5] : cell[4]).split(' ');
    if (s.cell === 'plant') s.entries = s.entries.filter((id) => id !== 'lamina');
    if (s.selected) s.hidden.delete(s.selected);
    document
      .querySelectorAll('[data-cell]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cell === s.cell)));
    $('title').textContent = s.part ? parts[s.part][0] : s.organ ? organs[s.organ][0] : cell[0];
    $('subtitle').textContent = s.part
      ? 'Feinstruktur im Einzelmodell'
      : s.organ
        ? 'Bau und Funktion im Detail'
        : cell[2];
    $('crumbs').innerHTML = s.organ
      ? '<button data-action="root" title="Zur Zellebene">← ' +
        cell[0] +
        '</button> / ' +
        (s.part ? '<button data-action="back">' + organs[s.organ][0] + '</button> / Feinbau' : 'Organell')
      : 'Zellebene';
    $('count').textContent = s.entries.length;
    $('catalog').querySelector('span').textContent = s.part
      ? 'Feinbau'
      : s.organ
        ? 'Feinstrukturen'
        : 'Bestandteile';
    $('cut').setAttribute('aria-pressed', s.cut);
    $('whole').setAttribute('aria-pressed', !s.cut);
    if (!view) fallback();
    else view.build(s, keepCamera);
    if (pane) renderPane();
  }
  function openPane(which) {
    if (which && !pane) opener = document.activeElement;
    pane = which;
    $('drawer').hidden = !pane;
    document.body.classList.toggle('section-open', !!pane);
    $('catalog').setAttribute('aria-expanded', String(pane === 'list'));
    if (pane) {
      renderPane();
      $('drawer').scrollTop = 0;
      $('close').focus({ preventScroll: true });
    } else if (opener?.isConnected) {
      opener.focus({ preventScroll: true });
      opener = null;
    }
  }
  function renderPane() {
    const cell = cells[s.cell],
      id = s.part || s.selected,
      org = s.organ || s.selected;
    let text = '',
      title = '';
    if (pane === 'list') {
      title = 'Strukturverzeichnis';
      text =
        '<h2>' +
        (s.organ ? 'Feinstrukturen' : 'Bestandteile') +
        '</h2><p>' +
        (s.organ ? organs[s.organ][2] : cell[3]) +
        '</p><div class="rows">';
      for (const key of s.entries) {
        const name = itemName(key),
          shown = !s.hidden.has(key);
        text +=
          '<div class="row' +
          (s.selected === key ? ' selected' : '') +
          '"><button class="rowname" data-select="' +
          key +
          '"><i class="swatch" style="background:' +
          organs[s.organ || key][1] +
          '"></i>' +
          name +
          '</button><button class="eyebtn" data-toggle="' +
          key +
          '" aria-pressed="' +
          shown +
          '" aria-label="' +
          name +
          ' anzeigen">' +
          icon(shown ? 'eye' : 'off') +
          '</button></div>';
      }
      text += '</div><button class="all" data-action="all">' + icon('eye') + 'Alle einblenden</button>';
    } else if (pane === 'info' && id) {
      title = s.organ ? 'Feinbau' : 'Organellinformation';
      text = '<h2>' + itemName(id) + '</h2>';
      if (s.organ)
        text +=
          '<p>' + parts[id][1] + '</p>' + details('Im Zusammenhang', organs[org][2] + ' ' + organs[org][3]);
      else text += details('Bau und Lage', organs[org][2], true) + details('Funktion', organs[org][3], true);
      text += details('Modellgrenzen', organs[org][4]);
      if (view && !s.part) text += '<button class="all" data-action="focus">Auswahl fokussieren</button>';
      if (!s.part)
        text +=
          '<button class="go" data-action="enter">' +
          (s.organ ? 'Feinbau isolieren' : 'Organell untersuchen') +
          ' →</button>';
      text += '<button class="linkbtn" data-action="list">Zum Strukturverzeichnis</button>';
    } else if (pane === 'help') {
      title = 'Bedienung';
      text =
        '<h2>Modell erkunden</h2>' +
        details(
          'Drehen und zoomen',
          'Ziehen dreht das Modell. Mit zwei Fingern, dem Mausrad oder den Plus- und Minustasten zoomst du. Die Pfeiltasten drehen bei fokussierter Modellfläche. Pos1 setzt die Ansicht zurück.',
          true,
        ) +
        details(
          'Auswählen und vertiefen',
          'Tippe auf eine Struktur, ihre Beschriftung oder ihren Namen im Verzeichnis. „Organell untersuchen“ öffnet die zweite Ebene. Dort führt die Auswahl eines Bestandteils zum isolierten Feinbau. Der Pfad über dem Modell führt zurück.',
          true,
        ) +
        '<label class="check"><input id="autoZoom" type="checkbox" ' +
        (s.auto ? 'checked' : '') +
        '>Ebenenwechsel durch Zoom</label><p>Mit Auswahl öffnet weiteres Hineinzoomen oberhalb von 260 % die nächste Ebene. Unterhalb von 61 % führt weiteres Herauszoomen zurück.</p>' +
        details(
          'Schnitt und Sichtbarkeit',
          'In der Schnittansicht ist die vordere Hülle geöffnet. Bei Hüllmembranen kennzeichnet ein heller Rand die Öffnung. Kleinere Strukturen lassen sich durch eine ebene Schnittfläche betrachten. Das Auge in der Liste blendet alle Exemplare einer Struktur ein oder aus. Esc schließt die Information.',
        );
    } else {
      title = 'Modell &amp; Quellen';
      text =
        '<h2>Über das Modell</h2><p>' +
        cell[3] +
        '</p>' +
        details(
          'Was zeigt der Schnitt?',
          'Die Öffnung der Hülle zeigt ausgewählte Innenstrukturen. Organellen sind teils zusätzlich geöffnet. Farben, Transparenz, Schichtdicken, Größen und Stückzahlen sind didaktisch gewählt. Bewegungen und Stoffflüsse sind nicht simuliert.',
          true,
        ) +
        details(
          'Endosymbiontentheorie',
          'Mitochondrien und Plastiden stammen von aufgenommenen Bakterien ab. Eigene Genome und Ribosomen sowie molekulare Verwandtschaftsanalysen stützen diese Erklärung. Die Doppelhülle allein wäre kein Beweis.',
        ) +
        details(
          'Fachquellen',
          'OpenStax, Biology 2e: Eukaryotic Cells, The Endomembrane System and Proteins, The Cytoskeleton, Oxidative Phosphorylation, Photosynthesis und Groups of Protists. Fachanforderungen Biologie Schleswig-Holstein (2026), Sekundarstufe II, und KMK-Bildungsstandards Biologie für die Allgemeine Hochschulreife (2020), Abschnitte 2.2 und 2.5.1. Eider-Treene-Schule Tönning, Fachcurriculum Biologie 2025/26, Jahrgang 11. Mühleip et al. (2016), tubuläre Cristae bei Paramecium, DOI 10.1073/pnas.1525430113.</p><p>Originalquellen online · <a href="https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells" target="_blank" rel="noopener noreferrer">OpenStax</a> · <a href="https://fachportal.lernnetz.de/sh/fachanforderungen/biologie.html" target="_blank" rel="noopener noreferrer">Fachportal SH</a> · <a href="https://ets-toenning.de/fachcurricula/" target="_blank" rel="noopener noreferrer">ETS</a> · <a href="https://doi.org/10.1073/pnas.1525430113" target="_blank" rel="noopener noreferrer">Fachartikel</a>',
        ) +
        details(
          'Darstellung und Lizenzen',
          'Eigenständig konstruierte, schematische 3D-Geometrien. Three.js r160 (MIT). Instrument Serif und DM Sans (SIL Open Font License).',
        );
    }
    $('sectionName').innerHTML = title;
    $('content').innerHTML = text;
    if ($('autoZoom')) $('autoZoom').onchange = (e) => (s.auto = e.target.checked);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cell) {
      s.cell = b.dataset.cell;
      s.organ = s.part = s.selected = null;
      openPane(null);
      rebuild();
      return;
    }
    if (b.dataset.select) {
      select(b.dataset.select);
      return;
    }
    if (b.dataset.toggle) {
      const id = b.dataset.toggle;
      if (s.hidden.has(id)) s.hidden.delete(id);
      else {
        s.hidden.add(id);
        if (s.selected === id) s.selected = null;
      }
      updateView();
      renderPane();
      document.querySelector('[data-toggle="' + id + '"]').focus();
      return;
    }
    switch (b.dataset.action || b.id) {
      case 'focus':
        openPane(null);
        view?.focus(s.selected);
        break;
      case 'enter':
        enter();
        break;
      case 'back':
        back();
        break;
      case 'root':
        s.organ = s.part = s.selected = null;
        rebuild();
        openPane(null);
        break;
      case 'all':
        s.hidden.clear();
        updateView();
        renderPane();
        $('content').querySelector('.all').focus();
        break;
      case 'list':
        openPane('list');
        break;
      case 'catalog':
        openPane(pane === 'list' ? null : 'list');
        break;
      case 'help':
      case 'sources':
        openPane(pane === b.id ? null : b.id);
        break;
      case 'close':
        openPane(null);
        break;
      case 'cut':
      case 'whole':
        if (s.cut !== (b.id === 'cut')) {
          s.cut = b.id === 'cut';
          rebuild(true);
        }
        break;
      case 'minus':
      case 'plus':
        view?.changeZoom(b.id === 'plus' ? 1.2 : 1 / 1.2, true);
        break;
      case 'reset':
        view?.reset();
        break;
      case 'names':
        s.labels = !s.labels;
        b.setAttribute('aria-pressed', s.labels);
        updateView();
        break;
      case 'full':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => openPane('help'));
        break;
    }
  });
  $('full').hidden = !document.fullscreenEnabled;
  document.addEventListener('fullscreenchange', () =>
    $('full').setAttribute('aria-pressed', !!document.fullscreenElement),
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (pane) openPane(null);
      else if (depth() > 1) back();
    }
  });
  rebuild();
})();
