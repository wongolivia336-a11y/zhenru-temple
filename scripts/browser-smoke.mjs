#!/usr/bin/env node
/** Chromium + real WebGL geometry smoke (not historical photo-alignment QA). */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import fs from "node:fs";
import { spawn } from "node:child_process";

const port=8765, base="http://127.0.0.1:"+port;
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{stdio:"ignore"});
let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,description,limit=45000) {
  let start=Date.now();
  while(Date.now()-start<limit){try {let x=await fn();if(x)return x;}catch{}await sleep(250);}
  throw Error("TIMEOUT: "+description);
}
async function run() {
  await until(async()=>{try{return (await fetch(base+"/reconstruction/reference-review.html")).ok;}catch{return false;}},"local server");
  browser=await chromium.launch({headless:true,args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-gpu-sandbox"]});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  fs.mkdirSync("qa/runtime-screenshots",{recursive:true});
  await page.goto(base+"/reconstruction/reference-review.html?qa=1",{waitUntil:"domcontentloaded"});
  const getRoof=()=>page.evaluate(()=>document.getElementById("model")?.contentWindow?.__zhenruQA?.getRoofCalibration?.());
  const getState=()=>page.evaluate(()=>document.getElementById("model")?.contentWindow?.__zhenruQA?.getSceneState?.());
  async function ensure(pitch) {
    const data=await until(async()=>{const r=await getRoof();return r?.pitchDeg===pitch?r:false;},"live WebGL pitch="+pitch);
    assert.ok(Number.isFinite(data.meshTopY));
    await until(async()=>page.frameLocator("#model").locator("#viewerLoading").evaluate(e=>e.classList.contains("is-hidden")),"WebGL loaded "+pitch);
    return data;
  }
  async function apply(pitch){
    await page.locator("#pitchRange").evaluate((input, next) => {
      input.value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, pitch);
    await page.locator("#applyPitch").click();
    assert.ok((await page.locator("#model").getAttribute("src")).includes("roofPitch="+pitch));
    return ensure(pitch);
  }
  // Ensure the reference is actually decoded, not merely a nonempty img element.
  const photoDimensions=await until(async()=>{
    const d=await page.locator("#photo").evaluate(async img=>{
      try { await img.decode(); return {width:img.naturalWidth,height:img.naturalHeight}; }
      catch { return null; }
    });
    return d?.width>100&&d?.height>100?d:null;
  },"reference JPEG decoded");
  const normal=await ensure(26);
  assert.equal(normal.framingStudyVisible,false,"Exterior rafters should not poke through roof");
  assert.equal(normal.ceilingRafterStudyVisible,false,"Interior rafter silhouettes should not pierce the exterior roof");
  assert.ok(Math.abs(normal.ridgeY-10.926693576380554)<0.0001);
  const observedTopology=await page.evaluate(()=>document.querySelector("#model")?.contentWindow?.__zhenruQA?.getRoofCalibration?.()?.roofTopology);
  assert.equal(observedTopology?.mainRidges,1);
  assert.equal(observedTopology?.descendingRidges,4);
  assert.equal(observedTopology?.hipRidges,4);
  assert.equal(observedTopology?.gableTriangles,2);
  assert.equal(observedTopology?.cornerWings,4);
  assert.equal(normal.infillBracketCount,16,"16 modeled front/rear infill bracket sets");
  // The 1440px comparison desk embeds a half-width viewer: geometry LOD is
  // chosen from the real IFRAME viewport, not from the outer browser window.
  const eaveTier=await page.evaluate(()=>{
    const w=document.querySelector("#model").contentWindow;
    return (w.innerWidth<=720 || (w.navigator.deviceMemory && w.navigator.deviceMemory<=4))?128:224;
  });
  assert.equal(observedTopology?.eaveTileEnds,eaveTier);
  assert.equal(observedTopology?.dripTiles,eaveTier);
  assert.equal(observedTopology?.eaveBatchCount,3);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(150);
  await page.screenshot({path:"qa/runtime-screenshots/pitch-26.png"});
  const low=await apply(18);
  // Keep all comparison captures at the same page scroll position and camera preset.
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(150);
  await page.screenshot({path:"qa/runtime-screenshots/pitch-18.png"});
  const high=await apply(34);
  // Keep all comparison captures at the same page scroll position and camera preset.
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(150);
  await page.screenshot({path:"qa/runtime-screenshots/pitch-34.png"});
  assert.ok(high.meshTopY>low.meshTopY+2.0,"Actual roof geometry did not change by at least 2m");
  assert.ok(high.ridgeY>low.ridgeY+2.9,"Pitch did not update roof ridge");
  await page.locator("#resetPitch").click();
  const reset=await ensure(26);
  assert.ok(Math.abs(reset.ridgeY-normal.ridgeY)<0.0001);
  const viewer=page.frameLocator("#model");
  await viewer.locator("#toolsToggle").click();
  assert.equal(await viewer.locator("#toolsToggle").getAttribute("aria-expanded"),"true");
  const setRange=async (selector,value)=>viewer.locator(selector).evaluate((el,next)=>{
    el.value=String(next);el.dispatchEvent(new Event("input",{bubbles:true}));
  },value);
  await setRange("#explodeSlider",50);
  assert.equal((await getState()).explosionTarget,0.5);
  assert.equal(await viewer.locator("#explodeValue").textContent(),"50%");
  await until(async()=>(await getState()).mainRoofOffset>0.45,"Real roof geometry must separate at 50%",15000);
  await viewer.locator('[data-explode-focus="roof"]').click();
  assert.equal((await getState()).explosionFocus,"roof");
  assert.equal(await viewer.locator('[data-explode-focus="roof"]').getAttribute("aria-pressed"),"true");
  assert.equal(await viewer.locator('[data-explode-focus="all"]').getAttribute("aria-pressed"),"false");
  await until(async()=>{
    const state=await getState();
    return state.mainRoofOffset>state.frameOffset*10 ? state : null;
  },"roof focus changes geometry, not just UI",15000);
  const focused=await getState();
  assert.ok(focused.mainRoofOffset>focused.frameOffset*10,"Roof focus must be genuinely different");
  await viewer.locator('[data-explode-focus="all"]').click();
  await setRange("#explodeSlider",0);
  assert.equal((await getState()).exploded,false);
  await setRange("#zoomSlider",135);
  assert.equal((await getState()).zoomPercent,135);
  assert.equal(await viewer.locator("#zoomValue").textContent(),"135%");
  await viewer.locator("#zoomSlider").fill("100");
  await setRange("#explodeSlider",100);
  assert.equal((await getState()).explosionTarget,1);
  await page.screenshot({path:"qa/runtime-screenshots/v8-exploded-full.png"});
  await viewer.locator("#cutawayToggle").click();
  assert.equal((await getState()).cutaway,true);
  await viewer.locator("#explodeToggle").click();
  // With the slider already at 100%, the legacy button now correctly collapses.
  assert.equal((await getState()).exploded,false);
  assert.equal(await viewer.locator("#explodeSlider").inputValue(),"0");
  await viewer.locator("#explodeToggle").click();
  assert.equal((await getState()).exploded,true);
  assert.equal(await viewer.locator("#explodeSlider").inputValue(),"100");
  assert.equal((await getRoof()).framingStudyVisible,true);
  assert.equal((await getRoof()).ceilingRafterStudyVisible,true);
  await viewer.locator("#frameToggle").click();
  assert.equal((await getState()).frameMode,true);
  await viewer.locator("#resetView").click();
  assert.equal((await getState()).explosionTarget,0);
  assert.equal((await getState()).zoomPercent,100);
  assert.equal(await viewer.locator("#explodeSlider").inputValue(),"0");
  assert.equal(await viewer.locator("#zoomSlider").inputValue(),"100");
  assert.equal((await getState()).cutaway,false);
  assert.equal((await getState()).exploded,false);
  assert.equal((await getState()).frameMode,false);
  assert.equal((await getRoof()).framingStudyVisible,false);
  assert.equal((await getRoof()).ceilingRafterStudyVisible,false);
  assert.equal(await viewer.locator("#cutawayToggle").getAttribute("aria-pressed"),"false");
  // Explicit close-up control should expose the bracket/eave details rather than
  // hiding added geometry at the building-wide camera distance.
  await viewer.locator('[data-view="eave"]').click();
  assert.equal((await getState()).view,"eave");
  await sleep(1050);
  await page.screenshot({path:"qa/runtime-screenshots/eave-brackets-closeup.png"});
  await viewer.locator('[data-view="outside"]').click();
  await sleep(900);
  await page.screenshot({path:"qa/runtime-screenshots/reset-desktop.png"});
  // Time and ecology: stage 1320 is UNKNOWN for a c.650-year-old tree.
  const tree0=(await getState()).ginkgo;
  assert.equal(tree0.visible,false);
  assert.equal(tree0.growthScale,0);
  const setHistory=async v=>{
    await viewer.locator("#stageSlider").evaluate((el,next)=>{
      el.value=String(next);el.dispatchEvent(new Event("input",{bubbles:true}));
    },v);
    return (await getState()).ginkgo;
  };
  const treeQing=await setHistory(1);
  assert.equal(treeQing.visible,true);
  assert.ok(treeQing.growthScale>0.65&&treeQing.growthScale<0.8);
  const tree1963=await setHistory(2);
  assert.ok(tree1963.growthScale>treeQing.growthScale);
  const treeNow=await setHistory(3);
  assert.equal(treeNow.growthScale,1);
  assert.equal(treeNow.treeId,"0067");
  await page.screenshot({path:"qa/runtime-screenshots/v8-ancient-ginkgo-autumn.png"});
  await viewer.locator("#seasonToggle").click();
  assert.equal((await getState()).ginkgo.season,"spring");
  await page.screenshot({path:"qa/runtime-screenshots/v8-ginkgo-spring.png"});
  await viewer.locator("#treeToggle").click();
  assert.equal((await getState()).ginkgo.visible,false);
  await viewer.locator("#treeToggle").click();
  assert.equal((await getState()).ginkgo.visible,true);
  await viewer.locator("#seasonToggle").click();
  await setHistory(0);
  assert.equal((await getState()).ginkgo.visible,false);
  // The stage caption and timeline must occupy distinct physical DOM bands.
  async function layout(){
    return page.evaluate(()=>{
      const doc=document.querySelector("#model")?.contentDocument;
      if(!doc)return null;
      const rect=s=>{const e=doc.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      return {timeline:rect(".timeline-strip"),environment:rect(".environment-controls"),
        timelineDetail:rect(".timeline-context"),
        duplicateCaptionCount:doc.querySelectorAll(".viewer-caption").length,
        keyboardHelpVisible:getComputedStyle(doc.querySelector("#viewerKeyboardHelp")).position!=="absolute",
        heroFoot:doc.querySelector(".hero-foot")?getComputedStyle(doc.querySelector(".hero-foot")).display:null,
        ink:!!doc.querySelector(".site-ink-wash")};
    });
  }
  const desktopLayout=await layout();
  assert.ok(desktopLayout&&desktopLayout.ink);
  assert.equal(desktopLayout.heroFoot,"none");
  assert.equal(desktopLayout.duplicateCaptionCount,0,"Duplicate floating stage strip must be gone");
  assert.ok(desktopLayout.timelineDetail.top>=desktopLayout.timeline.top-1);
  assert.ok(desktopLayout.timelineDetail.bottom<=desktopLayout.timeline.bottom+1);
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=1,"Desktop horizontal overflow "+overflow);
  await page.setViewportSize({width:768,height:1000});
  await sleep(180);
  await page.screenshot({path:"qa/runtime-screenshots/v8-tablet-768.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await sleep(180);
  const mobileLayout=await layout();
  assert.equal(mobileLayout.duplicateCaptionCount,0);
  assert.ok(mobileLayout.timelineDetail.bottom<=mobileLayout.timeline.bottom+1);
  assert.ok(mobileLayout.environment.bottom<=mobileLayout.timeline.top-6,
     "Mobile ecology controls collide with timeline");
  await page.screenshot({path:"qa/runtime-screenshots/mobile-390.png",fullPage:true});
  // Direct public homepage audit (the user's screenshot showed this page,
  // not only the side-by-side reference lab).
  const home=await browser.newPage({viewport:{width:1440,height:900}});
  home.on("pageerror",e=>errors.push("home: "+e.message));
  await home.goto(base+"/?qa=1",{waitUntil:"domcontentloaded"});
  await until(async()=>home.evaluate(()=>!!window.__zhenruQA?.getSceneState?.()),"direct homepage WebGL");
  await home.locator("#stageSlider").evaluate(el=>{
    el.value="3";el.dispatchEvent(new Event("input",{bubbles:true}));
  });
  const treeFront=await home.evaluate(()=>window.__zhenruQA.getSceneState().ginkgo);
  assert.ok(treeFront.visible&&treeFront.growthScale===1);
  await home.screenshot({path:"qa/runtime-screenshots/v8-home-desktop-1440.png",fullPage:true});
  const homeLayout=await home.evaluate(()=>{
    const r=sel=>{const v=document.querySelector(sel).getBoundingClientRect();return {left:v.left,top:v.top,right:v.right,bottom:v.bottom};};
    return {timeline:r(".timeline-strip"),timelineDetail:r(".timeline-context"),
      mainTitle:r(".hero h1"),environment:r(".environment-controls"),
      frontView:r(".viewer-frame"),controls:r(".view-tools")};
  });
  assert.ok(homeLayout.timelineDetail.top>=homeLayout.timeline.top-1 &&
            homeLayout.timelineDetail.bottom<=homeLayout.timeline.bottom+1,
    "Homepage stage information should be contained by a single timeline rail");
  assert.ok(homeLayout.mainTitle.bottom<homeLayout.timeline.top,"Hero title intersects time rail");
  const treeProjection=await home.evaluate(()=>window.__zhenruQA.getGinkgoScreenBounds());
  assert.ok(treeProjection&&Number.isFinite(treeProjection.left),"Ginkgo projected bounds must exist");
  assert.ok(treeProjection.left > homeLayout.mainTitle.right+18,
    "Ginkgo foliage projects over editorial heading; move the illustrative courtyard position");
  assert.ok(treeProjection.left < homeLayout.frontView.right-20,
    "Ginkgo is outside visible scene; the ecological timeline must remain discoverable");
  assert.ok(treeProjection.trunkX > homeLayout.frontView.left+40 &&
            treeProjection.trunkX < homeLayout.frontView.right-30,
    "Ginkgo trunk should be meaningfully visible within the exterior camera framing");
  // Test the same component hot-spot flow the user captured in screenshots.
  // Screenshot capture can scroll the full document and pause WebGL hotspot
  // projection. First restore the public view and report whether pins are visible.
  await home.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
  await home.locator("#resetView").click();
  await sleep(750);
  const visiblePinCount=await home.locator(".scene-pin.is-visible").count();
  assert.equal(await home.evaluate(()=>window.__zhenruQA.getSceneState().view),"outside");
  // Layout test intentionally triggers the same registered pin click listener
  // even when SwiftShader reports 0 viewport-visible tags after a fullPage shot.
  // This verifies the inspector layout; pointer hit testing is a separate gate.
  const firstPart="door";
  await home.locator("#pinDoor").evaluate(el=>el.click());
  const inspector=home.locator("#componentInspector");
  assert.equal(await inspector.isHidden(),false,"Part detail should open");
  assert.equal(await home.locator('.scene-pin[data-part="'+firstPart+'"]').getAttribute("aria-expanded"),"true");
  const pop=await home.evaluate(()=>{
    const bounds=s=>{const r=document.querySelector(s).getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
    return {inspector:bounds("#componentInspector"),
      timeline:bounds(".timeline-strip"),heading:bounds(".hero h1"),
      environmentVisible:getComputedStyle(document.querySelector(".environment-controls")).visibility};
  });
  assert.ok(pop.inspector.left>pop.heading.right+14,
     "Part card should be docked to the RIGHT, clear of editorial headline");
  assert.ok(pop.inspector.bottom<pop.timeline.top-9,
     "Part card must never cover the chronology rail");
  assert.equal(pop.environmentVisible,"hidden",
     "Contextual ecology controls should yield to the part inspector");
  await home.screenshot({path:"qa/runtime-screenshots/v9-part-dock-desktop.png",fullPage:true});
  await home.locator("#closeInspector").click();
  assert.equal(await inspector.isHidden(),true,"Closing part note should dismiss the dock");
  assert.equal(await home.locator('.scene-pin[data-part="'+firstPart+'"]').getAttribute("aria-expanded"),"false");
  const stageStoryBefore=await home.locator("#stageDetail").textContent();
  await home.locator("#pinRoof").evaluate(el=>el.click());
  assert.equal(await home.locator("#stageDetail").textContent(),stageStoryBefore,
    "Opening a part note should not overwrite the historical stage narrative");
  await home.keyboard.press("Escape");
  assert.equal(await inspector.isHidden(),true,"Escape closes component note");
  // Focus choices are contained buttons, not a native SELECT popup crossing the tools.
  await home.locator("#toolsToggle").click();
  assert.equal(await home.locator("#modelTools").isHidden(),false);
  assert.equal(await home.locator("#explodeFocus").evaluate(x=>x.type),"hidden");
  await home.locator('[data-explode-focus="frame"]').click();
  assert.equal(await home.locator('[data-explode-focus="frame"]').getAttribute("aria-pressed"),"true");
  await home.screenshot({path:"qa/runtime-screenshots/v9-inline-focus-desktop.png",fullPage:true});
  await home.keyboard.press("Escape");
  assert.equal(await home.locator("#modelTools").isHidden(),true);
  assert.equal(await home.locator(".environment-controls").evaluate(el=>getComputedStyle(el).visibility),"visible");

  // V10: real first-person traversal, transparent consent and transient traces.
  await home.locator("#enterVisit").click();
  assert.equal(await home.evaluate(()=>document.documentElement.classList.contains("visit-mode")),true);
  assert.equal(await home.locator("#visitHud").isHidden(),false);
  let visit=await home.evaluate(()=>({ui:window.__zhenruVisitQA.getState(),scene:window.__zhenruQA.getSceneState()}));
  assert.equal(visit.scene.view,"walk");
  assert.equal(visit.scene.visit.active,true);
  assert.ok(visit.scene.visit.leaves.visible,"Ground leaves should be in the visit scene");
  assert.ok(visit.scene.visit.leaves.count>=62,"Instanced 3D foliage available for subtle footstep response");
  assert.equal(visit.ui.sharing,false);
  assert.equal(visit.ui.presenceAvailable,false,"No mock online visitors without deployed WebSocket endpoint");
  assert.equal(await home.locator("#visitShare").isDisabled(),true);
  assert.equal(await home.locator(".viewer-bottom").isVisible(),false);
  await sleep(980);
  const startPose=await home.evaluate(()=>window.__zhenruQA.getSceneState().visit.pose);
  await home.locator("#hallCanvas").focus();
  await home.keyboard.down("w");
  await until(async()=>{
    const pose=await home.evaluate(()=>window.__zhenruQA.getSceneState().visit.pose);
    return pose.z<startPose.z-.15;
  },"visitor first-person forward movement",11000);
  await home.keyboard.up("w");
  const movedPose=await home.evaluate(()=>window.__zhenruQA.getSceneState().visit.pose);
  assert.ok(movedPose.z<startPose.z-.15,"Visitor should walk forward at human-scale, rather than orbiting model");
  await home.screenshot({path:"qa/runtime-screenshots/v10-courtyard-first-person-desktop.png",fullPage:true});
  await home.locator('[data-visit-view="threshold"]').click();
  await sleep(940);
  visit=await home.evaluate(()=>({ui:window.__zhenruVisitQA.getState(),scene:window.__zhenruQA.getSceneState()}));
  assert.equal(visit.scene.view,"threshold");
  assert.equal(visit.ui.zone,"eave");
  assert.equal(await home.locator("#visitEaveActions").isHidden(),false);
  await home.locator("#visitMark").click();
  assert.ok((await home.evaluate(()=>window.__zhenruQA.getSceneState().visit.traces))>=1,
    "A real 3D ephemeral observation mark must appear");
  assert.match(await home.locator("#visitMoment").textContent(),/仅在本机/);
  await home.screenshot({path:"qa/runtime-screenshots/v10-eave-temporary-attention-desktop.png",fullPage:true});
  await home.locator("#visitStudy").click();
  assert.equal(await home.evaluate(()=>document.documentElement.classList.contains("visit-mode")),false);
  assert.equal(await home.evaluate(()=>window.__zhenruQA.getSceneState().view),"eave");
  assert.equal(await home.locator("#componentInspector").isHidden(),false,
    "Moving from felt space to architectural research should open evidence-backed part note");
  await home.locator("#closeInspector").click();
  await home.locator("#enterVisit").click();
  await home.locator('[data-visit-view="interior-walk"]').click();
  await sleep(950);
  assert.equal(await home.evaluate(()=>window.__zhenruQA.getSceneState().view),"interior-walk");
  assert.match(await home.locator("#visitZoneText").textContent(),/尚未通过实测/);
  await home.screenshot({path:"qa/runtime-screenshots/v10-interior-first-person-desktop.png",fullPage:true});
  await home.locator("#visitExit").click();
  assert.equal(await home.locator("#visitHud").isHidden(),true);
  assert.equal(await home.evaluate(()=>window.__zhenruQA.getSceneState().view),"outside");

  await home.setViewportSize({width:390,height:844});
  await sleep(250);
  await home.screenshot({path:"qa/runtime-screenshots/v8-home-mobile-390.png",fullPage:true});
  await home.locator("#enterVisit").click();
  await sleep(990);
  assert.equal(await home.evaluate(()=>window.__zhenruQA.getSceneState().view),"walk");
  const visitMobileOverflow=await home.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(visitMobileOverflow<=1,"First-person mobile viewport horizontal overflow "+visitMobileOverflow);
  await home.screenshot({path:"qa/runtime-screenshots/v10-courtyard-first-person-mobile.png",fullPage:true});
  await home.locator('[data-visit-view="threshold"]').click();
  assert.equal(await home.locator("#visitEaveActions").isHidden(),false);
  await home.locator("#visitExit").click();
  // Mobile part note becomes a compact sheet, with time rail kept in its own lane.
  await home.locator("#pinDoor").evaluate(el=>el.click());
  const mobileDock=await home.evaluate(()=>{
    const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {top:b.top,bottom:b.bottom};};
    return {card:r("#componentInspector"),timeline:r(".timeline-strip")};
  });
  assert.ok(mobileDock.card.bottom<mobileDock.timeline.top-8,"Mobile part card covers historical timeline");
  await home.screenshot({path:"qa/runtime-screenshots/v9-part-dock-mobile.png",fullPage:true});
  await home.locator("#closeInspector").click();
  await home.locator("#treeView").click();
  assert.equal(await home.evaluate(()=>window.__zhenruQA.getSceneState().view),"courtyard");
  await sleep(1050);
  await home.screenshot({path:"qa/runtime-screenshots/v8-ginkgo-focus-mobile-390.png",fullPage:true});
  const homeMobileOverflow=await home.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(homeMobileOverflow<=1,"Homepage mobile horizontal overflow "+homeMobileOverflow);
  await home.close();
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=1,"Mobile horizontal overflow "+overflow);
  assert.deepEqual(errors,[]);
  const report={pass:true,referencePhotoDimensions:photoDimensions,base26:normal,pitch18:low,pitch34:high,reset26:reset,
   ginkgo:{stage0:tree0,qing:treeQing,stage1963:tree1963,present:treeNow,homepage:treeFront,projectedBounds:treeProjection},layout:{desktop:desktopLayout,mobile:mobileLayout,homepage:homeLayout},
   note:"WebGL geometry and control verification in headless Chromium; part inspector layout uses real registered DOM click listener, while hit-test visibility may vary after fullPage screenshot; NOT calibrated historical accuracy.",
   visiblePinCountAfterPageScreenshot:visiblePinCount};
  fs.writeFileSync("qa/runtime-screenshots/browser-report.json",JSON.stringify(report,null,2));
  console.log("PASS actual WebGL roof bounds",low.meshTopY,normal.meshTopY,high.meshTopY);
  console.log("PASS V8 continuous explode, zoom, focus, reset, chronology tree, season, 390/768 layout and no JS exceptions");
  console.log("PASS V10 first-person courtyard walk, mobile visit, transient 3D trace, study transition, private-by-default presence");
}
try { await run(); }
finally { await browser?.close(); server.kill("SIGTERM"); }
