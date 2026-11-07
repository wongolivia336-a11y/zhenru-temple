import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const CAMERA_HOME = new THREE.Vector3(19, 13.5, 22);
const TARGET_HOME = new THREE.Vector3(0, 4.6, 0);
const POST_X = [-6.7, -3.05, 3.05, 6.7];
const POST_Z = [-6.5, -2.17, 2.17, 6.5];

export function createHallScene({ canvas, frame, pins, onPart, onReady }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#26332d");
  scene.fog = new THREE.Fog("#26332d", 36, 75);

  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 120);
  camera.position.copy(CAMERA_HOME);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

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

  scene.add(new THREE.HemisphereLight(0xe8e1cf, 0x45483e, 2.0));
  const keyLight = new THREE.DirectionalLight(0xffe6bd, 3.1);
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
  const fillLight = new THREE.DirectionalLight(0x9cae9d, 1.15);
  fillLight.position.set(12, 10, -15);
  scene.add(fillLight);
  const warmInterior = new THREE.PointLight(0xe5a760, 12, 18, 1.8);
  warmInterior.position.set(0, 4.2, -0.8);
  scene.add(warmInterior);

  const mats = {
    stone: new THREE.MeshStandardMaterial({ color: 0x858474, roughness: 0.93 }),
    stoneLight: new THREE.MeshStandardMaterial({ color: 0xb3a98e, roughness: 0.87 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: 0x66685d, roughness: 0.96 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x59412d, roughness: 0.82 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0x806442, roughness: 0.78 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x302c24, roughness: 0.9 }),
    woodEdge: new THREE.MeshStandardMaterial({ color: 0x9a7950, roughness: 0.74 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xc7b99b, roughness: 0.92 }),
    wallShadow: new THREE.MeshStandardMaterial({ color: 0x8f826a, roughness: 0.94 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x495047, roughness: 0.84, side: THREE.DoubleSide }),
    roofSide: new THREE.MeshStandardMaterial({ color: 0x3a443c, roughness: 0.86, side: THREE.DoubleSide }),
    roofSun: new THREE.MeshStandardMaterial({ color: 0x5d5c4b, roughness: 0.8, side: THREE.DoubleSide }),
    roofTile: new THREE.LineBasicMaterial({ color: 0xaaa081, transparent: true, opacity: 0.72 }),
    roofRib: new THREE.LineBasicMaterial({ color: 0x393e36, transparent: true, opacity: 0.8 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb79a64, roughness: 0.61, metalness: 0.18 }),
    ground: new THREE.MeshStandardMaterial({ color: 0x55584c, roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x222a25, roughness: 0.4, metalness: 0.04 })
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

  buildStoneBase(baseGroup, mats);
  buildColumnsAndFrame(frameGroup, columnGroup, mats);
  buildGableAndRafters(frameGroup, mats);
  const mainRoofSkin = buildRoof(roofGroup, {
    width: 17.25, depth: 16.8, baseY: 6.72, ridgeY: 9.55, ridgeHalf: 6.0, mats, style: "main"
  });
  const extraRoofSkin = buildRoof(extraRoofGroup, {
    width: 15.8, depth: 15.25, baseY: 5.83, ridgeY: 8.16, ridgeHalf: 5.55, mats, style: "lower"
  });
  buildInteriorHint(hall, mats);

  const pinAnchors = {
    roof: new THREE.Vector3(7.3, 7.25, 7.2),
    frame: new THREE.Vector3(6.25, 6.2, 6.35),
    columns: new THREE.Vector3(6.55, 3.2, 6.38),
    base: new THREE.Vector3(6.4, 0.64, 7.1)
  };
  const moving = new Set();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const interactiveGroups = [baseGroup, frameGroup, roofGroup, extraRoofGroup];
  let activeView = "outside";
  let exploded = false;
  let frameMode = false;
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
    extraRoofSkin.visible = !frameMode;
  }

  function moveCamera(position, target, nextView) {
    cameraTween = {
      startTime: performance.now(),
      duration: 850,
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

  function resetView() {
    moving.clear();
    setView("outside");
    toggleExploded(false);
    toggleFrame(false);
    document.getElementById("explodeToggle").setAttribute("aria-pressed", "false");
    document.getElementById("frameToggle").setAttribute("aria-pressed", "false");
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

  function setMove(direction, isDown) {
    if (isDown) moving.add(direction);
    else moving.delete(direction);
  }
  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(key) && activeView === "inside") {
      event.preventDefault();
      moving.add(key);
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
        camera.position.add(velocity);
        controls.target.add(velocity);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -5.9, 5.9);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -5.9, 5.9);
        controls.target.x = THREE.MathUtils.clamp(controls.target.x, -6.4, 6.4);
        controls.target.z = THREE.MathUtils.clamp(controls.target.z, -6.4, 6.4);
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
    resetView,
    exportGLB,
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
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

function buildColumnsAndFrame(group, columns, mats) {
  const xs = POST_X;
  const zs = POST_Z;
  for (const x of xs) for (const z of zs) {
    meshCylinder(columns, 0.205, 0.255, 5.03, [x, 3.39, z], mats.wood, "columns", 14);
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
  for (const z of [-2.17, 2.17]) meshBox(group, [13.2, 0.27, 0.3], [0, 5.66, z], mats.wood, "frame");
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
    meshBox(group, [right - left, 3.55, 0.14], [(left + right) / 2, 3.25, z], mats.wall, "frame");
    meshBox(group, [right - left, 0.16, 0.2], [(left + right) / 2, 5.07, z], mats.woodLight, "frame");
    meshBox(group, [right - left, 0.16, 0.2], [(left + right) / 2, 1.45, z], mats.wood, "frame");
    const lattice = [];
    for (let i = 0; i <= 10; i += 1) {
      const x = left + (right - left) * i / 10;
      lattice.push(x, 1.62, z + 0.09, x, 4.95, z + 0.09);
    }
    for (const y of [1.72, 2.25, 2.78, 3.31, 3.84, 4.37, 4.9]) lattice.push(left, y, z + 0.1, right, y, z + 0.1);
    addLineSegments(group, lattice, new THREE.LineBasicMaterial({ color: 0x765b3a, transparent: true, opacity: 0.87 }), "frame");
  }
  for (const x of [-3.05, 3.05]) meshBox(group, [0.17, 4.48, 0.2], [x, 3.52, z + 0.05], mats.woodLight, "frame");
  meshBox(group, [6.1, 0.22, 0.22], [0, 5.62, z + 0.06], mats.woodLight, "frame");
}

function buildSidePanels(group, mats) {
  for (const side of [-1, 1]) {
    const x = side * 6.55;
    for (const [z1, z2] of [[-6.25, -2.35], [-2.0, 2.0], [2.35, 6.25]]) {
      meshBox(group, [0.13, 3.55, z2 - z1], [x, 3.25, (z1 + z2) / 2], mats.wall, "frame");
      const lines = [];
      for (let i = 0; i <= 8; i += 1) {
        const z = z1 + (z2 - z1) * i / 8;
        lines.push(x + side * 0.08, 1.6, z, x + side * 0.08, 4.95, z);
      }
      for (const y of [1.75, 2.5, 3.25, 4, 4.75]) lines.push(x + side * 0.085, y, z1, x + side * 0.085, y, z2);
      addLineSegments(group, lines, new THREE.LineBasicMaterial({ color: 0x705638, transparent: true, opacity: 0.78 }), "frame");
    }
  }
  const back = -6.38;
  meshBox(group, [13.0, 3.55, 0.14], [0, 3.25, back], mats.wallShadow, "frame");
  const rearLattice = [];
  for (let x = -6.3; x <= 6.3; x += 0.62) rearLattice.push(x, 1.65, back - 0.08, x, 4.9, back - 0.08);
  for (const y of [1.8, 2.45, 3.1, 3.75, 4.4, 4.85]) rearLattice.push(-6.4, y, back - 0.08, 6.4, y, back - 0.08);
  addLineSegments(group, rearLattice, new THREE.LineBasicMaterial({ color: 0x554734, transparent: true, opacity: 0.7 }), "frame");
}

function buildGableAndRafters(group, mats) {
  const shape = new THREE.Shape();
  shape.moveTo(-6.55, 6.16);
  shape.lineTo(6.55, 6.16);
  shape.lineTo(0, 9.24);
  shape.closePath();
  const gable = new THREE.Mesh(new THREE.ShapeGeometry(shape), mats.woodDark);
  gable.position.z = 6.47;
  gable.userData.part = "frame";
  gable.castShadow = true;
  group.add(gable);

  const detail = [
    -5.8, 6.4, 6.52, 0, 9.1, 6.52,
    5.8, 6.4, 6.52, 0, 9.1, 6.52,
    -4.8, 6.45, 6.53, 4.8, 6.45, 6.53,
    -3.4, 6.78, 6.53, 3.4, 6.78, 6.53,
    -1.9, 7.48, 6.53, 1.9, 7.48, 6.53
  ];
  addLineSegments(group, detail, new THREE.LineBasicMaterial({ color: 0x94754d, transparent: true, opacity: 0.82 }), "frame");
  for (let i = -5; i <= 5; i += 1) {
    const x = i * 1.05;
    beamBetween(group, [x, 6.38, 6.54], [x * 0.26, 8.95 - Math.abs(x) * 0.09, 6.54], 0.065, mats.woodLight, "frame", 0.065);
  }
}

function buildDougong(group, mats, xs, zs) {
  for (const x of xs) for (const z of zs) {
    meshBox(group, [0.68, 0.18, 0.62], [x, 6.12, z], mats.woodLight, "frame");
    meshBox(group, [0.8, 0.16, 0.4], [x, 6.31, z], mats.wood, "frame");
    meshBox(group, [0.45, 0.16, 0.84], [x, 6.48, z], mats.woodLight, "frame");
    if (z > 5 || z < -5) {
      const direction = z > 0 ? 1 : -1;
      for (const height of [6.3, 6.48]) meshBox(group, [0.22, 0.13, 0.76], [x, height, z + direction * 0.43], mats.woodEdge, "frame");
    }
    if (x > 5 || x < -5) {
      const direction = x > 0 ? 1 : -1;
      meshBox(group, [0.78, 0.13, 0.2], [x + direction * 0.42, 6.39, z], mats.woodEdge, "frame");
    }
    meshBox(group, [0.12, 0.22, 0.12], [x, 6.64, z], mats.woodDark, "frame");
  }
  const frieze = [];
  for (const z of [-6.7, 6.7]) frieze.push(-6.8, 6.55, z, 6.8, 6.55, z);
  for (const x of [-6.65, 6.65]) frieze.push(x, 6.55, -6.7, x, 6.55, 6.7);
  addLineSegments(group, frieze, new THREE.LineBasicMaterial({ color: 0xb59866, transparent: true, opacity: 0.72 }), "frame");
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
  const x = width / 2;
  const z = depth / 2;
  const lf = [-x, baseY, z];
  const rf = [x, baseY, z];
  const lb = [-x, baseY, -z];
  const rb = [x, baseY, -z];
  const fRidge = [0, ridgeY, ridgeHalf];
  const bRidge = [0, ridgeY, -ridgeHalf];
  const variant = style === "lower";
  polygonMesh(skin, [lf, fRidge, rf], variant ? mats.roofSun : mats.roof, "roof");
  polygonMesh(skin, [rb, bRidge, lb], mats.roofSide, "roof");
  polygonMesh(skin, [lf, lb, bRidge, fRidge], mats.roofSide, "roof");
  polygonMesh(skin, [rb, rf, fRidge, bRidge], variant ? mats.roof : mats.roofSun, "roof");

  const tilePoints = [];
  const ribPoints = [];
  for (let row = 1; row < 15; row += 1) {
    const t = row / 15;
    tilePoints.push(...raised(lerp3(fRidge, lf, t)), ...raised(lerp3(fRidge, rf, t)));
    tilePoints.push(...raised(lerp3(bRidge, lb, t)), ...raised(lerp3(bRidge, rb, t)));
  }
  for (let rib = 1; rib < 22; rib += 1) {
    const u = rib / 22;
    ribPoints.push(...raised(fRidge), ...raised(lerp3(lf, rf, u)));
    ribPoints.push(...raised(bRidge), ...raised(lerp3(lb, rb, u)));
  }
  for (const side of [-1, 1]) {
    for (let row = 1; row < 15; row += 1) {
      const t = row / 15;
      const frontEave = side === -1 ? lf : rf;
      const backEave = side === -1 ? lb : rb;
      const a = lerp3(frontEave, fRidge, t);
      const b = lerp3(backEave, bRidge, t);
      tilePoints.push(...raised(a), ...raised(b));
    }
    for (let rib = 1; rib < 20; rib += 1) {
      const u = rib / 20;
      const eave = lerp3(side === -1 ? lf : rf, side === -1 ? lb : rb, u);
      const ridge = lerp3(fRidge, bRidge, u);
      ribPoints.push(...raised(eave), ...raised(ridge));
    }
  }
  addLineSegments(skin, tilePoints, mats.roofTile, "roof");
  addLineSegments(skin, ribPoints, mats.roofRib, "roof");

  const trim = new THREE.MeshStandardMaterial({ color: variant ? 0x77715b : 0x77745f, roughness: 0.78 });
  const edges = [
    [[-x, baseY, z], [-x * 0.55, baseY + 0.08, z + 0.12], [0, ridgeY, ridgeHalf]],
    [[x, baseY, z], [x * 0.55, baseY + 0.08, z + 0.12], [0, ridgeY, ridgeHalf]],
    [[-x, baseY, -z], [-x * 0.55, baseY + 0.08, -z - 0.12], [0, ridgeY, -ridgeHalf]],
    [[x, baseY, -z], [x * 0.55, baseY + 0.08, -z - 0.12], [0, ridgeY, -ridgeHalf]],
    [[-x, baseY, z], [-x - 0.26, baseY + 0.38, z + 0.14]],
    [[x, baseY, z], [x + 0.26, baseY + 0.38, z + 0.14]]
  ];
  edges.forEach((edge, index) => addTube(group, edge, index < 4 ? 0.075 : 0.09, trim, "roof"));
  cylinderBetween(group, [0, ridgeY + 0.1, -ridgeHalf], [0, ridgeY + 0.1, ridgeHalf], variant ? 0.13 : 0.16, mats.woodEdge, "roof", 12);
  meshCylinder(group, 0.18, 0.1, 0.28, [0, ridgeY + 0.28, ridgeHalf], mats.brass, "roof", 10);
  const ridgeCap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), mats.brass);
  ridgeCap.position.set(0, ridgeY + 0.49, ridgeHalf);
  ridgeCap.scale.set(0.75, 0.62, 0.75);
  ridgeCap.userData.part = "roof";
  group.add(ridgeCap);
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
