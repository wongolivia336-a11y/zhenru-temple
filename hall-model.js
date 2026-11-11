import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { populateDougongStudy, addRoofTileStudy } from "./model-fidelity.js";
import { makeRoofStudy, parseRoofPitch } from "./reconstruction/roof-parameters.mjs";
import { createHipGableStudy } from "./reconstruction/hip-gable-topology.mjs";
import { addEaveTerminations } from "./reconstruction/eave-details.js";
import { createGinkgoStudy } from "./reconstruction/ginkgo-study.js";
import { createVisitCourtyard } from "./reconstruction/visit-courtyard.js";
import { createVisitorFigures } from "./reconstruction/visitor-figures.js";
import { sanitizeExplosion, sanitizeFocus, explosionWeights } from "./reconstruction/ginkgo-phases.mjs";

const CAMERA_HOME = new THREE.Vector3(19, 13.5, 22);
const TARGET_HOME = new THREE.Vector3(0, 4.6, 0);
const POST_X = [-6.7, -3.05, 3.05, 6.7];
const POST_Z = [-6.5, -3.9, 1.2, 6.5];

export function createHallScene({ canvas, frame, pins, onPart, onReady, onVisitZone }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f0f3f0");
  scene.fog = new THREE.Fog("#f0f3f0", 48, 96);

  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 120);
  camera.position.copy(CAMERA_HOME);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
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
  const cancelCameraTween = () => { cameraTween = null; cameraTouched = true; };
  controls.addEventListener("start", cancelCameraTween);

  scene.add(new THREE.HemisphereLight(0xf6f8f6, 0x737b76, 1.7));
  const keyLight = new THREE.DirectionalLight(0xfff5e3, 2.6);
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
  const fillLight = new THREE.DirectionalLight(0xc5d0ca, 1.15);
  fillLight.position.set(12, 10, -15);
  scene.add(fillLight);
  const warmInterior = new THREE.PointLight(0xe0bd82, 4.2, 17, 1.8);
  warmInterior.position.set(0, 4.2, -0.8);
  scene.add(warmInterior);

  const mats = {
    stone: new THREE.MeshStandardMaterial({ color: 0x969a96, roughness: 0.94 }),
    stoneLight: new THREE.MeshStandardMaterial({ color: 0xd0d3ce, roughness: 0.9 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: 0x707873, roughness: 0.96 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x503724, roughness: 0.86 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0x80603d, roughness: 0.82 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x30251d, roughness: 0.92 }),
    woodEdge: new THREE.MeshStandardMaterial({ color: 0x9a7548, roughness: 0.78 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xc9cec9, roughness: 0.95 }),
    wallShadow: new THREE.MeshStandardMaterial({ color: 0x858d87, roughness: 0.96 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x777e79, roughness: 0.91, side: THREE.DoubleSide }),
    roofSide: new THREE.MeshStandardMaterial({ color: 0x656e69, roughness: 0.93, side: THREE.DoubleSide }),
    roofSun: new THREE.MeshStandardMaterial({ color: 0x858a84, roughness: 0.89, side: THREE.DoubleSide }),
    roofTile: new THREE.LineBasicMaterial({ color: 0xa3aaa5, transparent: true, opacity: 0.52 }),
    roofRib: new THREE.LineBasicMaterial({ color: 0x4b5550, transparent: true, opacity: 0.66 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xa98b59, roughness: 0.68, metalness: 0.12 }),
    ground: new THREE.MeshStandardMaterial({ color: 0xf0f2ef, roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x35342e, roughness: 0.52, metalness: 0.02 })
  };

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), mats.ground);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.035;
  floor.receiveShadow = true;
  scene.add(floor);
  addCourtyardLines(scene);
  const ginkgo = createGinkgoStudy(scene, {
    compact: window.innerWidth <= 720 || (navigator.deviceMemory && navigator.deviceMemory <= 4)
  });
  const visitCourtyard = createVisitCourtyard(scene);
  const remoteVisitors = createVisitorFigures(scene);
  // Environment is scene decoration with its own measured-vs-inferred labeling.
  // GLB export intentionally exports the main hall only.

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
  hall.add(columnGroup);
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
  const ceilingRafterStudy = buildColumnsAndFrame(frameGroup, columnGroup, mats);
  // Contemporary facade reference: main roof ridge is parallel to the hall frontage.
  // Frame axis study shares its rotation; the actual 16-column grid remains unrotated.
  const pitchParam = new URLSearchParams(window.location.search).get("roofPitch");
  const roofStudy = makeRoofStudy(parseRoofPitch(pitchParam));
  const roofFrameStudy = new THREE.Group();
  roofFrameStudy.name = "roof-framing-axis-study";
  roofFrameStudy.userData.part = "frame";
  roofFrameStudy.rotation.y = Math.PI / 2;
  // Keep the frame eave datum fixed when the ridge height changes.
  roofFrameStudy.scale.y = roofStudy.frameScaleY;
  roofFrameStudy.position.y = roofStudy.frameOffsetY;
  roofFrameStudy.userData.evidence = "INFERRED_GEOMETRY_SCALED_TO_PUBLIC_PITCH";
  frameGroup.add(roofFrameStudy);
  buildGableAndRafters(roofFrameStudy, mats);
  // The illustrative frame's top rafters can intersect the roof skin.
  // Show them only when the user explicitly inspects structure (frame/explode).
  roofFrameStudy.visible = false;
  roofGroup.rotation.y = Math.PI / 2;
  roofGroup.userData.studyPitchDeg = roofStudy.pitchDeg;
  roofGroup.userData.studyRidgeElevation = roofStudy.ridgeY;
  roofGroup.userData.reference = "Putuo District 2025 public description (26 degree roof slope); NOT a measured roof section";
  const mainRoofSkin = buildRoof(roofGroup, {
    width: roofStudy.width, depth: roofStudy.depth,
    baseY: roofStudy.baseY, ridgeY: roofStudy.ridgeY,
    ridgeHalf: roofStudy.ridgeHalf, mats, style: "main"
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
  const listenerController = new AbortController();
  const listenerOptions = { signal: listenerController.signal };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const interactiveGroups = [baseGroup, frameGroup, columnGroup, roofGroup, extraRoofGroup, qingExtensionGroup];
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeView = "outside";
  const isCourtyardWalk = () => activeView === "walk" || activeView === "threshold";
  const isWalkView = () => isCourtyardWalk() || activeView === "interior-walk";
  let walkYaw = 0;
  let walkPitch = 0;
  let lookDrag = null;
  let lastVisitZone = "";
  const visitColor = new THREE.Color("#e2e7df");
  const archiveColor = new THREE.Color("#f0f3f0");
  let exploded = false;
  let explosionTarget = 0;
  let explosionAmount = 0;
  let explosionFocus = "all";
  let zoomReferenceDistance = 0;
  let zoomPercent = 100;
  let frameMode = false;
  let cutaway = false;
  let currentStage = 0;
  let qingOpacity = 0;
  const fadeMaterialCache = new WeakMap();
  let cameraTween = null;
  let cameraTouched = false;
  let disposed = false;
  let readyCalled = false;
  let raf = 0;
  let lastTime = performance.now();

  function responsiveHomeFov() {
    const aspect = frame.clientWidth / Math.max(frame.clientHeight, 1);
    const progress = THREE.MathUtils.smoothstep(aspect, 0.5, 1.25);
    return THREE.MathUtils.lerp(52, 37, progress);
  }

  function responsiveHomePosition() {
    const aspect = frame.clientWidth / Math.max(frame.clientHeight, 1);
    const fov = responsiveHomeFov();
    const offset = CAMERA_HOME.clone().sub(TARGET_HOME);
    const horizontalDistance = Math.hypot(offset.x, offset.z);
    const projectedHalfWidth = (17.25 / 2) * Math.abs(offset.z / horizontalDistance)
      + (16.8 / 2) * Math.abs(offset.x / horizontalDistance);
    const horizontalHalfFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect);
    const requiredDistance = projectedHalfWidth / Math.tan(horizontalHalfFov) * 1.12;
    const distanceScale = Math.max(1, requiredDistance / offset.length());
    return TARGET_HOME.clone().add(offset.multiplyScalar(distanceScale));
  }

  function responsiveTopPosition() {
    const aspect = frame.clientWidth / Math.max(frame.clientHeight, 1);
    const halfSpan = 9.35;
    const distance = halfSpan / (Math.tan(THREE.MathUtils.degToRad(52 / 2)) * Math.max(aspect, 0.55));
    return new THREE.Vector3(0.2, Math.max(20, distance), 0.4);
  }

  function setGroupOpacity(root, opacity) {
    root.traverse((node) => {
      if (!node.isMesh && !node.isLine) return;
      let materials = fadeMaterialCache.get(node);
      if (!materials) {
        const originals = Array.isArray(node.material) ? node.material : [node.material];
        const copies = originals.map((material) => material.clone());
        materials = {
          original: node.material,
          copies: Array.isArray(node.material) ? copies : copies[0],
          opacity: originals.map((material) => material.opacity),
          depthWrite: originals.map((material) => material.depthWrite)
        };
        fadeMaterialCache.set(node, materials);
      }
      if (opacity >= 0.995) {
        node.material = materials.original;
        return;
      }
      node.material = materials.copies;
      const copies = Array.isArray(materials.copies) ? materials.copies : [materials.copies];
      copies.forEach((material, index) => {
        material.transparent = true;
        material.opacity = materials.opacity[index] * opacity;
        material.depthWrite = opacity > 0.92 ? materials.depthWrite[index] : false;
      });
    });
  }

  function setStage(stage) {
    currentStage = THREE.MathUtils.clamp(Number(stage) || 0, 0, 3);
    if (currentStage <= 1) qingOpacity = currentStage;
    else if (currentStage <= 2) qingOpacity = 2 - currentStage;
    else qingOpacity = 0;
    qingOpacity = THREE.MathUtils.clamp(qingOpacity, 0, 1);
    extraRoofGroup.visible = qingOpacity > 0.005;
    extraRoofGroup.position.y = 1.08 * (1 - qingOpacity) + explosionAmount * 0.78;
    extraRoofGroup.scale.x = 1 + qingOpacity * 0.15;
    roofGroup.scale.x = 1;
    qingExtensionGroup.visible = qingOpacity > 0.005;
    setGroupOpacity(extraRoofGroup, qingOpacity);
    setGroupOpacity(qingExtensionGroup, qingOpacity);
    extraRoofSkin.visible = !frameMode && qingOpacity > 0.005;
    ginkgo.setStage(currentStage);
  }

  function moveCamera(position, target, nextView) {
    cameraTween = {
      startTime: performance.now(),
      duration: reducedMotionQuery.matches ? 1 : 850,
      fromPosition: camera.position.clone(),
      toPosition: position.clone(),
      fromTarget: controls.target.clone(),
      toTarget: target.clone()
    };
    activeView = nextView;
    controls.enabled = !isWalkView();
    visitCourtyard.setVisible(isCourtyardWalk());
    scene.background.copy(isWalkView() ? visitColor : archiveColor);
    scene.fog.color.copy(scene.background);
    scene.fog.near = isWalkView() ? 28 : 48;
    scene.fog.far = isWalkView() ? 71 : 96;
    if (isWalkView()) {
      const toward = target.clone().sub(position).normalize();
      walkYaw = Math.atan2(toward.x, -toward.z);
      walkPitch = Math.asin(THREE.MathUtils.clamp(toward.y, -1, 1));
    } else {
      lastVisitZone = "";
    }
    zoomReferenceDistance = position.distanceTo(target);
    zoomPercent = 100;
    const zoomInput = document.querySelector("#zoomSlider");
    if (zoomInput) zoomInput.value = "100";
    const zoomOutput = document.querySelector("#zoomValue");
    if (zoomOutput) zoomOutput.textContent = "100%";
    ceilingRafterStudy.visible = frameMode || exploded || activeView === "inside";
    camera.fov = nextView === "top" ? 52 : nextView === "courtyard" ? 46 : isWalkView() ? 67 : nextView === "outside" ? responsiveHomeFov() : 37;
    camera.updateProjectionMatrix();
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
    controls.maxDistance = nextView === "inside" ? 8.5 : nextView === "eave" ? 17 : 42;
    if (!isWalkView()) controls.update();
    document.getElementById("walkPad").classList.toggle("is-visible", nextView === "inside" || isWalkView());
    document.getElementById("exploreHint").textContent = isWalkView()
      ? "拖动转头 · WASD 走动 · 移动端使用方向按键"
      : nextView === "inside" ? "WASD 移动 · 佛像轮廓为待核占位"
      : nextView === "eave" ? "檐下近观 · 拖动查看瓦当与补间斗栱" : "拖动环绕 · 滚轮缩放 · 右键平移";
  }

  function setView(view) {
    cameraTouched = false;
    if (view !== "inside") moving.clear();
    if (view === "inside") {
      moveCamera(new THREE.Vector3(0, 2.05, 4.2), new THREE.Vector3(0, 2.5, -2.4), "inside");
    } else if (view === "interior-walk") {
      // Inside is first-person too. The silhouette altar is research-only:
      // this is not a survey or a documented original Buddha sculpture.
      moveCamera(new THREE.Vector3(0, 1.72, 4.5), new THREE.Vector3(0, 2.55, -2.6), "interior-walk");
    } else if (view === "walk") {
      // Human-height first-person visit from an illustrative open courtyard.
      moveCamera(new THREE.Vector3(0, 1.72, 24), new THREE.Vector3(0, 3.25, 6), "walk");
    } else if (view === "threshold") {
      // Human-height vantage under the eave, NOT an invented historical doorway.
      moveCamera(new THREE.Vector3(1.5, 1.72, 10.2), new THREE.Vector3(1.25, 6.38, 6.56), "threshold");
    } else if (view === "courtyard") {
      // Separate contemplative sightline for mobile users whose default tight
      // framing crops the ginkgo. The planted x/z remains a declared study.
      moveCamera(new THREE.Vector3(27.2, 11.5, 14.5),
        new THREE.Vector3(12.9, 6.2, -6.2), "courtyard");
    } else if (view === "eave") {
      // Close-up based on the main front eave + real model bracket stations.
      // No generic dolly zoom overlaid onto a photo plane.
      moveCamera(new THREE.Vector3(5.6, 5.75, 11.7),
        new THREE.Vector3(1.2, 6.45, 6.65), "eave");
    } else if (view === "top") {
      moveCamera(responsiveTopPosition(), new THREE.Vector3(0, 0.7, 0), "top");
    } else {
      moveCamera(responsiveHomePosition(), TARGET_HOME, "outside");
    }
    document.querySelectorAll(".view-button[data-view]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.view === view);
    });
  }

  function setExplosion(value) {
    explosionTarget = sanitizeExplosion(value);
    exploded = explosionTarget > 0.003;
    roofFrameStudy.visible = exploded || frameMode;
    ceilingRafterStudy.visible = exploded || frameMode || activeView === "inside";
    return explosionTarget;
  }

  function toggleExploded(force) {
    const next = typeof force === "boolean" ? (force ? 1 : 0) : (explosionTarget > 0.003 ? 0 : 1);
    setExplosion(next);
    return exploded;
  }

  function setExplosionFocus(value) {
    explosionFocus = sanitizeFocus(value);
    return explosionFocus;
  }

  function setZoomPercent(value) {
    const numeric = Number(value);
    zoomPercent = Number.isFinite(numeric) ? THREE.MathUtils.clamp(numeric,60,180) : 100;
    if (!zoomReferenceDistance) zoomReferenceDistance = camera.position.distanceTo(controls.target);
    const radius = THREE.MathUtils.clamp(zoomReferenceDistance / (zoomPercent / 100),
      controls.minDistance + 0.08, controls.maxDistance - 0.08);
    cameraTween = null;
    cameraTouched = true;
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(direction, radius);
    controls.update();
    return zoomPercent;
  }

  function setSeason(value) { return ginkgo.setSeason(value); }
  function setTreeVisible(value) { return ginkgo.setEnabled(value); }

  function toggleFrame(force) {
    frameMode = typeof force === "boolean" ? force : !frameMode;
    roofFrameStudy.visible = frameMode || exploded;
    ceilingRafterStudy.visible = frameMode || exploded || activeView === "inside";
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
    cameraTouched = false;
    // Reset previous user zoom BEFORE creating the home-view tween.
    setZoomPercent(100);
    setView("outside");
    toggleExploded(false);
    setExplosionFocus("all");
    toggleFrame(false);
    toggleCutaway(false);
    document.getElementById("explodeToggle").setAttribute("aria-pressed", "false");
    document.getElementById("frameToggle").setAttribute("aria-pressed", "false");
    document.getElementById("cutawayToggle").setAttribute("aria-pressed", "false");
  }

  async function exportGLB() {
    const exportRoot = hall.clone(true);
    exportRoot.traverse((node) => {
      if (node.userData.isRoofSkin || ["roof-framing-axis-study","upper-interior-rafter-study"].includes(node.name)) node.visible = true;
      if (["single-eave-roof", "Qing-period-added-eave-study", "timber-frame", "sixteen-column-grid", "Qing-period-five-bay-outline-study"].includes(node.name)) node.position.y = 0;
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
  canvas.addEventListener("pointerdown", (event) => { downPoint = { x: event.clientX, y: event.clientY }; }, listenerOptions);
  canvas.addEventListener("pointerup", (event) => {
    if (!downPoint) return;
    if (Math.hypot(event.clientX - downPoint.x, event.clientY - downPoint.y) < 5) selectAt(event);
    downPoint = null;
  }, listenerOptions);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault(), listenerOptions);
  canvas.addEventListener("click", () => canvas.focus({ preventScroll: true }), listenerOptions);

  // First-person looking is not OrbitControls: orbiting would move the visitor
  // bodily around a pivot and destroy the architectural scale illusion.
  canvas.addEventListener("pointerdown",event=>{
    if(!isWalkView()||event.button!==0)return;
    lookDrag={id:event.pointerId,x:event.clientX,y:event.clientY};
    canvas.setPointerCapture(event.pointerId);
  },listenerOptions);
  canvas.addEventListener("pointermove",event=>{
    if(!isWalkView()||!lookDrag||event.pointerId!==lookDrag.id)return;
    const dx=event.clientX-lookDrag.x,dy=event.clientY-lookDrag.y;
    if(Math.abs(dx)+Math.abs(dy)<0.3)return;
    cameraTween=null;
    walkYaw-=dx*0.0035;
    walkPitch=THREE.MathUtils.clamp(walkPitch-dy*0.0031,-.47,1.1);
    lookDrag.x=event.clientX;lookDrag.y=event.clientY;
  },listenerOptions);
  const clearLook=(event)=>{if(lookDrag&&event.pointerId===lookDrag.id)lookDrag=null;};
  canvas.addEventListener("pointerup",clearLook,listenerOptions);
  canvas.addEventListener("pointercancel",clearLook,listenerOptions);

  function rotateCameraBy(horizontal, vertical) {
    if (isWalkView()) {
      cameraTween=null;
      walkYaw-=horizontal;
      walkPitch=THREE.MathUtils.clamp(walkPitch-vertical,-.47,1.1);
      return;
    }
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
  // Immediate small displacement makes a single key tap meaningful even
  // when software WebGL is rendering slower than the user's key press.
  // Held movement continues in animate(); key repeat does not add extra jumps.
  function initialWalkStep(key) {
    if(!isWalkView()) return;
    if(cameraTween) {
      camera.position.copy(cameraTween.toPosition);
      controls.target.copy(cameraTween.toTarget);
      cameraTween=null;
    }
    const step=.21;
    const fwdX=Math.sin(walkYaw),fwdZ=-Math.cos(walkYaw);
    const rightX=Math.cos(walkYaw),rightZ=Math.sin(walkYaw);
    const dx=key==="w"?fwdX*step:key==="s"?-fwdX*step:key==="d"?rightX*step:-rightX*step;
    const dz=key==="w"?fwdZ*step:key==="s"?-fwdZ*step:key==="d"?rightZ*step:-rightZ*step;
    if(activeView==="interior-walk") {
      let x=THREE.MathUtils.clamp(camera.position.x+dx,-5.75,5.75);
      let z=THREE.MathUtils.clamp(camera.position.z+dz,-5.75,5.75);
      const blocked=(px,pz)=>POST_X.some(cx=>POST_Z.some(cz=>Math.hypot(px-cx,pz-cz)<.52))
        || (pz < -3.05 && Math.abs(px)<1.68);
      if(blocked(x,z)) {if(!blocked(x,camera.position.z))z=camera.position.z;
        else if(!blocked(camera.position.x,z))x=camera.position.x;
        else {x=camera.position.x;z=camera.position.z;}}
      camera.position.x=x;camera.position.z=z;
    } else {
      camera.position.x=THREE.MathUtils.clamp(camera.position.x+dx,-6.25,6.25);
      camera.position.z=THREE.MathUtils.clamp(camera.position.z+dz,8.3,30.3);
    }
  }
  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    const editing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if (editing) return;
    if (key === "escape") {
      const inspector = document.getElementById("componentInspector");
      if (inspector && !inspector.hidden) {
        event.preventDefault();
        inspector.hidden = true;
        document.querySelectorAll(".scene-pin").forEach((pin) => pin.classList.remove("is-selected"));
        canvas.focus({ preventScroll: true });
      } else if (activeView === "inside") {
        event.preventDefault();
        setView("outside");
      }
      return;
    }
    if (["w", "a", "s", "d"].includes(key) && (activeView === "inside" || isWalkView())) {
      event.preventDefault();
      if(isWalkView() && !event.repeat && !moving.has(key)) initialWalkStep(key);
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
  window.addEventListener("keydown", onKeyDown, listenerOptions);
  window.addEventListener("keyup", onKeyUp, listenerOptions);
  window.addEventListener("blur", onBlur, listenerOptions);

  document.querySelectorAll(".walk-pad [data-move]").forEach((button) => {
    const directions = { forward: "w", back: "s", left: "a", right: "d" };
    const key = directions[button.dataset.move];
    const press = () => { setMove(key, true); button.setAttribute("aria-pressed", "true"); };
    const release = () => { setMove(key, false); button.setAttribute("aria-pressed", "false"); };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.focus({ preventScroll: true });
      button.setPointerCapture(event.pointerId);
      press();
    }, listenerOptions);
    button.addEventListener("pointerup", release, listenerOptions);
    button.addEventListener("pointercancel", release, listenerOptions);
    button.addEventListener("lostpointercapture", release, listenerOptions);
    button.addEventListener("keydown", (event) => {
      if (["Enter", " ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        press();
      }
    }, listenerOptions);
    button.addEventListener("keyup", (event) => {
      if (["Enter", " ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        release();
      }
    }, listenerOptions);
    button.addEventListener("blur", release, listenerOptions);
  });

  const onVisibilityChange = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!disposed && !raf) {
      lastTime = performance.now();
      raf = requestAnimationFrame(animate);
    }
  };
  document.addEventListener("visibilitychange", onVisibilityChange, listenerOptions);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(frame);
  function resize() {
    const width = Math.max(1, frame.clientWidth);
    const height = Math.max(1, frame.clientHeight);
    camera.aspect = width / height;
    if (activeView === "outside") camera.fov = responsiveHomeFov();
    else if (activeView === "top") camera.fov = 52;
    else if (activeView === "courtyard") camera.fov = 46;
    else if (isWalkView()) camera.fov = 67;
    else camera.fov = 37;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (activeView === "outside" && !cameraTouched) {
      const homePosition = responsiveHomePosition();
      const homeTarget = TARGET_HOME.clone();
      if (cameraTween) {
        cameraTween.toPosition = homePosition;
        cameraTween.toTarget = homeTarget;
      } else {
        camera.position.copy(homePosition);
        controls.target.copy(homeTarget);
        controls.update();
      }
    } else if (activeView === "top" && !cameraTouched) {
      const topPosition = responsiveTopPosition();
      const topTarget = new THREE.Vector3(0, 0.7, 0);
      if (cameraTween) {
        cameraTween.toPosition = topPosition;
        cameraTween.toTarget = topTarget;
      } else {
        camera.position.copy(topPosition);
        controls.target.copy(topTarget);
        controls.update();
      }
    }
  }
  resize();

  function updatePins() {
    const rect = frame.getBoundingClientRect();
    const bounds = { left: 16, right: rect.width - 16, top: 100, bottom: rect.height - 114 };
    const obstacles = [...document.querySelectorAll(".hero-copy, .viewer-topline, .view-tools, .viewer-bottom, .component-inspector, .walk-pad")]
      .filter((element) => getComputedStyle(element).display !== "none" && getComputedStyle(element).visibility !== "hidden")
      .map((element) => {
        const box = element.getBoundingClientRect();
        return { left: box.left - rect.left - 6, right: box.right - rect.left + 6, top: box.top - rect.top - 6, bottom: box.bottom - rect.top + 6 };
      });
    const candidates = [];
    for (const [part, element] of Object.entries(pins)) {
      const point = pinAnchors[part].clone().project(camera);
      const x = (point.x * 0.5 + 0.5) * rect.width;
      const y = (-point.y * 0.5 + 0.5) * rect.height;
      const visible = point.z > -1 && point.z < 1 && x > 10 && x < rect.width - 10 && y > 10 && y < rect.height - 10 && activeView === "outside";
      element.classList.toggle("is-visible", visible);
      if (visible) candidates.push({ element, x, y, part });
    }
    candidates.sort((a, b) => a.y - b.y || a.x - b.x);
    const placed = [];
    const overlaps = (a, b, gap = 8) => !(a.right + gap <= b.left || a.left - gap >= b.right || a.bottom + gap <= b.top || a.top - gap >= b.bottom);
    for (const item of candidates) {
      const width = item.element.offsetWidth || 68;
      const height = item.element.offsetHeight || 24;
      const stepX = width + 16;
      const stepY = height + 12;
      const offsets = [[0, 0], [0, -stepY], [0, stepY], [stepX, 0], [-stepX, 0], [stepX, -stepY], [-stepX, -stepY], [stepX, stepY], [-stepX, stepY], [0, -stepY * 2], [0, stepY * 2], [stepX * 2, 0], [-stepX * 2, 0]];
      let chosen = null;
      for (const [dx, dy] of offsets) {
        const cx = THREE.MathUtils.clamp(item.x + dx, bounds.left + width / 2, bounds.right - width / 2);
        const cy = THREE.MathUtils.clamp(item.y + dy, bounds.top + height / 2, bounds.bottom - height / 2);
        const box = { left: cx - width / 2, right: cx + width / 2, top: cy - height / 2, bottom: cy + height / 2 };
        if (![...placed, ...obstacles].some((other) => overlaps(box, other))) { chosen = { x: cx, y: cy, box }; break; }
      }
      if (!chosen) {
        const cx = THREE.MathUtils.clamp(item.x, bounds.left + width / 2, bounds.right - width / 2);
        const cy = THREE.MathUtils.clamp(item.y, bounds.top + height / 2, bounds.bottom - height / 2);
        chosen = { x: cx, y: cy, box: { left: cx - width / 2, right: cx + width / 2, top: cy - height / 2, bottom: cy + height / 2 } };
      }
      item.element.style.left = String(chosen.x) + "px";
      item.element.style.top = String(chosen.y) + "px";
      placed.push(chosen.box);
    }
  }
  Object.values(pins).forEach((element) => {
    element.addEventListener("click", () => onPart(element.dataset.part), listenerOptions);
  });

  function getVisitPose() {
    return { x: camera.position.x, z: camera.position.z, yaw: walkYaw };
  }
  function addVisitTrace(part="dougong", id="local", seconds=85) {
    return visitCourtyard.leaveTrace(id,part,performance.now(),seconds);
  }
  function setRemoteVisitor(peer) { remoteVisitors.upsert(peer); }
  function removeRemoteVisitor(id) { remoteVisitors.remove(id); }
  function clearRemoteVisitors() { remoteVisitors.clear(); }

  function getSceneState() {
    return {
      visit:{active:isWalkView(), traces:visitCourtyard.getTraceCount(),
        leaves:visitCourtyard.getLeafState(),
        remoteVisitors:remoteVisitors.count, pose:getVisitPose(),
        movementKeys:[...moving], transitioning:Boolean(cameraTween)},
      stage: currentStage,
      view: activeView,
      exploded,
      explosionTarget,
      explosionFocus,
      zoomPercent,
      ginkgo: ginkgo.getState(),
      frameMode,
      cutaway,
      qingRoofVisible: extraRoofGroup.visible,
      qingExtensionVisible: qingExtensionGroup.visible,
      mainRoofSurfaceVisible: mainRoofSkin.visible,
      lowerRoofSurfaceVisible: extraRoofSkin.visible,
      camera: camera.position.toArray(),
      target: controls.target.toArray(),
      mainRoofOffset: roofGroup.position.y,
      frameOffset: frameGroup.position.y,
      columnOffset: columnGroup.position.y,
      lowerEaveOffset: extraRoofGroup.position.y
    };
  }
  function getDiagnostics() {
    let objects = 0;
    let renderables = 0;
    scene.traverse((node) => { objects += 1; if (node.isMesh || node.isLine || node.isPoints) renderables += 1; });
    return {
      revision: THREE.REVISION,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      objects,
      renderables,
      pixelRatio: renderer.getPixelRatio()
    };
  }
  if (new URLSearchParams(window.location.search).get("qa") === "1") {
    window.__zhenruQA = {
      getSceneState, getDiagnostics,
      getGinkgoScreenBounds() {
        if (!ginkgo.root.visible) return null;
        camera.updateMatrixWorld(true);
        ginkgo.root.updateMatrixWorld(true);
        const box=new THREE.Box3().setFromObject(ginkgo.root,true);
        const local=renderer.domElement.getBoundingClientRect();
        const corners=[
          [box.min.x,box.min.y,box.min.z],[box.min.x,box.min.y,box.max.z],
          [box.min.x,box.max.y,box.min.z],[box.min.x,box.max.y,box.max.z],
          [box.max.x,box.min.y,box.min.z],[box.max.x,box.min.y,box.max.z],
          [box.max.x,box.max.y,box.min.z],[box.max.x,box.max.y,box.max.z]
        ].map(pos=>new THREE.Vector3(...pos).project(camera));
        const trunk=ginkgo.root.localToWorld(new THREE.Vector3(0,4.15,0)).project(camera);
        return {left:Math.min(...corners.map(p=>local.left+(p.x+1)*local.width/2)),
          right:Math.max(...corners.map(p=>local.left+(p.x+1)*local.width/2)),
          top:Math.min(...corners.map(p=>local.top+(1-p.y)*local.height/2)),
          bottom:Math.max(...corners.map(p=>local.top+(1-p.y)*local.height/2)),
          trunkX:local.left+(trunk.x+1)*local.width/2,
          trunkY:local.top+(1-trunk.y)*local.height/2};
      },
      getRoofCalibration() {
        roofGroup.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(mainRoofSkin);
        return {
          pitchDeg: roofStudy.pitchDeg,
          ridgeY: roofStudy.ridgeY,
          meshTopY: box.max.y,
          meshBottomY: box.min.y,
          frameScaleY: roofFrameStudy.scale.y,
          framingStudyVisible: roofFrameStudy.visible,
          ceilingRafterStudyVisible: ceilingRafterStudy.visible,
          roofTopology: mainRoofSkin.parent.userData.roofTopology,
          infillBracketCount: frameGroup.userData.infillBracketCount
        };
      }
    };
  }

  function animate(now) {
    if (disposed || document.hidden) { raf = 0; return; }
    raf = requestAnimationFrame(animate);
    const elapsed = Math.max(0, (now - lastTime) / 1000);
    const delta = Math.min(elapsed, 0.05);
    // Human walking must remain time-based under low-fps software WebGL.
    // This bounded integration avoids both slow-motion and tab-resume jumps.
    const walkDelta = Math.min(elapsed, 0.24);
    lastTime = now;
    explosionAmount = THREE.MathUtils.damp(explosionAmount, explosionTarget, 9, delta);
    const weights = explosionWeights(explosionFocus);
    frameGroup.position.y = explosionAmount * 0.78 * weights.frame;
    columnGroup.position.y = explosionAmount * 0.28 * weights.columns;
    roofGroup.position.y = explosionAmount * 2.25 * weights.roof;
    extraRoofGroup.position.y = 1.08 * (1 - qingOpacity) + explosionAmount * 1.36 * weights.extension;
    qingExtensionGroup.position.y = explosionAmount * 0.32 * weights.frame;
    ginkgo.tick(now / 1000, reducedMotionQuery.matches);
    visitCourtyard.tick(now);
    visitCourtyard.updateLooseLeaves(now,isCourtyardWalk()?
      {x:camera.position.x,z:camera.position.z}:null,reducedMotionQuery.matches);
    remoteVisitors.tick(delta,now);
    if (cameraTween) {
      const t = Math.min((now - cameraTween.startTime) / cameraTween.duration, 1);
      const eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
      controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
      if (isWalkView())camera.lookAt(controls.target);
      if (t >= 1) cameraTween = null;
    }
    if (moving.size && isWalkView() && !cameraTween) {
      const forward = new THREE.Vector3(Math.sin(walkYaw),0,-Math.cos(walkYaw));
      const right = new THREE.Vector3(Math.cos(walkYaw),0,Math.sin(walkYaw));
      const direction = new THREE.Vector3();
      if(moving.has("w"))direction.add(forward);
      if(moving.has("s"))direction.sub(forward);
      if(moving.has("a"))direction.sub(right);
      if(moving.has("d"))direction.add(right);
      if(direction.lengthSq()>0) {
        direction.normalize().multiplyScalar(walkDelta*2.05);
        if (activeView === "interior-walk") {
          const startX=camera.position.x,startZ=camera.position.z;
          let x=THREE.MathUtils.clamp(startX+direction.x,-5.75,5.75);
          let z=THREE.MathUtils.clamp(startZ+direction.z,-5.75,5.75);
          const blocked=(px,pz)=>POST_X.some(cx=>POST_Z.some(cz=>Math.hypot(px-cx,pz-cz)<.52))
            || (pz < -3.05 && Math.abs(px)<1.68);
          if(blocked(x,z)) {if(!blocked(x,startZ))z=startZ;else if(!blocked(startX,z))x=startX;else{x=startX;z=startZ;}}
          camera.position.x=x;camera.position.z=z;
        } else {
          camera.position.x = THREE.MathUtils.clamp(camera.position.x+direction.x,-6.25,6.25);
          camera.position.z = THREE.MathUtils.clamp(camera.position.z+direction.z,8.3,30.3);
        }
      }
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
        const startX = camera.position.x;
        const startZ = camera.position.z;
        let nextX = THREE.MathUtils.clamp(startX + velocity.x, -5.9, 5.9);
        let nextZ = THREE.MathUtils.clamp(startZ + velocity.z, -5.9, 5.9);
        const blocked = (x, z) => POST_X.some((postX) => POST_Z.some((postZ) => Math.hypot(x - postX, z - postZ) < 0.5))
          || (z < -3.05 && Math.abs(x) < 1.68);
        if (blocked(nextX, nextZ)) {
          if (!blocked(nextX, startZ)) nextZ = startZ;
          else if (!blocked(startX, nextZ)) nextX = startX;
          else { nextX = startX; nextZ = startZ; }
        }
        if (nextX !== startX || nextZ !== startZ) {
          const dx = nextX - startX;
          const dz = nextZ - startZ;
          camera.position.x = nextX;
          camera.position.z = nextZ;
          controls.target.x += dx;
          controls.target.z += dz;
        }
        camera.position.y = 2.1;
      }
    }
    if (isWalkView()) {
      if (!cameraTween) {
        const look = new THREE.Vector3(
          Math.sin(walkYaw)*Math.cos(walkPitch),
          Math.sin(walkPitch),
          -Math.cos(walkYaw)*Math.cos(walkPitch)
        );
        controls.target.copy(camera.position).addScaledVector(look, 8);
        camera.lookAt(controls.target);
      }
      const zone=activeView==="interior-walk"?"interior":camera.position.z<13.2?"eave":"courtyard";
      if(lastVisitZone!==zone){lastVisitZone=zone;onVisitZone?.(zone);}
    } else {
      controls.update();
    }
    updatePins();
    renderer.render(scene, camera);
    if (!readyCalled && now > 600) {
      readyCalled = true;
      onReady();
    }
  }
  raf = document.hidden ? 0 : requestAnimationFrame(animate);

  return {
    setStage,
    setView,
    setExplosion,
    setExplosionFocus,
    setZoomPercent,
    setSeason,
    setTreeVisible,
    getVisitPose,
    addVisitTrace,
    setRemoteVisitor,
    removeRemoteVisitor,
    clearRemoteVisitors,
    toggleExploded,
    toggleFrame,
    toggleCutaway,
    resetView,
    exportGLB,
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      listenerController.abort();
      controls.removeEventListener("start", cancelCameraTween);
      controls.dispose();
      visitCourtyard.dispose();
      remoteVisitors.clear();
      if (window.__zhenruQA) delete window.__zhenruQA;
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
  scene.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x98a19b, transparent: true, opacity: 0.15 })));
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
  const ceilingStudy = new THREE.Group();
  ceilingStudy.name = "upper-interior-rafter-study";
  ceilingStudy.userData.part = "frame";
  ceilingStudy.visible = false;
  group.add(ceilingStudy);
  buildCeilingFrame(ceilingStudy, mats);
  return ceilingStudy;
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
  // Research geometry only, not verified historic joinery.
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
  const roof = createHipGableStudy({ width, depth, baseY, ridgeY, ridgeHalf });
  const root = new THREE.Group();
  root.userData.part = "roof";
  root.userData.topology = "SINGLE_EAVE_HIP_GABLE_NINE_RIDGE_STUDY";
  root.userData.evidence = "PUBLIC_STYLE + INFERRED_3D_SURFACES_NOT_SURVEY";
  parent.add(root);

  const skin = new THREE.Group();
  skin.userData.part = "roof";
  skin.userData.isRoofSkin = true;
  skin.name = "one-main-four-vertical-four-hip-ridge-roof";
  root.add(skin);
  const compact = window.innerWidth <= 720 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const mainBays = compact ? 18 : 26, mainCourses = compact ? 12 : 20;
  const hipBays = compact ? 11 : 17, hipCourses = compact ? 9 : 15;
  const wingBays = compact ? 3 : 5, wingCourses = compact ? 6 : 10;
  const roofFace = mats.roof.clone();
  const hipFace = mats.roofSide.clone();
  roofFace.side = hipFace.side = THREE.DoubleSide;
  // Two broad transverse main slopes, from longitudinal ridge to side eaves.
  for (const signX of [-1,1]) {
    const fn=(u,v)=>roof.main(signX,u,v);
    const mesh=surfacePatch(skin,fn,roofFace,"roof",32,21);
    mesh.name = `main tiled slope ${signX}`;
    mesh.userData.evidence = "HIP_GABLE_TOPOLOGY_INFERRED";
    addRoofTileStudy(skin,fn,mats,{bays:mainBays,courses:mainCourses,label:`main-slope-${signX}`});
  }
  // End hip slopes start below a separate dark triangular gable wall.
  for (const signZ of [-1,1]) {
    const fn=(u,v)=>roof.end(signZ,u,v);
    const mesh=surfacePatch(skin,fn,hipFace,"roof",24,14);
    mesh.name=`lower hip-end surface ${signZ}`;
    mesh.userData.evidence="HIP_GABLE_TOPOLOGY_INFERRED";
    addRoofTileStudy(skin,fn,mats,{bays:hipBays,courses:hipCourses,label:`end-hip-${signZ}`});

    const gableOutline = new THREE.Shape();
    gableOutline.moveTo(-roof.shoulderX,roof.shoulderY);
    for(let i=0;i<=28;i++) {
      const x=-roof.shoulderX+2*roof.shoulderX*i/28;
      gableOutline.lineTo(x,roof.gableTop(x));
    }
    gableOutline.lineTo(roof.shoulderX,roof.shoulderY);
    gableOutline.closePath();
    const wall = new THREE.Mesh(new THREE.ShapeGeometry(gableOutline),mats.woodDark.clone());
    wall.material.side=THREE.DoubleSide;
    wall.name=`gable timber triangle / study ${signZ}`;
    wall.position.z=signZ*(roof.ridgeHalf+0.018);
    wall.userData.part="roof";
    wall.userData.evidence="PHOTO_OBSERVED_GABLE_INFERRED_PANEL_SPACING";
    wall.receiveShadow=true;
    skin.add(wall);

    // Fine dark vertical boarding creates scale, not a claim about real joinery.
    const boardLines=[];
    for(let i=-6;i<=6;i++) {
      const x=i*roof.shoulderX/7;
      const top=roof.gableTop(x)-0.08;
      if(top>roof.shoulderY+0.10) {
        boardLines.push(x,roof.shoulderY+0.055,signZ*(roof.ridgeHalf+0.045),
          x,top,signZ*(roof.ridgeHalf+0.045));
      }
    }
    addLineSegments(skin,boardLines,new THREE.LineBasicMaterial({
      color:0x8f816d,transparent:true,opacity:0.42
    }),"roof");
    const boji=[];
    for(let i=0;i<=18;i++) {
      const t=-1+2*i/18;
      boji.push([roof.shoulderX*t,roof.shoulderY+0.045,signZ*roof.ridgeHalf]);
    }
    addTube(skin,boji,0.042,mats.woodDark,"roof");
  }
  // Four interlocking triangular corner surfaces. Their edges share exact
  // formulae with BOTH main slopes and hip-end trapezoids.
  for(const signX of [-1,1]) for(const signZ of [-1,1]) {
    const fn=(u,v)=>roof.wing(signX,signZ,u,v);
    const mesh=surfacePatch(skin,fn,roofFace,"roof",12,12);
    mesh.name=`upturned corner wing ${signX}/${signZ}`;
    mesh.userData.evidence="PHOTO_OBSERVED_EAVE_LIFT_INFERRED_SPLINE";
    addRoofTileStudy(skin,fn,mats,{bays:wingBays,courses:wingCourses,label:`wing-${signX}-${signZ}`});
  }
  // 1 main ridge, four descending gable ridges, four diagonal hip ridges.
  addTube(skin,[[0,ridgeY+0.075,-roof.ridgeHalf],[0,ridgeY+0.075,roof.ridgeHalf]],
    0.132,mats.woodDark,"roof");
  for(const signX of [-1,1]) for(const signZ of [-1,1]) {
    const verticalRidge=[];
    for(let i=0;i<=18;i++) {
      const p=roof.gableRim(signX,signZ,i/18);
      verticalRidge.push([p[0],p[1]+0.095,p[2]+signZ*0.035]);
    }
    const ridgeA=addTube(skin,verticalRidge,0.075,mats.woodDark,"roof");
    ridgeA.name=`descending ridge ${signX}/${signZ}`;
    const hipRidge=[];
    for(let i=0;i<=18;i++) {
      const p=roof.hipLine(signX,signZ,i/18);
      hipRidge.push([p[0],p[1]+0.090,p[2]]);
    }
    const ridgeB=addTube(skin,hipRidge,0.079,mats.woodDark,"roof");
    ridgeB.name=`diagonal hip ridge ${signX}/${signZ}`;
  }
  // Exposed eave soffit edges follow the geometric surfaces continuously.
  for (const sx of [-1,1]) {
    const eave=[];
    for(let i=0;i<=36;i++) eave.push(roof.mainEave(sx,roof.halfD*(-1+2*i/36)));
    addTube(skin,eave,0.075,mats.woodDark,"roof");
  }
  for (const sz of [-1,1]) {
    const eave=[];
    for(let i=0;i<=26;i++) eave.push(roof.endEave(sz,-1+2*i/26));
    addTube(skin,eave,0.068,mats.woodEdge,"roof");
    // The ornamental ridge terminal is intentionally abstract and small.
    const terminal=new THREE.Mesh(new THREE.SphereGeometry(0.16,12,8),mats.stoneDark);
    terminal.position.set(0,ridgeY+0.16,sz*roof.ridgeHalf);
    terminal.userData.part="roof";
    terminal.userData.evidence="STUDY_FINIAL_NOT_SCANNED";
    terminal.scale.set(0.67,1.06,0.62);
    skin.add(terminal);
  }
  // Actually modeled eave end discs + shaped drip tiles along all 4 borders.
  // Geometry is instanced into just two draw calls and scales with mobile tier.
  const eaveDetail=addEaveTerminations(skin,roof,mats,{compact});
  root.userData.roofTopology = {
    mainRidges:1,descendingRidges:4,hipRidges:4,
    gableTriangles:2,cornerWings:4,
    shoulderFraction:0.58,cornerLiftM:roof.cornerLift,
    eaveTileEnds:eaveDetail.tileEnds,
    dripTiles:eaveDetail.dripTiles,
    eaveBatchCount:3
  };
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
  const interior = new THREE.Group();
  interior.name = "interior-altar-and-scale-study";
  interior.userData.part = "frame";
  hall.add(interior);

  // The altar is a spatial study. Its dimensions and carving are not surveyed.
  meshBox(interior, [4.25, 0.22, 1.25], [0, 1.1, -3.88], mats.woodDark, "frame");
  meshBox(interior, [3.95, 0.12, 1.12], [0, 1.26, -3.88], mats.woodLight, "frame");
  meshBox(interior, [3.5, 0.42, 0.98], [0, 1.54, -3.82], mats.wood, "frame");
  meshBox(interior, [3.3, 0.1, 1.02], [0, 1.79, -3.82], mats.woodEdge, "frame");
  for (const x of [-1.43, -0.72, 0, 0.72, 1.43]) {
    meshBox(interior, [0.025, 0.32, 0.02], [x, 1.54, -3.315], mats.woodLight, "frame");
  }
  for (const x of [-1.76, 1.76]) {
    meshBox(interior, [0.1, 0.5, 0.08], [x, 1.55, -3.8], mats.woodDark, "frame");
  }

  // Neutral silhouette only: replace after a permitted, multi-view altar survey.
  const silhouetteMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b806b, roughness: 0.78, metalness: 0.02, transparent: true, opacity: 0.76
  });
  const figure = new THREE.Group();
  figure.name = "unverified-statue-silhouette-placeholder";
  figure.userData.part = "frame";
  figure.userData.evidence = "spatial placeholder; iconography and dimensions unverified";
  interior.add(figure);
  const ellipsoid = (radius, scale, position) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 14), silhouetteMaterial);
    mesh.scale.set(...scale);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.userData.part = "frame";
    figure.add(mesh);
  };
  ellipsoid(1, [0.56, 0.27, 0.38], [0, 1.98, -3.78]);
  ellipsoid(1, [0.4, 0.52, 0.32], [0, 2.34, -3.82]);
  ellipsoid(1, [0.57, 0.24, 0.34], [0, 2.57, -3.82]);
  ellipsoid(1, [0.19, 0.16, 0.2], [0, 2.82, -3.8]);
  ellipsoid(1, [0.255, 0.31, 0.25], [0, 3.13, -3.8]);
  ellipsoid(1, [0.09, 0.12, 0.09], [0, 3.53, -3.8]);
  ellipsoid(1, [0.21, 0.13, 0.19], [-0.47, 2.35, -3.78]);
  ellipsoid(1, [0.21, 0.13, 0.19], [0.47, 2.35, -3.78]);

  // A plain backing plane records the altar's depth without inventing ornament.
  meshBox(interior, [4.7, 3.25, 0.12], [0, 3.2, -4.72], mats.woodDark, "frame");
  meshBox(interior, [4.36, 2.92, 0.035], [0, 3.2, -4.64], mats.woodLight, "frame");
}

function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function raised(point) { return [point[0], point[1] + 0.022, point[2]]; }


