import * as THREE from "three";

// Only server-confirmed, anonymous peers receive a visible figure.
// No synthetic crowd or invented international visitors.
export function createVisitorFigures(scene) {
  const visitors = new Map();
  const pigment = new THREE.MeshStandardMaterial({ color: 0x6c7770, roughness: 1 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x8d9289, roughness: 0.98 });
  const head = new THREE.MeshStandardMaterial({ color: 0xb5aba0, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x59635e, roughness: 1 });
  const headShape = new THREE.SphereGeometry(.112, 10, 8);
  const torsoShape = new THREE.CylinderGeometry(.19, .22, .58, 9);
  const legShape = new THREE.CylinderGeometry(.068, .084, .6, 8);
  const footShape = new THREE.BoxGeometry(.16,.085,.27);
  function createFigure() {
    const root = new THREE.Group();
    root.visible = false;
    const torso = new THREE.Mesh(torsoShape, cloth);torso.position.y = 1.07;root.add(torso);
    const skull = new THREE.Mesh(headShape, head);skull.position.y = 1.61;skull.scale.set(1,.99,.95);root.add(skull);
    for (const sign of [-1,1]) {
      const arm = new THREE.Mesh(legShape, pigment);arm.scale.set(.72,.75,.78);
      arm.position.set(sign*.245,1.03,0);root.add(arm);
      const leg = new THREE.Mesh(legShape, dark);leg.position.set(sign*.12,.38,0);root.add(leg);
      const foot = new THREE.Mesh(footShape, dark);foot.position.set(sign*.12,.065,-.052);root.add(foot);
    }
    root.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
    scene.add(root);
    return root;
  }
  function upsert(peer, now = performance.now()) {
    if (!peer || typeof peer.id !== "string" || !Number.isFinite(peer.x) || !Number.isFinite(peer.z)) return;
    if (!visitors.has(peer.id)) {
      if (visitors.size >= 14) return;
      visitors.set(peer.id,{root:createFigure(),target:new THREE.Vector3(),yaw:0,last:now});
    }
    const current=visitors.get(peer.id);
    current.target.set(THREE.MathUtils.clamp(peer.x,-7,7),0,THREE.MathUtils.clamp(peer.z,7,31));
    current.yaw=Number.isFinite(peer.yaw)?peer.yaw:0;
    current.last=now;
    if (!current.root.visible) {current.root.position.copy(current.target);current.root.visible=true;}
  }
  function remove(id) {
    const visitor=visitors.get(id);if(!visitor)return;
    scene.remove(visitor.root);visitors.delete(id);
  }
  function clear() {for(const id of [...visitors.keys()])remove(id);}
  function tick(dt,now) {
    for(const [id,visitor]of visitors) {
      if(now-visitor.last>15000){remove(id);continue;}
      const alpha=1-Math.exp(-9*dt);
      visitor.root.position.lerp(visitor.target,alpha);
      visitor.root.rotation.y+=THREE.MathUtils.euclideanModulo(visitor.yaw-visitor.root.rotation.y+Math.PI,Math.PI*2)-Math.PI > 0
        ? Math.min(.08,THREE.MathUtils.euclideanModulo(visitor.yaw-visitor.root.rotation.y+Math.PI,Math.PI*2)-Math.PI)
        : Math.max(-.08,THREE.MathUtils.euclideanModulo(visitor.yaw-visitor.root.rotation.y+Math.PI,Math.PI*2)-Math.PI);
    }
  }
  return {upsert,remove,clear,tick,get count(){return visitors.size}};
}
