/**
 * ZHENRU / Detail Fidelity v3 — public-source-constrained geometric studies.
 * NOT a measured reconstruction, and NOT a claim about actual historic joinery.
 * 1 scene unit = 1 approximate metre. Y is up.
 * These meshes can be individually selected, cut away, exploded and exported.
 */
import * as THREE from 'three';
import { getFacadeInfillPositions, ZHENRU_INFILL_EVIDENCE } from './reconstruction/bracket-layout.mjs';

const WOOD_STUDY = 'PHOTO_OBSERVATION_AND_GEOMETRIC_INFERENCE';
const TILE_STUDY = 'PHOTO_OBSERVATION_AND_GEOMETRIC_INFERENCE';

function tag(node, component, name, evidence = WOOD_STUDY) {
  node.name = name;
  node.userData.part = component;
  node.userData.evidence = evidence;
  node.castShadow = true;
  node.receiveShadow = true;
  return node;
}

function woodPrism(length, height, depth, material, name, axis = 'x') {
  // Gong: rising carved ends and shallow inward relief, not just a rectangular bar.
  const h = length * 0.5;
  const s = new THREE.Shape();
  s.moveTo(-h + 0.14, 0);
  s.lineTo(h - 0.14, 0);
  s.quadraticCurveTo(h - 0.015, 0.01, h, height * 0.34);
  s.lineTo(h, height * 0.72);
  s.quadraticCurveTo(h - 0.09, height * 0.98, h - 0.18, height);
  s.lineTo(-h + 0.18, height);
  s.quadraticCurveTo(-h + 0.09, height * 0.98, -h, height * 0.72);
  s.lineTo(-h, height * 0.34);
  s.quadraticCurveTo(-h + 0.015, 0.01, -h + 0.14, 0);
  const geom = new THREE.ExtrudeGeometry(s, { depth, steps: 1, curveSegments: 5, bevelEnabled: true,
    bevelSegments: 1, bevelThickness: 0.012, bevelSize: 0.012 });
  geom.translate(0, 0, -depth * 0.5);
  const mesh = tag(new THREE.Mesh(geom, material), 'dougong', name);
  if (axis === 'z') mesh.rotation.y = Math.PI * 0.5;
  return mesh;
}

