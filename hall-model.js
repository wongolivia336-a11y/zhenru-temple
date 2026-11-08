import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { populateDougongStudy, addRoofTileStudy } from "./model-fidelity.js";

const CAMERA_HOME = new THREE.Vector3(19, 13.5, 22);
const TARGET_HOME = new THREE.Vector3(0, 4.6, 0);
const POST_X = [-6.7, -3.05, 3.05, 6.7];
const POST_Z = [-6.5, -3.9, 1.2, 6.5];

export function createHallScene({ canvas, frame, pins, onPart, onReady }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e9e2d5");
  scene.fog = new THREE.Fog("#e9e2d5", 44, 88);

  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 120);
  camera.position.copy(CAMERA_HOME);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(TARGET_HOME);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.minDistance = 0.75;
  controls.maxDistance = 42;
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.rotateSpeed = 0.68;
  controls.zoomSpeed = 0.82;
  controls.panSpeed = 0.74;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xf2eadb, 0x6b6659, 1.85));
  const keyLight = new THREE.DirectionalLight(0xffedcf, 3.0);
  keyLight.position.set(-13, 22, 15);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -22;
  keyLight.shadow.camera.right = 22;
  keyLight.shadow.camera.top = 22;
  keyLight.shadow.camera.bottom = -22;
  keyLight.shadow.bias = -0.00028;
  keyLight.shadow.normalBias = 0.035;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x9cae9d, 0.95);
  fillLight.position.set(12, 10, -15);
  scene.add(fillLight);
  const warmInterior = new THREE.PointLight(0xd9a66c, 8, 16, 1.8);
  warmInterior.position.set(0, 4.2, -0.8);
  scene.add(warmInterior);

  const mats = {
    stone: new THREE.MeshStandardMaterial({ color: 0x938d7f, roughness: 0.94 }),
    stoneLight: new THREE.MeshStandardMaterial({ color: 0xc9bea8, roughness: 0.9 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: 0x716d62, roughness: 0.96 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x503724, roughness: 0.86 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0x80603d, roughness: 0.82 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x30251d, roughness: 0.92 }),
    woodEdge: new THREE.MeshStandardMaterial({ color: 0x9a7548, roughness: 0.78 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xcbbfa8, roughness: 0.95 }),
    wallShadow: new THREE.MeshStandardMaterial({ color: 0x9d9079, roughness: 0.96 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x494a42, roughness: 0.9, side: THREE.DoubleSide }),
    roofSide: new THREE.MeshStandardMaterial({ color: 0x3b4039, roughness: 0.92, side: THREE.DoubleSide }),
    roofSun: new THREE.MeshStandardMaterial({ color: 0x5a584c, roughness: 0.88, side: THREE.DoubleSide }),
    roofTile: new THREE.LineBasicMaterial({ color: 0xaaa081, transparent: true, opacity: 0.86 }),
    roofRib: new THREE.LineBasicMaterial({ color: 0x393e36, transparent: true, opacity: 0.9 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xa98b59, roughness: 0.68, metalness: 0.12 }),
    ground: new THREE.MeshStandardMaterial({ color: 0xd5cebf, roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x35342e, roughness: 0.52, metalness: 0.02 })
  };

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), mats.ground);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.035;
  floor.receiveShadow = true;
  scene.add(floor);
  addCourtyardLines(scene);

  const hall = new THREE.Group();
  hall.name = "ZhenruMainHallStudy";
  hall.userData.part = "frame";
  scene.add(hall);
  const baseGroup = new THREE.Group();
  baseGroup.name = "stone-platform-and-plinth";
  baseGroup.userData.part = "base";
  hall.add(baseGroup);
  const frameGroup = new THREE.Group();
  frameGroup.name = "timber-frame";
  frameGroup.userData.part = "frame";
  hall.add(frameGroup);
  const columnGroup = new THREE.Group();
  columnGroup.name = "sixteen-column-grid";
  columnGroup.userData.part = "columns";
  frameGroup.add(columnGroup);
  const roofGroup = new THREE.Group();
  roofGroup.name = "single-eave-roof";
  roofGroup.userData.part = "roof";
  hall.add(roofGroup);
  const extraRoofGroup = new THREE.Group();
  extraRoofGroup.name = "Qing-period-added-eave-study";
  extraRoofGroup.userData.part = "roof";
  extraRoofGroup.visible = false;
  hall.add(extraRoofGroup);
  const qingExtensionGroup = new THREE.Group();
  qingExtensionGroup.name = "Qing-period-five-bay-outline-study";
  qingExtensionGroup.userData.part = "frame";
  qingExtensionGroup.visible = false;
  hall.add(qingExtensionGroup);

  buildStoneBase(baseGroup, mats);
  buildColumnsAndFrame(frameGroup, columnGroup, mats);
  // Current front elevation shows the long ridge across the facade; rotate the old frame-study roof axis.
  const roofFrameStudy = new THREE.Group();
  roofFrameStudy.name = "roof-framing-axis-study";
  roofFrameStudy.rotation.y = Math.PI * 0.5;
  roofFrameStudy.userData.part = "frame";
  frameGroup.add(roofFrameStudy);
  buildGableAndRafters(roofFrameStudy, mats);
  // Rotate main roof ridge from the schematic depth axis to the facade-parallel x axis.
  roofGroup.rotation.y = Math.PI * 0.5;
  const mainRoofSkin = buildRoof(roofGroup, {
    width: 17.25, depth: 16.8, baseY: 6.72, ridgeY: 9.55, ridgeHalf: 6.0, mats, style: "main"
  });
  const extraRoofSkin = buildLowerEave(extraRoofGroup, mats);
  buildInteriorHint(hall, mats);
  buildQingExtension(qingExtensionGroup, mats);

  const pinAnchors = {
    roof: new THREE.Vector3(7.55, 7.15, 7.35),
    frame: new THREE.Vector3(5.9, 6.25, 6.42),
    dougong: new THREE.Vector3(6.7, 6.3, 6.5),
    door: new THREE.Vector3(0, 3.25, 6.5),
    columns: new THREE.Vector3(3.05, 3.15, 1.2),
    base: new THREE.Vector3(6.45, 0.64, 7.1)
  };
  const moving = new Set();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const interactiveGroups = [baseGroup, frameGroup, roofGroup, extraRoofGroup, qingExtensionGroup];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeView = "outside";
  let exploded = false;
  let frameMode = false;
  let cutaway = false;
  let currentStage = 0;
  let cameraTween = null;
  let disposed = false;
  let readyCalled = false;
  let raf = 0;
  let lastTime = performance.now();

  function setStage(stage) {
    currentStage = stage;
    extraRoofGroup.visible = stage === 1;
    extraRoofGroup.position.y = stage === 1 && exploded ? 1.37 : 0;
    extraRoofGroup.scale.x = stage === 1 ? 1.15 : 1;
    roofGroup.scale.x = 1;
    qingExtensionGroup.visible = stage === 1;
    extraRoofSkin.visible = !frameMode;
  }

  function moveCamera(position, target, nextView) {
    cameraTween = {
      startTime: performance.now(),
      duration: reducedMotion ? 1 : 850,
      fromPosition: camera.position.clone(),
      toPosition: position.clone(),
      fromTarget: controls.target.clone(),
      toTarget: target.clone()
    };
    activeView = nextView;
    if (nextView === "top") {
      camera.up.set(0, 0, -1);
      controls.maxPolarAngle = Math.PI;
      controls.minPolarAngle = 0.04;
    } else {
      camera.up.set(0, 1, 0);
      controls.maxPolarAngle = nextView === "inside" ? Math.PI * 0.88 : Math.PI * 0.495;
      controls.minPolarAngle = 0.08;
    }
    controls.minDistance = nextView === "inside" ? 0.7 : 0.75;
    controls.maxDistance = nextView === "inside" ? 8.5 : 42;
    controls.update();
    document.getElementById("walkPad").classList.toggle("is-visible", nextView === "inside");
    document.getElementById("exploreHint").textContent = nextView === "inside"
      ? "WASD / 触屏方向键移动 · 拖动转头 · 滚轮靠近"
      : "拖动旋转 · 滚轮缩放 · 右键平移";
  }

  function setView(view) {
    if (view === "inside") {
      moveCamera(new THREE.Vector3(0, 2.1, 3.1), new THREE.Vector3(0, 2.65, -1.5), "inside");
    } else if (view === "top") {
      moveCamera(new THREE.Vector3(0.2, 24, 0.4), new THREE.Vector3(0, 0, 0), "top");
    } else {
      moveCamera(CAMERA_HOME, TARGET_HOME, "outside");
    }
    document.querySelectorAll(".view-button[data-view]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.view === view);
    });
  }

  function toggleExploded(force) {
    exploded = typeof force === "boolean" ? force : !exploded;
    roofGroup.position.y = exploded ? 1.75 : 0;
    extraRoofGroup.position.y = currentStage === 1 && exploded ? 1.37 : 0;
    return exploded;
  }

  function toggleFrame(force) {
    frameMode = typeof force === "boolean" ? force : !frameMode;
    mainRoofSkin.visible = !frameMode;
    extraRoofSkin.visible = !frameMode;
    return frameMode;
  }

  function toggleCutaway(force) {
    cutaway = typeof force === "boolean" ? force : !cutaway;
    // Render actual WebGL section, not a screen-space screenshot.
    renderer.clippingPlanes = cutaway ? [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)] : [];
    return cutaway;
  }

  function resetView() {
    moving.clear();
    setView("outside");
    toggleExploded(false);
    toggleFrame(false);
    toggleCutaway(false);
    document.getElementById("explodeToggle").setAttribute("aria-pressed", "false");
    document.getElementById("frameToggle").setAttribute("aria-pressed", "false");
    document.getElementById("cutawayToggle").setAttribute("aria-pressed", "false");
  }

  async function exportGLB() {
    const exportRoot = hall.clone(true);
    exportRoot.traverse((node) => {
      if (node.userData.isRoofSkin) node.visible = true;
      if (node.name === "single-eave-roof" || node.name === "Qing-period-added-eave-study") node.position.y = 0;
    });
    const exportScene = new THREE.Scene();
    exportScene.add(exportRoot);
    const data = await new GLTFExporter().parseAsync(exportScene, { binary: true, onlyVisible: true });
    return new Blob([data], { type: "model/gltf-binary" });
  }

  function selectAt(event) {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(interactiveGroups, true);
    if (!hits.length) return;
    let node = hits[0].object;
    while (node && !node.userData.part) node = node.parent;
    if (node && node.userData.part) onPart(node.userData.part);
  }

  let downPoint = null;
  canvas.addEventListener("pointerdown", (event) => { downPoint = { x: event.clientX, y: event.clientY }; });
  canvas.addEventListener("pointerup", (event) => {
    if (!downPoint) return;
    if (Math.hypot(event.clientX - downPoint.x, event.clientY - downPoint.y) < 5) selectAt(event);
    downPoint = null;
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("click", () => canvas.focus({ preventScroll: true }));

  function rotateCameraBy(horizontal, vertical) {
    cameraTween = null;
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta -= horizontal;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + vertical, 0.12, activeView === "inside" ? Math.PI * 0.86 : Math.PI * 0.49);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    camera.lookAt(controls.target);
    controls.update();
  }

  function setMove(direction, isDown) {
    if (isDown) moving.add(direction);
    else moving.delete(direction);
  }
  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    const editing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if (editing) return;
    if (["w", "a", "s", "d"].includes(key) && activeView === "inside") {
      event.preventDefault();
      moving.add(key);
      return;
    }
    if (event.target === canvas) {
      if (key === "arrowleft") { event.preventDefault(); rotateCameraBy(0.09, 0); }
      if (key === "arrowright") { event.preventDefault(); rotateCameraBy(-0.09, 0); }
      if (key === "arrowup") { event.preventDefault(); rotateCameraBy(0, -0.07); }
      if (key === "arrowdown") { event.preventDefault(); rotateCameraBy(0, 0.07); }
      if (key === "+" || key === "=") { event.preventDefault(); camera.position.sub(controls.target).multiplyScalar(0.9).add(controls.target); controls.update(); }
      if (key === "-" || key === "_") { event.preventDefault(); camera.position.sub(controls.target).multiplyScalar(1.1).add(controls.target); controls.update(); }
      if (key === "home") { event.preventDefault(); resetView(); }
    }
  }
  function onKeyUp(event) { moving.delete(event.key.toLowerCase()); }
  function onBlur() { moving.clear(); }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  document.querySelectorAll(".walk-pad [data-move]").forEach((button) => {
    const directions = { forward: "w", back: "s", left: "a", right: "d" };
    const key = directions[button.dataset.move];
    button.addEventListener("pointerdown", (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); setMove(key, true); });
    button.addEventListener("pointerup", () => setMove(key, false));
    button.addEventListener("pointercancel", () => setMove(key, false));
    button.addEventListener("lostpointercapture", () => setMove(key, false));
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(frame);
  function resize() {
    const width = Math.max(1, frame.clientWidth);
    const height = Math.max(1, frame.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  resize();

  function updatePins() {
    const rect = frame.getBoundingClientRect();
    for (const [part, element] of Object.entries(pins)) {
      const point = pinAnchors[part].clone().project(camera);
      const x = (point.x * 0.5 + 0.5) * rect.width;
      const y = (-point.y * 0.5 + 0.5) * rect.height;
      const inBounds = point.z > -1 && point.z < 1 && x > 10 && x < rect.width - 10 && y > 92 && y < rect.height - 110;
      element.classList.toggle("is-visible", inBounds && activeView !== "inside");
      element.style.left = String(x) + "px";
      element.style.top = String(y) + "px";
    }
  }
  Object.values(pins).forEach((element) => {
    element.addEventListener("click", () => onPart(element.dataset.part));
  });

  function animate(now) {
    if (disposed) return;
    raf = requestAnimationFrame(animate);
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (cameraTween) {
      const t = Math.min((now - cameraTween.startTime) / cameraTween.duration, 1);
      const eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
      controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
      if (t >= 1) cameraTween = null;
    }
    if (moving.size && activeView === "inside") {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      const velocity = new THREE.Vector3();
      if (moving.has("w")) velocity.add(forward);
      if (moving.has("s")) velocity.sub(forward);
      if (moving.has("d")) velocity.add(right);
      if (moving.has("a")) velocity.sub(right);
      if (velocity.lengthSq()) {
        velocity.normalize().multiplyScalar(2.2 * delta);
        const nextX = THREE.MathUtils.clamp(camera.position.x + velocity.x, -5.9, 5.9);
        const nextZ = THREE.MathUtils.clamp(camera.position.z + velocity.z, -5.9, 5.9);
        const blocked = POST_X.some((x) => POST_Z.some((z) => Math.hypot(nextX - x, nextZ - z) < 0.48));
        if (!blocked) {
          const dx = nextX - camera.position.x;
          const dz = nextZ - camera.position.z;
          camera.position.x = nextX;
          camera.position.z = nextZ;
          controls.target.x += dx;
          controls.target.z += dz;
        }
        camera.position.y = 2.1;
      }
    }
    controls.update();
    updatePins();
    renderer.render(scene, camera);
    if (!readyCalled && now > 600) {
      readyCalled = true;
      onReady();
    }
  }
  raf = requestAnimationFrame(animate);

  return {
    setStage,
    setView,
    toggleExploded,
    toggleFrame,
    toggleCutaway,
    resetView,
    exportGLB,
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      controls.dispose();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      const geometries = new Set();
      const materials = new Set();
      scene.traverse((node) => {
        if (node.geometry) geometries.add(node.geometry);
        if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => materials.add(material));
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
    }
  };
}

function addCourtyardLines(scene) {
  const points = [];
  for (let i = -12; i <= 12; i += 1.2) {
    points.push(-16, 0.005, i, 16, 0.005, i);
    points.push(i, 0.005, -16, i, 0.005, 16);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  scene.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xaaa58c, transparent: true, opacity: 0.1 })));
}

