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
  await viewer.locator("#explodeFocus").selectOption("roof");
  assert.equal((await getState()).explosionFocus,"roof");
  await until(async()=>{
    const state=await getState();
    return state.mainRoofOffset>state.frameOffset*10 ? state : null;
  },"roof focus changes geometry, not just UI",15000);
  const focused=await getState();
  assert.ok(focused.mainRoofOffset>focused.frameOffset*10,"Roof focus must be genuinely different");
  await viewer.locator("#explodeFocus").selectOption("all");
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
      return {caption:rect(".viewer-caption"),timeline:rect(".timeline-strip"),environment:rect(".environment-controls"),
        heroFoot:doc.querySelector(".hero-foot")?getComputedStyle(doc.querySelector(".hero-foot")).display:null,
        ink:!!doc.querySelector(".site-ink-wash")};
    });
  }
  const desktopLayout=await layout();
  assert.ok(desktopLayout&&desktopLayout.ink);
  assert.equal(desktopLayout.heroFoot,"none");
  assert.ok(desktopLayout.caption.bottom<=desktopLayout.timeline.top+1,"Timeline must not overlap stage caption");
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=1,"Desktop horizontal overflow "+overflow);
  await page.setViewportSize({width:768,height:1000});
  await sleep(180);
  await page.screenshot({path:"qa/runtime-screenshots/v8-tablet-768.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await sleep(180);
  const mobileLayout=await layout();
  assert.ok(mobileLayout.caption.bottom<=mobileLayout.timeline.top+1,"Mobile caption/timeline collide");
  assert.ok(mobileLayout.environment.bottom<=mobileLayout.caption.top+2 ||
     mobileLayout.environment.top>=mobileLayout.timeline.bottom,
     "Mobile ecology controls collide with timeline/caption");
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
    return {caption:r(".viewer-caption"),timeline:r(".timeline-strip"),mainTitle:r(".hero h1"),
      environment:r(".environment-controls"),frontView:r(".viewer-frame"),
      controls:r(".view-tools")};
  });
  assert.ok(homeLayout.caption.bottom<=homeLayout.timeline.top+2,"Homepage stage copy overlays timeline");
  assert.ok(homeLayout.mainTitle.bottom<homeLayout.timeline.top,"Hero title intersects time rail");
  await home.setViewportSize({width:390,height:844});
  await sleep(250);
  await home.screenshot({path:"qa/runtime-screenshots/v8-home-mobile-390.png",fullPage:true});
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
   ginkgo:{stage0:tree0,qing:treeQing,stage1963:tree1963,present:treeNow,homepage:treeFront},layout:{desktop:desktopLayout,mobile:mobileLayout,homepage:homeLayout},
   note:"WebGL geometry and control verification in headless Chromium; NOT calibrated historical accuracy."};
  fs.writeFileSync("qa/runtime-screenshots/browser-report.json",JSON.stringify(report,null,2));
  console.log("PASS actual WebGL roof bounds",low.meshTopY,normal.meshTopY,high.meshTopY);
  console.log("PASS V8 continuous explode, zoom, focus, reset, chronology tree, season, 390/768 layout and no JS exceptions");
}
try { await run(); }
finally { await browser?.close(); server.kill("SIGTERM"); }