function angPrism(material, axis = 'z') {
  // Decorative false ang, profiled wood; slope is not asserted to match surviving joinery.
  const s = new THREE.Shape();
  s.moveTo(-0.55, -0.045);
  s.lineTo(-0.23, -0.032);
  s.lineTo(0.42, 0.18);
  s.lineTo(0.89, 0.31);
  s.quadraticCurveTo(1.04, 0.35, 1.16, 0.37);
  s.lineTo(1.16, 0.55);
  s.quadraticCurveTo(0.86, 0.56, 0.66, 0.48);
  s.lineTo(0.05, 0.24);
  s.lineTo(-0.55, 0.16);
  s.closePath();
  const geom = new THREE.ExtrudeGeometry(s, { depth: 0.205, steps: 1, curveSegments: 6,
    bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
  geom.translate(0, 0, -0.1025);
  const mesh = tag(new THREE.Mesh(geom, material), 'dougong', 'Ang / false-angled-arm [study]');
  if (axis === 'z') mesh.rotation.y = Math.PI * 0.5;
  return mesh;
}

function block(w, h, d, x, y, z, material, name) {
  const g = new THREE.BoxGeometry(w, h, d);
  return tag(new THREE.Mesh(g, material), 'dougong', name).translateX(x).translateY(y).translateZ(z);
}

function capital(parent, x, z, materials, corner = false, interior = false) {
  const local = new THREE.Group();
  local.position.set(x, 0, z);
  local.name = `${interior ? 'interior' : corner ? 'corner' : 'perimeter'}-bracket-study-[${x.toFixed(2)},${z.toFixed(2)}]`;
  local.userData.part = 'dougong';
  local.userData.grade = 'GEOMETRIC_STUDY_NOT_SURVEY';
  parent.add(local);
  const m = materials;
  const height = interior ? 0.78 : 1;
  function add(mesh) { local.add(mesh); return mesh; }
  // Bearer dou: separate base / throat / upper bearing lips, with readable silhouette.
  add(block(0.53, 0.12, 0.52, 0, 6.01, 0, m.woodDark, 'Bearing dou / foot'));
  add(block(0.37, 0.105, 0.37, 0, 6.12, 0, m.wood, 'Bearing dou / neck'));
  add(block(0.66, 0.085, 0.56, 0, 6.20, 0, m.woodEdge, 'Bearing dou / lip'));
  const a = add(woodPrism(1.31, 0.225 * height, 0.235, m.wood, 'Nidao gong / transverse'));
  a.position.y = 6.25;
  const b = add(woodPrism(1.17, 0.20 * height, 0.205, m.woodLight, 'Cross-bearing gong', 'z'));
  b.position.y = 6.46;
  add(block(0.30, 0.12, 0.33, -0.42, 6.55, 0, m.woodDark, 'Bearing dou / left'));
  add(block(0.30, 0.12, 0.33, 0.42, 6.55, 0, m.woodDark, 'Bearing dou / right'));
  const c = add(woodPrism(1.64, 0.215 * height, 0.22, m.woodEdge, 'Upper gong / horizontal'));
  c.position.y = 6.65;
  // Distinct ang arm on perimeter rather than repeating it on all inner columns.
  if (!interior) {
    const ang = add(angPrism(m.woodLight, 'z'));
    ang.position.y = 6.47;
    ang.rotation.y = (z < 0 ? -1 : 1) * Math.PI * 0.5;
    if (corner) {
      const cornerAng = add(angPrism(m.woodEdge, 'x'));
      cornerAng.position.y = 6.47;
      cornerAng.rotation.y = x < 0 ? Math.PI : 0;
    }
  }
  add(block(1.86, 0.17, 0.27, 0, 6.91, 0, m.woodDark, 'Purlin-bearing / transverse cap'));
  return local;
}

/**
 * Infill (补间铺作) set differs from post-headed and corner sets.
 * Beam-to-dou-to-gong-to-false-ang hierarchy follows visible photographed
 * relationships, not reconstructed hidden tenons or asserted structural forces.
 */
function infillBracket(parent,x,z,m,frontSign) {
  const g=new THREE.Group();
  g.position.set(x,0,z);
  g.name=`补间铺作 / infill bracket [${x.toFixed(2)},${z.toFixed(2)}]`;
  g.userData={part:"dougong",kind:"infill",evidence:"PAPER_2024_COUNT_AND_PHOTO__DIMENSIONS_INFERRED"};
  parent.add(g);
  const a=mesh=>{g.add(mesh);return mesh;};
  a(block(0.43,0.115,0.42,0,6.00,0,m.woodDark,"栌斗 / sill dou"));
  a(block(0.30,0.085,0.31,0,6.105,0,m.wood,"斗口 / raised neck"));
  a(block(0.56,0.080,0.50,0,6.170,0,m.woodEdge,"承托斗 / top lip"));
  const lower=a(woodPrism(1.03,0.190,0.20,m.wood,"泥道栱 / lower scalloped gong"));
  lower.position.y=6.21;
  for(const sign of [-1,1]) {
    a(block(0.23,0.095,0.25,sign*0.35,6.427,0,m.woodDark,"散斗 / side bearing"));
  }
  const cross=a(woodPrism(0.91,0.16,0.19,m.woodLight,"华栱 / perpendicular projection","z"));
  cross.position.y=6.39;
  const angled=a(angPrism(m.woodLight,"z"));
  angled.position.set(0,6.42,frontSign*0.05);
  angled.rotation.y=frontSign*Math.PI/2;
  angled.scale.set(0.88,0.84,0.89);
  const upper=a(woodPrism(1.33,0.16,0.19,m.wood,"令栱 / upper spread"));
  upper.position.y=6.57;
  const inner=a(block(0.19,0.63,0.16,0,6.57,-frontSign*0.34,m.woodDark,"挑斡 / inclined inside support"));
  inner.rotation.x=-frontSign*0.47;
  a(block(1.53,0.15,0.23,0,6.84,0,m.woodDark,"撩檐枋 / perimeter bearing"));
  return g;
}

/** Replace schematic rectangular block-stacks with named study components.
 * xs,zs are the existing 16-column grid: no historical claim that all supports
 * retained an identical bracket configuration. Interior units are simplified.
 */
export function populateDougongStudy(parent, xs, zs, materials) {
  xs.forEach((x, ix) => zs.forEach((z, iz) => {
    const edgeX = ix === 0 || ix === xs.length - 1;
    const edgeZ = iz === 0 || iz === zs.length - 1;
    capital(parent, x, z, materials, edgeX && edgeZ, !edgeX && !edgeZ);
  }));
  // The source documents four infill sets in the central bay and two in each
  // side bay on both front/rear eaves, in addition to column-headed sets.
  const infillXs=getFacadeInfillPositions(xs);
  for (const z of [zs[0],zs[zs.length-1]]) {
    const frontSign=z<0?-1:1;
    infillXs.forEach(station=>infillBracket(parent,station.x,z,materials,frontSign));
  }
  parent.userData.part = 'dougong';
  parent.userData.infillBracketCount = infillXs.length*2;
  parent.userData.evidence = ZHENRU_INFILL_EVIDENCE;
  parent.userData.provenance = 'Four-puzuo single-ang account is one interpretation; government summary differs.';
  return parent;
}

function faceGeometry(pointAt, uSteps, vSteps, courseCount, tileCount, isCap) {
  const pos = [], inds = [];
  // Separated, shallow curved tiles with actual side walls. Material color is not measured.
  // Small deterministic staggering, not randomized aging/noise.
  const firstV = 0.055;
  const vSpan = (1 - firstV) / courseCount;
  const uWidth = 2 / tileCount;
  function p(u, v, height) {
    const q = new THREE.Vector3(...pointAt(u, v));
    const pu = new THREE.Vector3(...pointAt(Math.min(1, u + 0.001), v)).sub(q);
    const pv = new THREE.Vector3(...pointAt(u, Math.min(1, v + 0.001))).sub(q);
    const n = pu.cross(pv).normalize();
    if (!Number.isFinite(n.x) || n.lengthSq() < 0.01) n.set(0, 1, 0);
    if (n.y < 0) n.negate();
    q.addScaledVector(n, height);
    return q;
  }
  function pushQuad(a, b, c, d) { inds.push(a, c, b, b, c, d); }
  // One body per tile: 6 cross-section x 3 longitudinal segments, closed edges.
  for (let vIndex = 0; vIndex < courseCount; vIndex++) {
    const v0 = firstV + vSpan * vIndex;
    const v1 = Math.min(1.006, v0 + vSpan * 1.13);
    for (let uIndex = 0; uIndex < tileCount + (isCap ? 1 : 0); uIndex++) {
      const centerU = -1 + (uIndex + (isCap ? 0 : 0.5)) * uWidth;
      const radiusU = uWidth * (isCap ? 0.185 : 0.46);
      if (centerU < -1.001 || centerU > 1.001) continue;
      const base = pos.length / 3;
      const samplesAcross = uSteps + 1;
      const samplesAlong = vSteps + 1;
      const count = samplesAcross * samplesAlong;
      const capAmp = isCap ? 0.060 : -0.034;
      for (let level = 0; level < 2; level++) {
        for (let iv = 0; iv <= vSteps; iv++) {
          const tV = iv / vSteps;
          const v = Math.min(1, v0 + (v1 - v0) * tV);
          for (let iu = 0; iu <= uSteps; iu++) {
            const tU = iu / uSteps;
            const u = THREE.MathUtils.clamp(centerU + (2*tU-1)*radiusU, -1, 1);
            const arch = Math.sin(Math.PI * tU) * capAmp;
            const height = 0.040 + arch + (level === 0 ? 0.015 : -0.012);
            const point = p(u, v, height);
            pos.push(point.x, point.y, point.z);
          }
        }
      }
      for (let iv = 0; iv < vSteps; iv++) for (let iu = 0; iu < uSteps; iu++) {
        const a = base + iv*samplesAcross + iu;
        const b = a + 1;
        const c = a + samplesAcross;
        const d = c + 1;
        pushQuad(a, b, c, d);
        const k = count;
        pushQuad(d+k, c+k, b+k, a+k); // lower (winding reversed)
      }
      for (let iv = 0; iv < vSteps; iv++) {
        const a = base + iv*samplesAcross;
        const b = base + (iv+1)*samplesAcross;
        pushQuad(a, a+count, b, b+count);
        const e = a+uSteps, f = b+uSteps;
        pushQuad(e, f, e+count, f+count);
      }
      for (let iu = 0; iu < uSteps; iu++) {
        const a = base+iu, b = a+1;
        pushQuad(a, b, a+count, b+count);
        const e = base + vSteps*samplesAcross + iu;
        pushQuad(e+1, e, e+1+count, e+count);
      }
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geom.setIndex(inds);
  geom.computeVertexNormals();
  return geom;
}

/** Add segmented overlapping board and cover tiles to an existing curved roof patch.
 * Geometry is batched into one mesh per material/face, avoiding thousands of draw calls.
 * pointAt(u,v) returns roof-world [x,y,z] for u=-1..1, v=0..1.
 */
export function addRoofTileStudy(skin, pointAt, materials, { bays = 22, courses = 16, label = 'roof' } = {}) {
  const tileMaterial = materials.roof.clone();
  tileMaterial.roughness = 0.96;
  tileMaterial.side = THREE.DoubleSide;
  const coverMaterial = materials.roofSide.clone();
  coverMaterial.roughness = 0.93;
  coverMaterial.side = THREE.DoubleSide;
  for (const isCap of [false, true]) {
    const geom = faceGeometry(pointAt, 6, 2, courses, bays, isCap);
    const mesh = tag(new THREE.Mesh(geom, isCap ? coverMaterial : tileMaterial), 'roof',
      `${label}/${isCap ? 'semi-circular-cover' : 'concave-pan'}-tiles`, TILE_STUDY);
    mesh.userData.tileCourses = courses;
    mesh.userData.tileBays = bays;
    skin.add(mesh);
  }
}