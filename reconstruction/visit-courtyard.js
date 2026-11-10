import * as THREE from "three";

// The courtyard surface is an illustrative study layer, not a measured survey.
// Kept separate from the hall mesh and GLB export.
export function createVisitCourtyard(scene) {
  const group = new THREE.Group();
  group.name = "visitor-courtyard-illustrative-not-surveyed";
  group.visible = false;
  scene.add(group);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(23, 32),
    new THREE.MeshStandardMaterial({ color: 0xd9ddd6, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0.008, 19.5);
  ground.receiveShadow = true;
  group.add(ground);

  const stone = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.055, 1),
    new THREE.MeshStandardMaterial({ color: 0xf1f2ed, roughness: 0.98, metalness: 0 }),
    7 * 19
  );
  stone.name = "walking-pavers-illustrative";
  const dummy = new THREE.Object3D();
  const colors = [0xbfc5be, 0xc7ccc6, 0xb4bcb5, 0xcad0ca, 0xadb5af, 0xc2c8c2];
  let n = 0;
  for (let row = 0; row < 19; row++) {
    for (let col = 0; col < 7; col++) {
      const seed = (row * 43 + col * 61) % 97;
      const x = (col - 3) * 1.13 + (row % 2 ? 0.1 : -0.1);
      const z = 8.1 + row * 1.21;
      dummy.position.set(x, 0.056 + (seed % 3) * 0.001, z);
      dummy.rotation.set(0, (seed % 5 - 2) * 0.003, 0);
      dummy.scale.set(1.02 + seed % 3 * 0.02, 1, 1.12 + seed % 4 * 0.013);
      dummy.updateMatrix();
      stone.setMatrixAt(n, dummy.matrix);
      stone.setColorAt(n, new THREE.Color(colors[seed % colors.length]));
      n++;
    }
  }
  stone.instanceMatrix.needsUpdate = true;
  stone.instanceColor.needsUpdate = true;
  stone.receiveShadow = true;
  group.add(stone);

  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = textureCanvas.height = 96;
  const ctx = textureCanvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 96, 96);
    ctx.strokeStyle = "rgba(148,91,63,0.85)";
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(48,48,20,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle = "rgba(148,91,63,0.26)";
    ctx.beginPath(); ctx.arc(48,48,31,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = "rgba(148,91,63,0.65)";
    ctx.beginPath();ctx.arc(48,48,2.5,0,Math.PI*2);ctx.fill();
  }
  const traceTexture = new THREE.CanvasTexture(textureCanvas);
  const traces = new Map();
  const targets = { dougong: [1.25, 6.34, 6.74], roof: [0, 9, 4.0], ginkgo: [13.8, 2.1, -7] };

  function leaveTrace(id, part = "dougong", now = performance.now(), seconds = 85) {
    if (typeof id !== "string" || !targets[part]) return false;
    if (traces.has(id)) {
      const old = traces.get(id);
      group.remove(old.sprite);
      old.sprite.material.dispose();
    }
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: traceTexture, transparent: true, opacity: 0.68,
      depthWrite: false, depthTest: true, sizeAttenuation: true
    }));
    sprite.position.set(...targets[part]);
    sprite.scale.set(1.04, 1.04, 1);
    group.add(sprite);
    traces.set(id, { sprite, start: now, end: now + Math.min(seconds, 90) * 1000, part });
    return true;
  }
  function tick(now) {
    for (const [id, item] of traces) {
      const remaining = (item.end - now) / (item.end - item.start);
      if (remaining <= 0) {
        group.remove(item.sprite);
        item.sprite.material.dispose();
        traces.delete(id);
      } else {
        item.sprite.material.opacity = 0.62 * Math.min(1, remaining * 2);
        const pulse = 1 + Math.sin(now / 800 + item.start) * 0.04;
        item.sprite.scale.setScalar(pulse * 1.04);
      }
    }
  }
  return {
    setVisible(value) { group.visible = Boolean(value); },
    leaveTrace,
    tick,
    getTraceCount() { return traces.size; },
    dispose() { for (const item of traces.values()) item.sprite.material.dispose(); traceTexture.dispose(); }
  };
}