function meshBox(parent, dimensions, position, material, part) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (part) mesh.userData.part = part;
  parent.add(mesh);
  return mesh;
}
function meshCylinder(parent, topRadius, bottomRadius, height, position, material, part, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (part) mesh.userData.part = part;
  parent.add(mesh);
  return mesh;
}
function beamBetween(parent, a, b, thickness, material, part, width = thickness) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(direction.length(), thickness, width), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (part) mesh.userData.part = part;
  parent.add(mesh);
  return mesh;
}
function cylinderBetween(parent, a, b, radius, material, part, segments = 10) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius, direction.length(), segments), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (part) mesh.userData.part = part;
  parent.add(mesh);
  return mesh;
}
function addLineSegments(parent, points, material, part) {
  if (!points.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const lines = new THREE.LineSegments(geometry, material);
  if (part) lines.userData.part = part;
  parent.add(lines);
  return lines;
}
function addTube(parent, points, radius, material, part) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 8), radius, 7, false), material);
  mesh.castShadow = true;
  if (part) mesh.userData.part = part;
  parent.add(mesh);
  return mesh;
}
function polygonMesh(parent, vertices, material, part) {
  const positions = [];
  for (let i = 1; i < vertices.length - 1; i += 1) positions.push(...vertices[0], ...vertices[i], ...vertices[i + 1]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (part) mesh.userData.part = part;
  parent.add(mesh);
  return mesh;
}

function buildStoneBase(group, mats) {
  meshBox(group, [15.1, 0.34, 14.9], [0, 0.12, 0], mats.stoneDark, "base");
  meshBox(group, [14.75, 0.28, 14.52], [0, 0.42, 0], mats.stoneLight, "base");
  meshBox(group, [14.18, 0.12, 13.95], [0, 0.62, 0], mats.stone, "base");
  for (const x of POST_X) for (const z of POST_Z) {
    meshBox(group, [0.54, 0.16, 0.54], [x, 0.75, z], mats.stoneLight, "base");
    meshBox(group, [0.38, 0.08, 0.38], [x, 0.87, z], mats.stone, "base");
  }
  for (let step = 0; step < 4; step += 1) {
    meshBox(group, [4.25 - step * 0.26, 0.19, 0.74], [0, 0.12 + step * 0.2, 7.68 + step * 0.24], step % 2 ? mats.stone : mats.stoneLight, "base");
    meshBox(group, [0.19, 0.14, 0.74], [-2.3 + step * 0.13, 0.11 + step * 0.2, 7.66 + step * 0.24], mats.stoneDark, "base");
    meshBox(group, [0.19, 0.14, 0.74], [2.3 - step * 0.13, 0.11 + step * 0.2, 7.66 + step * 0.24], mats.stoneDark, "base");
  }
  const joints = [];
  for (let z = -6.8; z <= 6.8; z += 2.2) joints.push(-7.24, 0.57, z, 7.24, 0.57, z);
  for (let x = -6.8; x <= 6.8; x += 2.2) joints.push(x, 0.57, -7.2, x, 0.57, 7.2);
  addLineSegments(group, joints, new THREE.LineBasicMaterial({ color: 0x65665a, transparent: true, opacity: 0.42 }), "base");
}

function buildTaperedColumn(parent, x, z, material) {
  const profile = [
    new THREE.Vector2(0.255, 0), new THREE.Vector2(0.27, 0.09),
    new THREE.Vector2(0.235, 0.22), new THREE.Vector2(0.222, 0.72),
    new THREE.Vector2(0.212, 1.7), new THREE.Vector2(0.207, 2.8),
    new THREE.Vector2(0.205, 4.05), new THREE.Vector2(0.214, 4.78),
    new THREE.Vector2(0.245, 4.96), new THREE.Vector2(0.26, 5.03)
  ];
  const geometry = new THREE.LatheGeometry(profile, 20);
  geometry.computeVertexNormals();
  const column = new THREE.Mesh(geometry, material);
  column.position.set(x, 0.88, z);
  column.castShadow = true;
  column.receiveShadow = true;
  column.userData.part = "columns";
  parent.add(column);
  return column;
}

function buildColumnsAndFrame(group, columns, mats) {
  const xs = POST_X;
  const zs = POST_Z;
  for (const x of xs) for (const z of zs) {
    buildTaperedColumn(columns, x, z, mats.wood);
    meshCylinder(columns, 0.268, 0.268, 0.09, [x, 0.96, z], mats.woodLight, "columns", 14);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.213, 0.026, 6, 16), mats.woodEdge);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 5.83, z);
    ring.userData.part = "columns";
    columns.add(ring);
    const grain = [];
    for (let line = 0; line < 3; line += 1) {
      const angle = 0.6 + line * 1.7;
      const gx = x + Math.cos(angle) * 0.211;
      const gz = z + Math.sin(angle) * 0.211;
      grain.push(gx, 1.25, gz, gx, 5.47, gz);
    }
    addLineSegments(columns, grain, new THREE.LineBasicMaterial({ color: 0xb09265, transparent: true, opacity: 0.26 }), "columns");
  }

  const beamY = 5.92;
  meshBox(group, [13.55, 0.33, 0.38], [0, beamY, 6.5], mats.woodLight, "frame");
  meshBox(group, [13.55, 0.33, 0.38], [0, beamY, -6.5], mats.wood, "frame");
  meshBox(group, [0.38, 0.33, 12.85], [-6.7, beamY, 0], mats.wood, "frame");
  meshBox(group, [0.38, 0.33, 12.85], [6.7, beamY, 0], mats.woodLight, "frame");
  for (const z of [-3.9, 1.2]) meshBox(group, [13.2, 0.27, 0.3], [0, 5.66, z], mats.wood, "frame");
  for (const x of [-3.05, 3.05]) meshBox(group, [0.3, 0.28, 12.7], [x, 5.66, 0], mats.woodLight, "frame");

  meshBox(group, [13.45, 0.22, 0.28], [0, 1.25, 6.42], mats.woodDark, "frame");
  meshBox(group, [13.45, 0.22, 0.28], [0, 1.25, -6.42], mats.woodDark, "frame");
  meshBox(group, [0.28, 0.22, 12.7], [-6.62, 1.25, 0], mats.woodDark, "frame");
  meshBox(group, [0.28, 0.22, 12.7], [6.62, 1.25, 0], mats.woodDark, "frame");
  buildFrontPanels(group, mats);
  buildSidePanels(group, mats);
  buildDougong(group, mats, xs, zs);
  buildCeilingFrame(group, mats);
}

