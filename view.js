// Rendering is demand-driven. Only perspective, size, content or visibility changes request a frame.
function createView(canvas, labels, handlers) {
  const T = THREE,
    gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
  if (!gl) return null;
  const renderer = new T.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene(),
    pivot = new T.Group(),
    stage = new T.Group();
  scene.add(pivot);
  pivot.add(stage);
  scene.add(new T.HemisphereLight(0xfff2de, 0x58726b, 1.68));
  for (const [x, y, z, color, power] of [
    [-4, 7, 6, 0xffeed8, 2.55],
    [5, -1, 2, 0xc6e2e0, 0.65],
    [1, 3, -5, 0xe5ddc8, 1.7],
  ]) {
    const sun = new T.DirectionalLight(color, power);
    sun.position.set(x, y, z);
    scene.add(sun);
  }
  const camera = new T.OrthographicCamera(-4, 4, 3, -3, 0.01, 100);
  camera.position.z = 16;
  const ray = new T.Raycaster(),
    box = new T.Box3(),
    size = new T.Vector3(),
    centre = new T.Vector3();
  const highlight = new Map(),
    targets = new Map(),
    pointers = new Map();
  const cutPlane = new T.Plane(),
    localPlane = new T.Plane(new T.Vector3(0, 0, -1), 0);
  let model = null,
    state = null,
    zoom = 1,
    baseHeight = 5,
    frame = 0,
    pinched = false,
    dragged = false;
  function key(o) {
    if (state.organ) return o.userData.part;
    while (o && !o.userData.organ) o = o.parent;
    return o?.userData.organ;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function reset() {
    stage.position.copy(centre).negate();
    zoom = 1;
    pivot.rotation.set(
      state.organ ? -0.35 : -0.53,
      state.organ ? 0.12 : 0.16,
      state.cell === 'ciliate' ? 0.07 : -0.13,
      'YXZ',
    );
    layout();
    schedule();
  }
  function layout() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    baseHeight = Math.max(
      size.y / 0.72,
      size.x / (aspect * (aspect < 0.95 ? 0.87 : 0.71)),
      size.z * 0.95,
      0.08,
    );
    camera.top = baseHeight / 2;
    camera.bottom = -camera.top;
    camera.right = camera.top * aspect;
    camera.left = -camera.right;
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    pivot.position.y = -baseHeight * (aspect < 0.95 ? 0.025 : 0.018);
    schedule();
  }
  function releaseHighlights() {
    for (const [mesh, mat] of highlight) {
      mesh.material.dispose();
      mesh.material = mat;
    }
    highlight.clear();
  }
  function apply() {
    releaseHighlights();
    model.traverse((o) => {
      if (!o.isMesh) return;
      const id = key(o);
      o.visible = (!state.part || id === state.part) && !state.hidden.has(id);
      if (id === state.selected && o.visible) {
        highlight.set(o, o.material);
        o.material = o.material.clone();
        o.material.emissive.setHex(0x685337);
        o.material.emissiveIntensity = 0.32;
      }
    });
    schedule();
  }
  function build(next, keepCamera = false) {
    const rotation = pivot.rotation.clone(),
      offset = stage.position.clone(),
      oldZoom = zoom;
    state = next;
    releaseHighlights();
    if (model) {
      stage.remove(model);
      AtlasModels.dispose(model);
    }
    model = state.organ
      ? AtlasModels.organ(state.organ, state.cut, true, state.cell)
      : AtlasModels.cell(state.cell, state.cut);
    stage.position.set(0, 0, 0);
    pivot.rotation.set(0, 0, 0);
    pivot.position.set(0, 0, 0);
    stage.add(model);
    scene.updateMatrixWorld(true);
    targets.clear();
    box.makeEmpty();
    model.traverse((o) => {
      if (!o.isMesh) return;
      const id = key(o);
      if (state.part && state.part !== id) return;
      const bounds = new T.Box3().setFromObject(o);
      box.union(bounds);
      if (!targets.has(id)) {
        const anchor = bounds.getCenter(new T.Vector3());
        if (o.isInstancedMesh) {
          const m = new T.Matrix4();
          o.getMatrixAt(0, m);
          anchor.setFromMatrixPosition(m).applyMatrix4(o.matrixWorld);
        }
        targets.set(id, anchor);
      }
    });
    if (box.isEmpty()) box.setFromCenterAndSize(new T.Vector3(), new T.Vector3(1, 1, 1));
    box.getSize(size);
    box.getCenter(centre);
    stage.position.copy(centre).negate();
    // Surface landmarks should point to the boundary, not to the centre of its bounding box.
    // Attach detail callouts to actual surface samples. Opposite sides separate the two envelope labels.
    if (state.organ) {
      const landmarks = {
        outerN: [-0.96, 0.18, 0.05],
        innerN: [0.92, 0.28, 0.06],
        pore: [0.7, 0.42, -0.13],
        lamina: [-0.72, -0.52, -0.2],
        chromatin: [0.48, -0.28, 0.04],
        outerM: [1.3, -0.17, 0.03],
        gap: [-1.26, -0.13, 0.02],
        innerM: [0.55, 0.43, -0.04],
        crista: [-0.35, 0.14, -0.14],
        matrix: [0.25, -0.27, 0.02],
        outerC: [-1.18, 0.31, 0.02],
        innerC: [1.19, 0.17, 0.03],
        stroma: [0.38, -0.38, -0.14],
        grana: [-0.79, -0.05, 0.14],
        lamella: [0.37, -0.03, 0.05],
      };
      const best = new Map(),
        p = new T.Vector3();
      model.traverse((o) => {
        const landmark = landmarks[o.userData.part];
        if (!landmark || !o.geometry) return;
        const goal = new T.Vector3(...landmark),
          pos = o.geometry.attributes.position;
        for (let j = 0; j < pos.count; j += 4) {
          p.fromBufferAttribute(pos, j).applyMatrix4(o.matrixWorld);
          const d = p.distanceToSquared(goal);
          if (d < (best.get(o.userData.part) ?? Infinity)) {
            best.set(o.userData.part, d);
            targets.set(o.userData.part, p.clone());
          }
        }
      });
    }
    if (!state.organ) targets.set('membrane', new T.Vector3(state.cell === 'plant' ? 3.3 : 3.18, 0.12, 0.12));
    if (!state.organ && state.cell === 'plant') targets.set('wall', new T.Vector3(-3.33, 0.24, 0.18));
    const closedSurface = [
      'nucleus',
      'mito',
      'chloro',
      'food',
      'vacuole',
      'peroxi',
      'lyso',
      'vesicle',
      'macro',
      'micro',
    ];
    renderer.clippingPlanes =
      state.cut && state.organ && !closedSurface.includes(state.organ) ? [cutPlane] : [];
    localPlane.constant = centre.z + size.z * 0.22;
    reset();
    if (keepCamera) {
      pivot.rotation.copy(rotation);
      zoom = oldZoom;
      stage.position.copy(offset);
      layout();
    }
    apply();
    makeLabels();
  }
  function makeLabels() {
    labels.replaceChildren();
    if (!state.labels || state.part) return;
    let ids = state.organ
      ? state.entries
      : {
          animal: ['nucleus', 'mito', 'golgi', 'membrane', 'rough'],
          plant: ['wall', 'chloro', 'nucleus', 'vacuole'],
          ciliate: ['macro', 'food', 'contractile', 'cilia'],
        }[state.cell];
    if (!state.cut) {
      if (!state.organ)
        ids =
          state.cell === 'plant' ? ['wall'] : state.cell === 'ciliate' ? ['membrane', 'cilia'] : ['membrane'];
      else if (
        [
          'nucleus',
          'mito',
          'chloro',
          'macro',
          'micro',
          'lyso',
          'peroxi',
          'food',
          'vesicle',
          'vacuole',
        ].includes(state.organ)
      )
        ids = state.entries.slice(0, 1);
    }
    if (state.selected && state.cut) ids = [state.selected, ...ids.filter((i) => i !== state.selected)];
    for (const id of ids) {
      if (!targets.has(id) || state.hidden.has(id)) continue;
      const line = document.createElement('div');
      line.className = 'leader';
      const label = document.createElement('button');
      label.className = 'label' + (state.selected === id ? ' selected' : '');
      label.dataset.id = id;
      const dot = document.createElement('i');
      dot.className = 'swatch';
      dot.style.background = AtlasData.organs[state.organ || id][1];
      label.append(dot, document.createTextNode((state.organ ? AtlasData.parts : AtlasData.organs)[id][0]));
      label.onclick = () => handlers.select(id);
      labels.append(line, label);
    }
    schedule();
  }
  function draw() {
    frame = 0;
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (renderer.clippingPlanes.length) {
      stage.updateWorldMatrix(true, false);
      cutPlane.copy(localPlane).applyMatrix4(stage.matrixWorld);
    }
    renderer.render(scene, camera);
    const spots = [[], []],
      buttons = [...labels.querySelectorAll('button')];
    for (const el of buttons) {
      const p = stage.localToWorld(targets.get(el.dataset.id).clone()).project(camera);
      const x = ((p.x + 1) * w) / 2,
        y = ((1 - p.y) * h) / 2;
      const side = x < w * 0.5 ? 0 : 1;
      spots[side].push({ el, x, y });
    }
    for (const [side, list] of spots.entries()) {
      const step = 48,
        top = Math.min(145, h * 0.27),
        bottom = h - (w < 760 ? 144 : 84);
      let previous = top - step;
      list.sort((a, b) => a.y - b.y);
      list.forEach(({ el, x, y }, i) => {
        const visible =
          x > 0 && x < w && y > 0 && y < h && i < Math.max(1, Math.floor((bottom - top) / step) + 1);
        const line = el.previousElementSibling;
        el.hidden = line.hidden = !visible;
        if (!visible) return;
        const labelY = Math.max(previous + step, Math.min(y - 11, bottom - (list.length - i - 1) * step));
        previous = labelY;
        const left = side
          ? Math.min(w - el.offsetWidth - 12, Math.max(w * 0.79, x + 30))
          : Math.max(12, Math.min(w * 0.19 - el.offsetWidth, x - el.offsetWidth - 32));
        el.style.left = left + 'px';
        el.style.top = labelY - el.offsetHeight / 2 + 'px';
        const dx = (side ? left : left + el.offsetWidth) - x,
          dy = labelY - y;
        line.style.cssText =
          'left:' +
          x +
          'px;top:' +
          y +
          'px;width:' +
          Math.hypot(dx, dy) +
          'px;transform:rotate(' +
          Math.atan2(dy, dx) +
          'rad)';
      });
    }
    handlers.magnify(zoom);
    canvas.dataset.renderer = 'webgl2';
    canvas.dataset.drawCalls = renderer.info.render.calls;
  }
  function changeZoom(f, allowLevel = false) {
    const next = zoom * f;
    if (
      allowLevel &&
      state.auto &&
      ((next > 2.6 && zoom >= 2.48) || (next < 0.61 && zoom <= 0.64)) &&
      handlers.level(next > 1)
    )
      return;
    zoom = Math.min(3.5, Math.max(0.5, next));
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    schedule();
  }
  function pick(x, y) {
    const rect = canvas.getBoundingClientRect();
    ray.setFromCamera(
      new T.Vector2((2 * (x - rect.left)) / rect.width - 1, 1 - (2 * (y - rect.top)) / rect.height),
      camera,
    );
    const hit = ray
      .intersectObject(model, true)
      .find(
        (h) =>
          h.object.visible &&
          h.object.material.opacity > 0.22 &&
          (!renderer.clippingPlanes.length || cutPlane.distanceToPoint(h.point) >= 0),
      );
    if (hit) handlers.select(key(hit.object));
  }
  function span() {
    const [a, b] = pointers.values();
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  canvas.onpointerdown = (e) => {
    if (!pointers.size) {
      dragged = false;
      pinched = false;
    }
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    if (pointers.size > 1) pinched = true;
  };
  canvas.onpointermove = (e) => {
    const point = pointers.get(e.pointerId);
    if (!point) return;
    const before = pointers.size === 2 ? span() : 0,
      dx = e.clientX - point.x,
      dy = e.clientY - point.y;
    point.x = e.clientX;
    point.y = e.clientY;
    if (Math.hypot(point.x - point.sx, point.y - point.sy) > 5) dragged = true;
    if (before > 1) changeZoom(span() / before, true);
    else if (!pinched && dragged) {
      pivot.rotation.y += dx * 0.008;
      pivot.rotation.x += dy * 0.008;
      schedule();
    }
  };
  canvas.onpointerup = (e) => {
    if (pointers.has(e.pointerId) && !pinched && !dragged) pick(e.clientX, e.clientY);
    pointers.delete(e.pointerId);
  };
  canvas.onpointercancel = canvas.onlostpointercapture = (e) => pointers.delete(e.pointerId);
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      changeZoom(Math.exp(-Math.max(-150, Math.min(150, e.deltaY * (e.deltaMode ? 16 : 1))) * 0.002), true);
    },
    { passive: false },
  );
  canvas.onkeydown = (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      pivot.rotation[e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? 'y' : 'x'] += [
        'ArrowLeft',
        'ArrowUp',
      ].includes(e.key)
        ? -0.14
        : 0.14;
      schedule();
    }
    if (['+', '=', '-'].includes(e.key)) {
      e.preventDefault();
      changeZoom(e.key === '-' ? 1 / 1.16 : 1.16, true);
    }
    if (e.key === 'Home') reset();
  };
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    handlers.lost();
  });
  canvas.addEventListener('webglcontextrestored', () => location.reload());
  new ResizeObserver(layout).observe(canvas);
  return {
    build,
    focus(id) {
      const p = targets.get(id);
      if (p) {
        stage.position.copy(p).negate();
        zoom = 1.85;
        layout();
      }
    },
    update(next) {
      state = next;
      apply();
      makeLabels();
    },
    reset,
    changeZoom,
  };
}
