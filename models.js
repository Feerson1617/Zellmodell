// Procedural specimen geometry; local +Z faces the section opening.
const AtlasModels = (() => {
  const T = THREE,
    tau = Math.PI * 2;
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const materials = new Map();
  const sphere = new T.SphereGeometry(1, 40, 28);
  const bead = new T.SphereGeometry(1, 10, 8);
  function material(color, opacity = 1) {
    const key = color + ':' + opacity;
    if (!materials.has(key)) {
      const m = new T.MeshStandardMaterial({
        color,
        side: T.DoubleSide,
        roughness: 0.69,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity === 1,
      });
      // Fine deterministic surface relief. Object-space coordinates remain attached during rotation.
      m.onBeforeCompile = (shader) => {
        shader.vertexShader =
          'varying vec3 specimenCoord;\n' +
          shader.vertexShader.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\nspecimenCoord=position;',
          );
        shader.fragmentShader =
          'varying vec3 specimenCoord;\n' +
          shader.fragmentShader.replace(
            '#include <color_fragment>',
            `#include <color_fragment>
          vec3 p=specimenCoord*20.;
          float grain=sin(p.x*4.1+sin(p.y*2.4))*sin(p.y*5.3+p.z*2.)*sin(p.z*4.7+p.x);
          float strata=sin(p.y*1.4+sin(p.x*.65)+cos(p.z*.7));
          diffuseColor.rgb*=0.97+0.085*grain+0.045*strata;`,
          );
      };
      materials.set(key, m);
    }
    return materials.get(key);
  }
  function mesh(g, id, geometry, color, opacity = 1) {
    const o = new T.Mesh(geometry, material(color, opacity));
    o.userData.part = id;
    g.add(o);
    return o;
  }
  function ball(g, id, pos, size, color, opacity = 1) {
    const o = mesh(g, id, sphere, color, opacity);
    o.position.set(...pos);
    o.scale.set(...size);
    return o;
  }
  function beads(g, id, points, color) {
    if (!points.length) return;
    const o = new T.InstancedMesh(bead, material(color), points.length),
      temp = new T.Object3D();
    points.forEach(([x, y, z, r, h, d], i) => {
      temp.position.set(x, y, z);
      temp.scale.set(r, h ?? r, d ?? r);
      temp.updateMatrix();
      o.setMatrixAt(i, temp.matrix);
    });
    o.userData.part = id;
    g.add(o);
    return o;
  }
  function path(n, fn) {
    return Array.from({ length: n + 1 }, (_, i) => fn(i / n));
  }
  function tube(g, id, points, r, color, closed = false, sides = 8) {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => V(...p)),
      closed,
    );
    return mesh(g, id, new T.TubeGeometry(curve, Math.max(12, points.length * 2), r, sides, closed), color);
  }
  function surface(g, id, nu, nv, point, color, omit) {
    const pos = [],
      idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...point(i / nu, j / nv));
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        if (omit?.((i + 0.5) / nu, (j + 0.5) / nv)) continue;
        const k = j * (nu + 1) + i;
        idx.push(k, k + 1, k + nu + 2, k, k + nu + 2, k + nu + 1);
      }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return mesh(g, id, geo, color);
  }
  function shell(g, id, size, color, cut, warp = () => 1, squared = 1, omit) {
    const extent = cut ? 1.67 : Math.PI;
    const point = (u, v) => {
      const a = u * tau,
        b = v * extent,
        sp = (t) => Math.sign(t) * Math.abs(t) ** squared;
      const w = warp(a, b);
      return [
        sp(Math.cos(a) * Math.sin(b)) * size[0] * w,
        sp(Math.sin(a) * Math.sin(b)) * size[1] * w,
        -Math.cos(b) * size[2] * w,
      ];
    };
    surface(g, id, 100, 44, point, color, omit);
    if (cut) tube(g, id, path(100, (t) => point(t, 1)).slice(0, -1), Math.min(...size) * 0.034, color, true);
    return point;
  }
  function rng(seed) {
    return () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  }
  function loop(g, id, x, y, z, s, color) {
    tube(
      g,
      id,
      path(48, (t) => [
        x + s * (Math.cos(t * tau) + 0.26 * Math.sin(t * tau * 3)),
        y + s * 0.65 * Math.sin(t * tau),
        z + s * 0.25 * Math.sin(t * tau * 2),
      ]).slice(0, -1),
      s * 0.075,
      color,
      true,
    );
  }
  function nucleus(g, cut, detail, plant) {
    const pores = path(detail ? 33 : 17, (t) => {
      const z = 1.76 * t - 0.9,
        a = t * (detail ? 33 : 17) * 2.39996,
        r = Math.sqrt(1 - z * z);
      return V(r * Math.cos(a), r * Math.sin(a), z);
    });
    const omit = (u, v) => {
      const a = u * tau,
        b = v * (cut ? 1.67 : Math.PI),
        p = V(Math.sin(b) * Math.cos(a), Math.sin(b) * Math.sin(a), -Math.cos(b));
      return pores.some((q) => q.dot(p) > 0.995);
    };
    shell(g, 'outerN', [1.04, 1, 0.94], '#8d65a5', cut, undefined, 1, omit);
    shell(g, 'innerN', [0.98, 0.94, 0.88], '#d1a3d7', cut, undefined, 1, omit);
    for (const n of pores) {
      if (cut && n.z > 0.01) continue;
      const ring = mesh(g, 'pore', new T.TorusGeometry(0.1, 0.024, 8, 16), '#e9cfa8');
      ring.position.copy(n).multiply(V(1.04, 1, 0.94));
      ring.quaternion.setFromUnitVectors(V(0, 0, 1), n);
    }
    if (!plant) {
      // Selected arcs of the lamina on the nucleoplasmic side of the inner membrane.
      for (let k = 0; k < 12; k++) {
        const a = (k * tau) / 12;
        tube(
          g,
          'lamina',
          path(26, (t) => {
            const b = 0.21 + t * 1.32;
            return [0.957 * Math.sin(b) * Math.cos(a), 0.92 * Math.sin(b) * Math.sin(a), -0.86 * Math.cos(b)];
          }),
          0.009,
          '#9abfc1',
        );
      }
      for (const b of [0.6, 1.04, 1.46])
        tube(
          g,
          'lamina',
          path(48, (t) => [
            0.957 * Math.sin(b) * Math.cos(t * tau),
            0.92 * Math.sin(b) * Math.sin(t * tau),
            -0.86 * Math.cos(b),
          ]).slice(0, -1),
          0.01,
          '#9abfc1',
          true,
        );
    }
    ball(g, 'plasma', [0, 0, -0.2], [0.91, 0.87, 0.56], '#9d79a7', 0.23);
    const rand = rng(92);
    for (let h = 0; h < (detail ? 22 : 12); h++) {
      const a = h * 2.4,
        r = 0.4 + rand() * 0.43,
        phase = rand() * tau;
      tube(
        g,
        'chromatin',
        path(42, (t) => {
          const angle = a + t * 2.25,
            w = r + 0.055 * Math.sin(t * 25 + phase);
          return [
            w * Math.cos(angle),
            w * 0.93 * Math.sin(angle),
            -0.12 + 0.16 * Math.sin(t * 9 + phase) + 0.046 * Math.cos(t * 33),
          ];
        }),
        0.016 + rand() * 0.013,
        h % 3 ? '#b991c2' : '#e5b7d6',
      );
    }
    ball(g, 'nucleolus', [-0.12, 0.07, 0.12], [0.34, 0.31, 0.27], '#b26a9c');
    const specks = path(166, (t) => {
      const a = t * 166 * 2.4,
        z = t * 2 - 1,
        r = Math.sqrt(1 - z * z);
      return [
        -0.12 + r * 0.329 * Math.cos(a),
        0.07 + r * 0.302 * Math.sin(a),
        0.12 + z * 0.265,
        0.021 + 0.018 * rand(),
      ];
    });
    beads(g, 'nucleolus', specks, '#c38aac');
  }
  function mito(g, cut, detail, ciliate) {
    shell(g, 'outerM', [1.35, 0.59, 0.55], '#c88358', cut);
    shell(g, 'gap', [1.3, 0.55, 0.51], '#e8b17f', cut);
    const folds = 7;
    // One folded inner sheet. Both patches use identical boundary vertices.
    const at = (u, v) => {
      const x = -Math.cos(Math.PI * u),
        angle = v * (cut ? Math.PI : tau);
      const peak = Math.pow(0.5 + 0.5 * Math.cos(tau * folds * u + 0.38 * Math.cos(angle * 2)), 7);
      const radius = Math.sin(Math.PI * u) * (1 - 0.83 * peak * Math.pow(Math.abs(Math.sin(angle)), 0.48));
      const bend =
        Math.sin(Math.PI * u) ** 2 *
        (0.115 * Math.sin(angle * 1.7 + u * 6) + 0.055 * Math.cos(angle * 3 - u * 5));
      return [x * 1.25 + bend, radius * 0.49 * Math.cos(angle), -radius * 0.47 * Math.sin(angle)];
    };
    if (ciliate) {
      // Tubular invaginations characteristic of Paramecium. Their bases open onto the inner boundary.
      const roots = [];
      for (let i = 0; i < 27; i++) {
        const a = i * 2.39996,
          z = ((i + 0.5) / 27) * 1.8 - 0.94,
          r = Math.sqrt(1 - z * z);
        if (!cut || z < 0.01) roots.push(V(r * Math.cos(a), r * Math.sin(a), z));
      }
      const dims = V(1.24, 0.49, 0.45);
      shell(g, 'innerM', dims.toArray(), '#c88161', cut, undefined, 1, (u, v) => {
        const a = tau * u,
          b = v * (cut ? 1.67 : Math.PI),
          n = V(Math.sin(b) * Math.cos(a), Math.sin(b) * Math.sin(a), -Math.cos(b));
        return roots.some((r) => r.dot(n) > 0.996);
      });
      roots.forEach((n, i) => {
        const along = V(0, 1, 0).cross(n).normalize(),
          across = n.clone().cross(along);
        const morph = (u, t) => {
          const angle = u * tau,
            r = 0.092 * (1 - 0.19 * t) * Math.min(1, Math.sqrt((1 - t) * 9));
          return n
            .clone()
            .multiplyScalar(1 - 0.58 * t)
            .addScaledVector(along, 0.085 * Math.sin(t * 2.5 + i) * t + r * Math.cos(angle))
            .addScaledVector(across, r * Math.sin(angle))
            .multiply(dims)
            .toArray();
        };
        surface(g, 'crista', 16, 12, morph, '#e7a079');
        if (detail) {
          const point = morph(0, 0.67),
            normal = along.clone().multiply(dims).normalize();
          const head = V(...point)
            .addScaledVector(normal, 0.036)
            .toArray();
          tube(g, 'atp', [point, head], 0.009, '#edd49a');
          ball(g, 'atp', head, [0.021, 0.021, 0.021], '#efcf91');
        }
      });
    } else {
      const fold = (u) => Math.cos(tau * folds * u) > 0.28;
      surface(g, 'innerM', 168, 32, at, '#b56651', (u) => fold(u));
      surface(g, 'crista', 168, 32, at, '#eb9872', (u) => !fold(u));
    }
    ball(g, 'matrix', [0, 0, -0.085], [1.18, 0.44, 0.27], '#eaa777', 0.13);
    loop(g, 'mtDNA', -0.64, -0.1, 0.015, 0.108, '#ba92c0');
    beads(
      g,
      'mtRibo',
      path(12, (t) => [0.82 * Math.cos(t * 26), 0.3 * Math.sin(t * 32), 0.012, 0.022]),
      '#9f93b6',
    );
    for (let j = 1; !ciliate && j < folds; j++)
      for (let k = 0; k < (detail ? 5 : 2); k++) {
        const v = 0.32 + k * 0.075,
          p = at(j / folds, v),
          q = [p[0], p[1] * 0.86, p[2] + 0.045];
        tube(g, 'atp', [p, q], 0.009, '#edd49a');
        ball(g, 'atp', q, [0.022, 0.022, 0.023], '#f2d69c');
      }
  }
  function chloro(g, cut) {
    shell(g, 'outerC', [1.32, 0.73, 0.56], '#6d9363', cut);
    shell(g, 'innerC', [1.25, 0.66, 0.5], '#b2c688', cut);
    ball(g, 'stroma', [0, 0, -0.18], [1.19, 0.61, 0.32], '#b5c996', 0.32);
    const stacks = [
      [-0.79, -0.05],
      [-0.35, 0.18],
      [0.12, -0.14],
      [0.59, 0.15],
      [0.86, -0.11],
    ];
    stacks.forEach(([x, y], i) => {
      for (let j = 0; j < 6; j++)
        ball(
          g,
          'grana',
          [x, y + (j - 2.5) * 0.059, 0.025],
          [0.23, 0.043, 0.21],
          j % 2 ? '#749956' : '#597f48',
        );
      if (i) {
        const [px, py] = stacks[i - 1];
        const sheet = ball(g, 'lamella', [(x + px) / 2, (y + py) / 2, 0.022], [0.3, 0.026, 0.11], '#8aab65');
        sheet.rotation.z = Math.atan2(y - py, x - px);
      }
    });
    loop(g, 'ptDNA', -0.22, -0.4, 0.03, 0.102, '#ded3a4');
    beads(
      g,
      'ptRibo',
      path(12, (t) => [0.74 * Math.cos(t * 23), 0.48 * Math.sin(t * 19), -0.035, 0.022]),
      '#c5ab76',
    );
  }
  function cisternae(g, id, rough) {
    const rand = rng(512),
      dots = [];
    for (let k = 0; k < 5; k++) {
      const point = (u, v) => {
        if (rough) {
          const a = -2.3 + u * 3.75,
            r = 0.74 + 0.145 * k + 0.052 * Math.sin(u * 14 + k * 0.45) + 0.045 * Math.cos(v * tau);
          return [
            r * Math.cos(a),
            r * Math.sin(a),
            0.115 * Math.sin(v * tau) + 0.032 * k + 0.055 * Math.sin(15 * u + k),
          ];
        }
        const a = tau * u,
          b = v * Math.PI;
        const x = Math.sin(b) * Math.cos(a);
        return [
          x * (0.9 - k * 0.028),
          0.14 * x * x + 0.07 * Math.sin(3.6 * x + k * 0.3) + (k - 2) * 0.175 + 0.04 * Math.cos(b),
          0.39 * Math.sin(b) * Math.sin(a),
        ];
      };
      surface(
        g,
        'cisterna',
        52,
        16,
        point,
        rough ? ['#798fae', '#98aabe'][k % 2] : ['#d39770', '#e0a67c'][k % 2],
      );
      if (rough)
        for (let j = 0; j < 32; j++) {
          const p = point(rand(), 0.15 + rand() * 0.26);
          dots.push([...p, 0.027]);
        }
    }
    if (rough) beads(g, 'bound', dots, '#d7c4b9');
    else
      beads(
        g,
        'bud',
        path(10, (t) => [
          0.93 * Math.cos(t * 24),
          0.22 * Math.sin(t * 14),
          0.39 * Math.sin(t * 24),
          0.052 + 0.025 * rand(),
        ]),
        '#dba583',
      );
  }
  function lattice(g, id) {
    for (let j = 0; j < 6; j++) {
      const f = (t) => [
        t * 1.65 - 0.82,
        (j - 2.5) * 0.14 + 0.11 * Math.sin(t * 7 + j * 0.7),
        0.1 * Math.sin(t * 8 + j),
      ];
      tube(g, id, path(18, f), 0.051, '#75ab9d');
      if (j < 5) {
        const a = 0.19 + (j % 3) * 0.23,
          p = f(a);
        tube(
          g,
          id,
          [
            p,
            [p[0] + 0.08, p[1] + 0.09, p[2] + 0.01],
            [
              p[0] + 0.16,
              (j - 1.5) * 0.14 + 0.11 * Math.sin((a + 0.1) * 7 + (j + 1) * 0.7),
              0.1 * Math.sin((a + 0.1) * 8 + j + 1),
            ],
          ],
          0.045,
          '#75ab9d',
        );
      }
    }
  }
  function organ(id, cut = true, detail = false, cellType = 'animal') {
    const g = new T.Group(),
      color = AtlasData.organs[id][1];
    g.userData.organ = id;
    switch (id) {
      case 'nucleus':
        nucleus(g, cut, detail, cellType === 'plant');
        break;
      case 'mito':
        mito(g, cut, detail, cellType === 'ciliate');
        break;
      case 'chloro':
        chloro(g, cut);
        break;
      case 'rough':
      case 'golgi':
        cisternae(g, id, id === 'rough');
        break;
      case 'smooth':
        lattice(g, 'tubule');
        break;
      case 'centrosome':
        for (let k = 0; k < 2; k++) {
          const sub = new T.Group();
          g.add(sub);
          sub.rotation.z = (k * Math.PI) / 2;
          sub.position.set(k * 0.42, k * 0.46, 0);
          for (let j = 0; j < 9; j++) {
            const x = 0.2 * Math.cos((j * tau) / 9),
              z = 0.2 * Math.sin((j * tau) / 9);
            tube(
              sub,
              'centriole',
              [
                [x, -0.42, z],
                [x, 0.42, z],
              ],
              0.05,
              color,
            );
          }
        }
        break;
      case 'oral':
        surface(
          g,
          'groove',
          36,
          16,
          (u, v) => {
            const w = v * 2 - 1;
            return [
              (u - 0.5) * 1.85,
              w * 0.22 * (0.95 - 0.55 * u) + 0.11 * Math.sin(u * 4),
              0.15 * w * w - 0.12 * u,
            ];
          },
          '#789d9a',
        );
        for (let j = 0; j < 25; j++) {
          const u = j / 25;
          for (const sign of [-1, 1]) {
            const x = (u - 0.5) * 1.85,
              y = sign * 0.22 * (0.95 - 0.55 * u) + 0.11 * Math.sin(u * 4);
            tube(
              g,
              'groove',
              [
                [x, y, 0.15 - 0.12 * u],
                [x + 0.045, y - sign * 0.048, 0.22 - 0.12 * u],
              ],
              0.013,
              '#b0cac0',
            );
          }
        }
        break;
      case 'cilia':
      case 'skeleton':
      case 'wall': {
        const part = { cilia: 'shaft', skeleton: 'filament', wall: 'fibre' }[id],
          count = 9;
        for (let j = 0; j < count; j++)
          tube(
            g,
            part,
            path(20, (t) => [
              t * 1.8 - 0.9,
              0.18 * Math.sin(t * 5 + j * 0.4) + (j - (count - 1) / 2) * 0.07,
              0.15 * Math.cos(t * 3 + j * 0.4),
            ]),
            id === 'cilia' ? 0.018 : 0.036,
            color,
          );
        break;
      }
      case 'ribo':
        ball(g, 'large', [0, 0.1, 0], [0.52, 0.37, 0.43], color);
        ball(g, 'small', [0.08, -0.2, 0.06], [0.42, 0.24, 0.35], '#ca9471');
        break;
      case 'macro':
      case 'micro':
        shell(g, 'envelope', [1, 0.68, 0.57], color, cut);
        shell(g, 'envelope', [0.96, 0.64, 0.53], '#bc9ac8', cut);
        for (let j = 0; j < 9; j++)
          loop(g, 'chromatin', Math.cos(j * 2.4) * 0.49, Math.sin(j * 2.4) * 0.28, -0.04, 0.18, '#b58dab');
        break;
      case 'membrane':
        for (let row = -1; row <= 1; row += 2) {
          for (let x = -5; x < 6; x++)
            for (let y = -3; y < 4; y++) {
              const p = [x * 0.115, y * 0.115, row * 0.12];
              ball(g, 'lipid', p, [0.061, 0.061, 0.054], color);
              tube(g, 'lipid', [p, [p[0] + 0.02, p[1], row * 0.01]], 0.025, '#96a785');
            }
        }
        ball(g, 'protein', [0.16, 0.05, 0], [0.13, 0.13, 0.21], '#aa8bb4');
        break;
      case 'cytosol':
        ball(g, 'fluid', [0, 0, 0], [1, 0.63, 0.4], color, 0.7);
        break;
      case 'contractile':
        ball(g, 'reservoir', [0, 0, 0], [0.41, 0.36, 0.29], color, 0.8);
        for (let j = 0; j < 8; j++) {
          const a = (j * tau) / 8;
          tube(
            g,
            'canals',
            path(12, (t) => [
              (0.31 + t * 0.49) * Math.cos(a + t * 0.12),
              (0.29 + t * 0.47) * Math.sin(a + t * 0.12),
              -0.05 * t,
            ]),
            0.032,
            color,
          );
        }
        break;
      default: {
        const vac = id === 'vacuole',
          part = vac ? 'tonoplast' : 'boundary',
          inside = vac ? 'sap' : ['lyso', 'peroxi'].includes(id) ? 'enzymes' : 'cargo';
        shell(g, part, [1, 0.87, 0.78], color, cut);
        if (vac) ball(g, inside, [0, 0, -0.1], [0.96, 0.8, 0.65], '#7baeb8', 0.58);
        else
          beads(
            g,
            inside,
            path(22, (t) => [
              0.67 * Math.cos(t * 51) * Math.sqrt(t),
              0.65 * Math.sin(t * 51) * Math.sqrt(t),
              0.15 * Math.sin(t * 22) - 0.14,
              0.12 + 0.04 * Math.cos(t * 15),
            ]),
            color,
          );
      }
    }
    return g;
  }
  function cell(type, cut) {
    const g = new T.Group(),
      plant = type === 'plant',
      animal = type === 'animal',
      rand = rng(943);
    const size = plant ? [3.25, 2.07, 1.63] : animal ? [3.14, 2.11, 1.71] : [3.24, 1.36, 1.22];
    const warp = (a, b) =>
      1 +
      Math.sin(b) ** 2 *
        (0.049 * Math.cos(3 * a + 0.5) + 0.052 * Math.sin(2 * a - 0.4) + 0.018 * Math.sin(6 * a));
    function group(id) {
      const sub = new T.Group();
      sub.userData.organ = id;
      g.add(sub);
      return sub;
    }
    const shape = plant ? 0.59 : 1;
    if (plant)
      shell(
        group('wall'),
        'fibre',
        size.map((x) => x * 1.047),
        '#9db58b',
        cut,
        warp,
        shape,
      );
    const skin = group('membrane');
    const boundary = shell(skin, 'lipid', size, plant ? '#83ab80' : '#74a99e', cut, warp, shape);
    if (cut) {
      const lip = path(140, (t) => boundary(t, 1)).slice(0, -1);
      tube(
        skin,
        'lipid',
        lip.map(([x, y, z]) => [x * 0.987, y * 0.987, z + 0.014]),
        0.026,
        '#bdccb1',
        true,
      );
    }
    const cyto = group('cytosol');
    const floor = (u, v) => {
      const p = boundary(u, 1);
      return [
        p[0] * v * 0.985,
        p[1] * v * 0.985,
        -0.45 + 0.56 * v * v + 0.018 * Math.sin(13 * u * tau + v * 4) * v,
      ];
    };
    const plane = surface(cyto, 'fluid', 110, 54, floor, animal ? '#628c82' : plant ? '#8daa8c' : '#8aaba0');
    const vertexColors = [],
      positions = plane.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i);
      const variation =
        0.88 + 0.11 * Math.sin(x * 8 + Math.sin(y * 9)) * 0.52 + 0.09 * Math.sin(y * 19 + x * 8);
      vertexColors.push(variation, variation, variation);
    }
    plane.geometry.setAttribute('color', new T.Float32BufferAttribute(vertexColors, 3));
    plane.material = plane.material.clone();
    plane.material.vertexColors = true;
    plane.userData.ownMaterial = true;
    const set = (id, pos, s, rz = 0, rx = 0) => {
      const o = organ(id, cut, false, type);
      o.position.set(...pos);
      o.scale.setScalar(s);
      o.rotation.set(rx, 0, rz);
      g.add(o);
      return o;
    };
    // Each internal instance retains its identity for selection in the whole cell.
    if (animal) {
      set('rough', [-0.55, 0.27, 0.06], 0.99, -1.7);
      set('nucleus', [-0.56, 0.3, 0.24], 0.78);
      set('mito', [-1.76, -0.76, 0.26], 0.59, -0.48);
      set('mito', [1.18, 1.05, 0.2], 0.59, -0.33);
      set('mito', [1.13, -1.08, 0.23], 0.52, 0.36);
      set('golgi', [1.36, -0.1, 0.14], 0.81, -0.4, 0.47);
      set('smooth', [-1.67, 0.92, 0.04], 0.72, 0.68);
      set('centrosome', [0.11, -0.97, 0.05], 0.55, -0.55);
      set('lyso', [-2.23, 0.04, 0.12], 0.27);
      set('lyso', [0.26, 1.31, 0.09], 0.21);
      set('peroxi', [2.34, 0.45, 0.11], 0.19);
      set('peroxi', [-0.84, -1.42, 0.11], 0.2);
      for (const [x, y, r] of [
        [2.01, -0.68, 0.14],
        [2.15, -0.43, 0.12],
        [1.8, -0.81, 0.09],
        [-1.13, 1.26, 0.13],
      ])
        set('vesicle', [x, y, 0.07], r);
      const filaments = group('skeleton');
      for (let j = 0; j < 14; j++) {
        const a = j * 2.4;
        tube(
          filaments,
          'filament',
          path(22, (t) => [
            0.1 + Math.cos(a) * t * 2.48 + 0.13 * Math.sin(t * 7 + j) * t,
            -0.9 * (1 - t) + 1.69 * Math.sin(a) * t,
            -0.31 + 0.32 * t,
          ]),
          0.009,
          '#9ac5b6',
        );
      }
    } else if (plant) {
      const vac = set('vacuole', [0.2, -0.1, -0.04], 1);
      vac.scale.set(1.86, 1.65, 0.88);
      set('nucleus', [-1.93, 0.42, 0.13], 0.58);
      set('rough', [-1.93, 0.42, 0.02], 0.74, -2.1);
      for (const [x, y, a] of [
        [-1.8, -1.14, -0.31],
        [1.71, 1.14, -0.47],
        [2.4, 0.02, 1.23],
        [-0.48, 1.52, 0.15],
      ])
        set('chloro', [x, y, 0.12], 0.59, a, -0.25);
      set('mito', [1.94, -1.27, 0.1], 0.46, 0.56);
      set('mito', [-2.32, 1.35, 0.12], 0.41, -0.1);
      set('golgi', [-0.34, -1.55, 0.11], 0.58, -0.14, 0.47);
      set('smooth', [0.68, 1.59, 0.12], 0.46);
    } else {
      set('macro', [-0.52, 0.13, 0.17], 0.72, -0.25);
      set('micro', [0.18, 0.44, 0.14], 0.24);
      for (const [x, y] of [
        [1.97, 0.33],
        [-2.02, -0.12],
      ])
        set('contractile', [x, y, 0.1], 0.77);
      for (const [x, y, s] of [
        [0.9, 0.65, 0.24],
        [-1.38, 0.42, 0.22],
        [-0.5, -0.75, 0.27],
        [1.28, -0.7, 0.18],
      ])
        set('food', [x, y, 0.1], s);
      set('mito', [-1.32, -0.53, 0.04], 0.33, 0.37);
      set('mito', [0.5, -0.31, 0.05], 0.31);
      set('oral', [0.7, -0.97, 0.1], 0.69, 0.24);
      const hairs = group('cilia');
      for (let j = 0; j < 210; j++) {
        const u = (j * 0.61803398875) % 1,
          v = Math.acos(1 - 2 * ((j + 0.5) / 210)) / (cut ? 1.67 : Math.PI);
        if (v > 1) continue;
        const p = boundary(u, v),
          n = V(...p)
            .divide(V(...size.map((s) => s * s)))
            .normalize();
        tube(
          hairs,
          'shaft',
          path(4, (t) => [
            p[0] + n.x * t * 0.22 + 0.08 * t * t,
            p[1] + n.y * t * 0.22,
            p[2] + n.z * t * 0.22,
          ]),
          0.012,
          '#b6cdbc',
        );
      }
    }
    const dots = [];
    for (let i = 0; i < 550; i++) {
      const u = rand(),
        v = Math.sqrt(rand()) * 0.94,
        p = floor(u, v);
      if (plant && ((p[0] - 0.2) / 1.93) ** 2 + ((p[1] + 0.1) / 1.5) ** 2 < 1) continue;
      dots.push([p[0], p[1], p[2] + 0.018 + rand() * 0.068, 0.012 + rand() * 0.019]);
    }
    beads(cyto, 'fluid', dots, '#a4beaa');
    if (animal || plant) {
      const ribs = group('ribo');
      beads(
        ribs,
        'large',
        dots.filter((p, i) => i % 6 === 0).map(([x, y, z]) => [x, y, z + 0.045, 0.043, 0.035, 0.041]),
        '#dbbe95',
      );
    }
    return g;
  }
  return {
    cell,
    organ,
    dispose(g) {
      g.traverse((o) => {
        if (o.isInstancedMesh) o.dispose();
        if (o.userData.ownMaterial) o.material.dispose();
        if (o.geometry && o.geometry !== sphere && o.geometry !== bead) o.geometry.dispose();
      });
    },
  };
})();