function buildFrontPanels(group, mats) {
  const z = 6.36;
  const bays = [[-6.54, -3.14], [3.14, 6.54]];
  for (const [left, right] of bays) {
    meshBox(group, [right - left, 1.05, 0.18], [(left + right) / 2, 1.98, z], mats.woodDark, "door");
    meshBox(group, [right - left, 0.13, 0.22], [(left + right) / 2, 2.56, z], mats.woodLight, "door");
    meshBox(group, [right - left, 0.13, 0.22], [(left + right) / 2, 4.96, z], mats.woodLight, "door");
    for (let i = 0; i <= 10; i += 1) {
      const x = left + (right - left) * i / 10;
      beamBetween(group, [x, 2.62, z + 0.1], [x, 4.9, z + 0.1], 0.055, mats.woodLight, "door", 0.075);
    }
    for (const y of [2.72, 3.18, 3.64, 4.1, 4.56, 4.9]) {
      beamBetween(group, [left, y, z + 0.1], [right, y, z + 0.1], 0.055, mats.wood, "door", 0.075);
    }
    meshBox(group, [0.13, 3.55, 0.22], [left, 3.72, z], mats.wood, "door");
    meshBox(group, [0.13, 3.55, 0.22], [right, 3.72, z], mats.wood, "door");
  }
  for (const x of [-3.05, 3.05]) meshBox(group, [0.19, 4.48, 0.24], [x, 3.52, z + 0.05], mats.woodLight, "frame");
  meshBox(group, [6.1, 0.22, 0.24], [0, 5.62, z + 0.06], mats.woodLight, "frame");
}

