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
  assert.equal(normal.framingStudyVisible,false,"Unexplained rafters should not poke through normal roof");
  assert.ok(Math.abs(normal.ridgeY-10.926693576380554)<0.0001);
  await page.screenshot({path:"qa/runtime-screenshots/pitch-26.png"});
  const low=await apply(18);
  await page.screenshot({path:"qa/runtime-screenshots/pitch-18.png"});
  const high=await apply(34);
  await page.screenshot({path:"qa/runtime-screenshots/pitch-34.png"});
  assert.ok(high.meshTopY>low.meshTopY+2.0,"Actual roof geometry did not change by at least 2m");
  assert.ok(high.ridgeY>low.ridgeY+2.9,"Pitch did not update roof ridge");
  await page.locator("#resetPitch").click();
  const reset=await ensure(26);
  assert.ok(Math.abs(reset.ridgeY-normal.ridgeY)<0.0001);
  const viewer=page.frameLocator("#model");
  await viewer.locator("#toolsToggle").click();
  assert.equal(await viewer.locator("#toolsToggle").getAttribute("aria-expanded"),"true");
  await viewer.locator("#cutawayToggle").click();
  assert.equal((await getState()).cutaway,true);
  await viewer.locator("#explodeToggle").click();
  assert.equal((await getState()).exploded,true);
  assert.equal((await getRoof()).framingStudyVisible,true);
  await viewer.locator("#frameToggle").click();
  assert.equal((await getState()).frameMode,true);
  await viewer.locator("#resetView").click();
  assert.equal((await getState()).cutaway,false);
  assert.equal((await getState()).exploded,false);
  assert.equal((await getState()).frameMode,false);
  assert.equal((await getRoof()).framingStudyVisible,false);
  assert.equal(await viewer.locator("#cutawayToggle").getAttribute("aria-pressed"),"false");
  await page.screenshot({path:"qa/runtime-screenshots/reset-desktop.png"});
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=1,"Desktop horizontal overflow "+overflow);
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:"qa/runtime-screenshots/mobile-390.png",fullPage:true});
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=1,"Mobile horizontal overflow "+overflow);
  assert.deepEqual(errors,[]);
  const report={pass:true,referencePhotoDimensions:photoDimensions,base26:normal,pitch18:low,pitch34:high,reset26:reset,
   note:"WebGL geometry and control verification in headless Chromium; NOT calibrated historical accuracy."};
  fs.writeFileSync("qa/runtime-screenshots/browser-report.json",JSON.stringify(report,null,2));
  console.log("PASS actual WebGL roof bounds",low.meshTopY,normal.meshTopY,high.meshTopY);
  console.log("PASS popup, cutaway, explode, reset, narrow view and no JS exceptions");
}
try { await run(); }
finally { await browser?.close(); server.kill("SIGTERM"); }
