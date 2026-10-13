// REA hero 3D layer (ADR-0013 D4: an ENHANCEMENT mounted over the flat scene, never the page).
// A sealed box you cannot see into. A brass probe touches two faces: each lights and a labelled
// claim card rises with it. The third face is hatched red; the probe bounces off it, and its card
// says NOT SEEN. Same argument as the flat scene above, in space.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

function card(text, sub, color) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#FAF6EA'; g.strokeStyle = color; g.lineWidth = 8;
  g.beginPath(); g.roundRect(6, 6, 500, 148, 22); g.fill();
  if (color === '#C8402E') g.setLineDash([22, 14]);
  g.stroke(); g.setLineDash([]);
  g.fillStyle = '#2B2A28'; g.font = '600 35px IBM Plex Sans, Helvetica, Arial'; g.fillText(text, 28, 68);
  g.fillStyle = color === '#C8402E' ? '#C8402E' : '#47443E'; g.font = '700 25px IBM Plex Sans, Helvetica, Arial'; g.fillText(sub, 28, 116);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.625), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  m.visible = false; return m;
}

export async function mount(host, { label } = {}) {
  const w = host.clientWidth || 800, h = host.clientHeight || 300;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', label || 'A sealed box probed in two spots; a third face stays unknown');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const narrow = w < 560;
  const cam = new THREE.PerspectiveCamera(narrow ? 46 : 32, w / h, 0.1, 60);
  cam.position.set(0, 1.5, narrow ? 9.6 : 6.6); cam.lookAt(0, 0.35, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe6d9b4, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(3, 7, 5); scene.add(sun);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.8, 64), new THREE.MeshBasicMaterial({ color: 0x2b2a28, transparent: true, opacity: 0.10 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.72; scene.add(floor);

  const group = new THREE.Group(); scene.add(group);
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.5), new THREE.MeshStandardMaterial({ color: 0xf3ebd2, roughness: 0.9 }));
  group.add(box, new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: 0x2b2a28 })));

  // spots live on the FRONT (+z) and TOP (+y) faces; the sealed face is the front-left lower panel
  const spot = (x, y, z, c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0 })); m.position.set(x, y, z); group.add(m); return m; };
  const A = spot(0.6, 0.15, 0.76, 0x6fa3bd), B = spot(-0.2, 0.71, 0.1, 0x6fa3bd), U = spot(-0.7, -0.35, 0.76, 0xc8402e);
  const sealed = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.55), new THREE.MeshBasicMaterial({ color: 0xc8402e, transparent: true, opacity: 0.28 }));
  sealed.position.set(-0.7, -0.35, 0.755); group.add(sealed);

  const needle = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 12), new THREE.MeshStandardMaterial({ color: 0x8c6420, metalness: 0.5, roughness: 0.35 }));
  shaft.position.y = 0.75; const tip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), new THREE.MeshStandardMaterial({ color: 0xb5852f, emissive: 0xb5852f, emissiveIntensity: 0.4 }));
  needle.add(shaft, tip); scene.add(needle);

  const cA = card('Search ranks in two steps', 'Evidence: the spot it touched', '#2B2A28');
  const cB = card('Notes are stored locally', 'Evidence: the spot it touched', '#2B2A28');
  const cU = card('How it locks the data', 'NOT SEEN — no guessing', '#C8402E');
  cA.position.set(2.75, 0.55, 0.4); cB.position.set(-2.75, 1.05, 0.2); cU.position.set(-2.75, -0.45, 0.5);
  scene.add(cA, cB, cU);

  const mkLine = (from, to, color, dashed) => {
    const g = new THREE.BufferGeometry().setFromPoints([from, to]);
    const l = new THREE.Line(g, dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.09 }) : new THREE.LineBasicMaterial({ color }));
    if (dashed) l.computeLineDistances(); l.visible = false; scene.add(l); return l;
  };
  const world = (o) => o.getWorldPosition(new THREE.Vector3());
  let raf = 0; const t0 = performance.now(); let lines = null;
  const loop = (now) => {
    const t = ((now - t0) / 1000) % 10;
    group.rotation.y = Math.sin(now / 5200) * 0.28;
    group.updateMatrixWorld(true);
    const pa = world(A), pb = world(B), pu = world(U);
    if (!lines) lines = [mkLine(pa, cA.position, 0x2b2a28), mkLine(pb, cB.position, 0x2b2a28), mkLine(pu, cU.position, 0xc8402e, true)];
    [[0, pa, cA.position], [1, pb, cB.position], [2, pu, cU.position]].forEach(([i, p, q]) => {
      const a = lines[i].geometry.attributes.position; a.setXYZ(0, p.x, p.y, p.z); a.setXYZ(1, q.x, q.y, q.z); a.needsUpdate = true;
      if (i === 2) lines[i].computeLineDistances();
    });
    const on = (s, e) => t >= s && t < e;
    A.material.emissiveIntensity = on(1.4, 9) ? 1.2 : 0; lines[0].visible = cA.visible = on(2.2, 9);
    B.material.emissiveIntensity = on(3.8, 9) ? 1.2 : 0; lines[1].visible = cB.visible = on(5.0, 9);
    U.material.emissiveIntensity = on(6.6, 9) ? 0.5 + 0.5 * Math.sin(now / 160) : 0; lines[2].visible = cU.visible = on(7.2, 9);
    [cA, cB, cU].forEach((c) => c.lookAt(cam.position));
    const target = t < 3.6 ? pa : t < 6.2 ? pb : pu;
    const bounce = on(6.2, 8.4) ? Math.abs(Math.sin((t - 6.2) * 5)) * 0.18 : 0;
    needle.position.set(target.x + 0.5 + bounce, target.y + 0.5 + bounce, target.z + 0.45 + bounce);
    needle.lookAt(target); needle.rotateX(Math.PI / 2);
    renderer.render(scene, cam);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(loop); });
  return { stop: () => cancelAnimationFrame(raf) };
}