function buildSidePanels(group, mats) {
  for (const side of [-1, 1]) {
    const x = side * 6.55;
    for (const [z1, z2] of [[-6.35, -4.0], [-3.8, 1.1], [1.3, 6.35]]) {
      const center = (z1 + z2) / 2;
      const span = z2 - z1;
      meshBox(group, [0.17, 1.08, span], [x, 1.98, center], mats.wallShadow, "door");
      meshBox(group, [0.2, 0.13, span], [x, 2.58, center], mats.woodLight, "door");
      meshBox(group, [0.2, 0.13, span], [x, 4.92, center], mats.woodLight, "door");
      for (let i = 0; i <= 8; i += 1) {
        const z = z1 + span * i / 8;
        beamBetween(group, [x, 2.65, z], [x, 4.85, z], 0.052, mats.woodLight, "door", 0.075);
      }
      for (const y of [2.78, 3.3, 3.82, 4.34, 4.86]) {
        beamBetween(group, [x, y, z1], [x, y, z2], 0.052, mats.wood, "door", 0.075);
      }
    }
  }
  const back = -6.38;
  meshBox(group, [13.0, 1.08, 0.17], [0, 1.98, back], mats.wallShadow, "door");
  for (let x = -6.3; x <= 6.3; x += 0.62) {
    beamBetween(group, [x, 2.62, back], [x, 4.9, back], 0.052, mats.woodLight, "door", 0.075);
  }
  for (const y of [2.75, 3.3, 3.85, 4.4, 4.85]) {
    beamBetween(group, [-6.4, y, back], [6.4, y, back], 0.052, mats.wood, "door", 0.075);
  }
}

function buildGableAndRafters(group, mats) {
  const shape = new THREE.Shape();
  shape.moveTo(-6.55, 6.16);
  shape.lineTo(6.55, 6.16);
  shape.lineTo(0, 9.24);
  shape.closePath();
  for (const z of [6.47, -6.47]) {
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(shape), mats.woodDark);
    gable.position.z = z;
    gable.userData.part = "frame";
    gable.castShadow = true;
    group.add(gable);
    const sign = z > 0 ? 1 : -1;
    for (let i = -5; i <= 5; i += 1) {
      const x = i * 1.05;
      beamBetween(group, [x, 6.38, z + sign * 0.06], [x * 0.22, 8.98 - Math.abs(x) * 0.08, z + sign * 0.06], 0.075, mats.woodLight, "frame", 0.075);
    }
    const gableLines = [];
    for (const y of [6.55, 6.92, 7.38, 7.9, 8.42]) {
      const half = THREE.MathUtils.mapLinear(y, 6.16, 9.24, 6.55, 0);
      gableLines.push(-half, y, z + sign * 0.08, half, y, z + sign * 0.08);
    }
    addLineSegments(group, gableLines, new THREE.LineBasicMaterial({ color: 0x94754d, transparent: true, opacity: 0.72 }), "frame");
  }
  for (let i = -5; i <= 5; i += 1) {
    const x = i * 1.05;
    for (const side of [-1, 1]) {
      beamBetween(group, [x, 6.28, side * 6.2], [x * 0.12, 9.05 - Math.abs(x) * 0.07, side * 5.8], 0.095, mats.wood, "frame", 0.11);
    }
  }
}

function buildDougong(group, mats, xs, zs) {
  // Layered bracket research geometry with carved gong ends, bearing dou and false ang.
  // Not a measured reconstruction; outer/interior distribution remains provisional.
  populateDougongStudy(group, xs, zs, mats);
}

function buildCeilingFrame(group, mats) {
  for (let i = -5; i <= 5; i += 1) {
    const x = i * 1.05;
    beamBetween(group, [x, 6.02, -6.35], [x * 0.24, 9.12 - Math.abs(x) * 0.08, -5.9], 0.1, mats.wood, "frame", 0.12);
    beamBetween(group, [x, 6.02, 6.35], [x * 0.24, 9.12 - Math.abs(x) * 0.08, 5.9], 0.1, mats.woodLight, "frame", 0.12);
  }
  for (const y of [7.02, 7.74, 8.42]) meshBox(group, [0.2, 0.16, 11.8], [0, y, 0], mats.woodLight, "frame");
}

function buildRoof(parent, options) {
  const { width, depth, baseY, ridgeY, ridgeHalf, mats, style } = options;
  const group = new THREE.Group();
  group.userData.part = "roof";
  parent.add(group);
  const skin = new THREE.Group();
  skin.userData.part = "roof";
  skin.userData.isRoofSkin = true;
  group.add(skin);
  const halfW = width / 2;
  const halfD = depth / 2;
  const eaveRise = (u) => 0.34 * Math.pow(Math.abs(u), 2.25);
  const frontPoint = (u, v, sign = 1) => [
    u * halfW * v,
    ridgeY + (baseY - ridgeY) * v + eaveRise(u) * v * v,
    sign * (ridgeHalf + (halfD - ridgeHalf) * v)
  ];
  const sidePoint = (u, v, sign = 1) => [
    sign * halfW * v,
    ridgeY + (baseY - ridgeY) * v + eaveRise(u) * v * v,
    u * (ridgeHalf + (halfD - ridgeHalf) * v)
  ];
  const roofMaterial = style === "lower" ? mats.roofSun : mats.roof;
  surfacePatch(skin, (u, v) => frontPoint(u, v, 1), roofMaterial, "roof", 28, 16);
  surfacePatch(skin, (u, v) => frontPoint(u, v, -1), mats.roofSide, "roof", 28, 16);
  surfacePatch(skin, (u, v) => sidePoint(u, v, -1), mats.roofSide, "roof", 22, 16);
  surfacePatch(skin, (u, v) => sidePoint(u, v, 1), roofMaterial, "roof", 22, 16);

  // Each roof face now has explicit thin 3D pan/cover tile shells rather than flat grid lines.
  // Geometry is combined by face/material to avoid one draw call per tile.
  addRoofTileStudy(skin, (u, v) => frontPoint(u, v, 1), mats, { bays: 16, courses: 14, label: "hip-east" });
  addRoofTileStudy(skin, (u, v) => frontPoint(u, v, -1), mats, { bays: 16, courses: 14, label: "hip-west" });
  addRoofTileStudy(skin, (u, v) => sidePoint(u, v, -1), mats, { bays: 24, courses: 16, label: "south-slope" });
  addRoofTileStudy(skin, (u, v) => sidePoint(u, v, 1), mats, { bays: 24, courses: 16, label: "north-slope" });

  for (const sign of [-1, 1]) {
    const points = [];
    for (let i = 0; i <= 24; i += 1) points.push(raised(sidePoint(-1 + 2 * i / 24, 1, sign)));
    addTube(group, points, 0.09, mats.woodDark, "roof");
  }
  for (const sign of [-1, 1]) {
    const points = [];
    for (let i = 0; i <= 24; i += 1) points.push(raised(frontPoint(-1 + 2 * i / 24, 1, sign)));
    addTube(group, points, 0.075, mats.woodEdge, "roof");
  }
  addTube(group, [[0, ridgeY + 0.08, -ridgeHalf], [0, ridgeY + 0.08, ridgeHalf]], 0.13, mats.woodEdge, "roof");
  cylinderBetween(group, [0, ridgeY + 0.1, -ridgeHalf], [0, ridgeY + 0.1, ridgeHalf], style === "lower" ? 0.11 : 0.15, mats.woodEdge, "roof", 12);
  for (const sign of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), mats.brass);
    cap.position.set(0, ridgeY + 0.16, sign * ridgeHalf);
    cap.scale.set(0.78, 0.62, 0.78);
    cap.userData.part = "roof";
    group.add(cap);
  }
  return skin;
}

function surfacePatch(parent, pointAt, material, part, segmentsU = 24, segmentsV = 14) {
  const positions = [];
  const indices = [];
  for (let v = 0; v <= segmentsV; v += 1) {
    for (let u = 0; u <= segmentsU; u += 1) positions.push(...pointAt(-1 + 2 * u / segmentsU, v / segmentsV));
  }
  const row = segmentsU + 1;
  for (let v = 0; v < segmentsV; v += 1) {
    for (let u = 0; u < segmentsU; u += 1) {
      const a = v * row + u;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.part = part;
  parent.add(mesh);
  return mesh;
}

function buildQingExtension(group, mats) {
  const inferredTimber = new THREE.MeshStandardMaterial({
    color: 0x85664a, roughness: 0.9, transparent: true, opacity: 0.76, depthWrite: false
  });
  const outerX = [-10.05, 10.05];
  for (const x of outerX) {
    for (const z of POST_Z) {
      meshBox(group, [0.54, 0.16, 0.54], [x, 0.75, z], mats.stoneLight, "base");
      meshBox(group, [0.38, 0.08, 0.38], [x, 0.87, z], mats.stone, "base");
      buildTaperedColumn(group, x, z, inferredTimber);
    }
    meshBox(group, [0.28, 0.28, 13.0], [x, 5.92, 0], inferredTimber, "frame");
    for (const z of [-6.5, -3.9, 1.2, 6.5]) {
      meshBox(group, [0.72, 0.15, 0.7], [x, 6.08, z], inferredTimber, "dougong");
    }
  }
  for (const z of [-6.5, 6.5]) {
    beamBetween(group, [-10.05, 5.92, z], [-6.7, 5.92, z], 0.28, inferredTimber, "frame", 0.38);
    beamBetween(group, [6.7, 5.92, z], [10.05, 5.92, z], 0.28, inferredTimber, "frame", 0.38);
  }
  for (const x of outerX) {
    for (const z of [-6.5, -3.9, 1.2, 6.5]) {
      meshBox(group, [0.28, 0.24, 0.3], [x, 5.66, z], inferredTimber, "frame");
    }
  }
}

function buildLowerEave(parent, mats) {
  // Qing-period additional lower eave: annular roof only.
  // Its construction is conjectural, not a scan of the lost 19th-century configuration.
  const skin = new THREE.Group();
  skin.name = "Qing-addition-eave-skin";
  skin.userData.part = "roof";
  skin.userData.isRoofSkin = true;
  parent.add(skin);
  const outerX = 11.2;
  const outerZ = 9.35;
  const innerX = 6.55;
  const innerZ = 6.42;
  const topY = 6.12;
  const outerY = 5.64;
  const eaveMat = mats.roofSun;
  for (const sign of [-1, 1]) {
    const front = [
      [-outerX, outerY + 0.17, sign * outerZ],
      [outerX, outerY + 0.17, sign * outerZ],
      [innerX, topY, sign * innerZ],
      [-innerX, topY, sign * innerZ]
    ];
    polygonMesh(skin, front, eaveMat, "roof");
    const side = [
      [sign * outerX, outerY + 0.17, -outerZ],
      [sign * outerX, outerY + 0.17, outerZ],
      [sign * innerX, topY, innerZ],
      [sign * innerX, topY, -innerZ]
    ];
    polygonMesh(skin, side, eaveMat, "roof");
    const frontEave = [];
    const sideEave = [];
    for (let i = 0; i <= 24; i++) {
      const u = -1 + 2 * i / 24;
      frontEave.push([u * outerX, outerY + 0.17 + 0.1 * u * u, sign * outerZ]);
      sideEave.push([sign * outerX, outerY + 0.17 + 0.1 * u * u, u * outerZ]);
    }
    addTube(skin, frontEave, 0.08, mats.woodDark, "roof");
    addTube(skin, sideEave, 0.08, mats.woodDark, "roof");
    for (let i = -12; i <= 12; i++) {
      const u = i / 12;
      addTube(skin, [[u * innerX, topY + 0.015, sign * innerZ], [u * outerX, outerY + 0.21 + 0.1 * u * u, sign * outerZ]],
        0.022, mats.woodDark, "roof");
      addTube(skin, [[sign * innerX, topY + 0.015, u * innerZ], [sign * outerX, outerY + 0.21 + 0.1 * u * u, u * outerZ]],
        0.022, mats.woodDark, "roof");
    }
  }
  return skin;
}

function buildInteriorHint(hall, mats) {
  const warm = new THREE.MeshStandardMaterial({ color: 0x9b7340, emissive: 0x4a2b0d, emissiveIntensity: 0.5, roughness: 0.55 });
  meshBox(hall, [3.5, 0.36, 1.35], [0, 1.15, -3.65], mats.woodDark, "frame");
  meshBox(hall, [2.7, 0.14, 0.96], [0, 1.42, -3.55], mats.woodLight, "frame");
  for (const x of [-1.17, 1.17]) {
    meshBox(hall, [0.13, 0.72, 0.13], [x, 1.78, -3.55], mats.wood, "frame");
    meshBox(hall, [0.13, 0.72, 0.13], [x, 1.78, -2.89], mats.wood, "frame");
  }
  meshBox(hall, [2.5, 0.12, 0.8], [0, 2.13, -3.22], mats.woodLight, "frame");
  const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 1), warm);
  lamp.position.set(0, 4.25, 0.6);
  lamp.scale.set(0.72, 1.18, 0.72);
  lamp.userData.part = "frame";
  hall.add(lamp);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 7), mats.brass);
  chain.position.set(0, 4.76, 0.6);
  hall.add(chain);
}

function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function raised(point) { return [point[0], point[1] + 0.022, point[2]]; }
