import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ARCHIVE_RECORDS, GUIDE_STOPS } from "../evidence-experiences.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

assert.deepEqual(Object.keys(ARCHIVE_RECORDS), ["historic", "drawing", "present", "model"]);
for (const [key, record] of Object.entries(ARCHIVE_RECORDS)) {
  assert.match(html, new RegExp(`data-archive-layer="${key}"`));
  assert.match(html, new RegExp(`data-archive-plate="${key}"`));
  for (const feature of ["eave", "bracket", "columns"]) {
    assert.equal(record.features[feature].length, 2, `${key}/${feature}: 能证明与不能证明`);
    assert.ok(record.features[feature].every(text => text.length > 10));
  }
  for (const field of ["date", "holder", "type", "rights", "href", "action"]) {
    assert.ok(record[field].length > 2, `${key}: missing ${field}`);
  }
}
assert.match(ARCHIVE_RECORDS.historic.rights, /授权/);
assert.match(ARCHIVE_RECORDS.drawing.summary, /尚不能确认/);
assert.match(ARCHIVE_RECORDS.model.type, /非实测/);
assert.equal(GUIDE_STOPS.length, 3);
for (const [index, stop] of GUIDE_STOPS.entries()) {
  assert.match(html, new RegExp(`data-guide-step="${index}"`));
  assert.equal(stop.choices.length, 2);
  assert.ok([0, 1].includes(stop.correct));
  assert.ok(stop.correctText.length > 15 && stop.incorrectText.length > 15);
}
for (const id of ["archiveOriginalLink", "archiveCanProve", "archiveCannotProve", "archiveLoadModel", "guideQuestionIndex", "guideFeedback", "guidePrev", "guideNext"]) {
  assert.ok(html.includes(`id="${id}"`), `DOM field ${id} missing`);
}
assert.match(html, /本站自绘教学草图/);
assert.match(html, /不是旧照摹本/);
assert.match(css, /\.archive-plate\[hidden\]\s*\{\s*display:\s*none/);
assert.match(css, /@media \(max-width: 480px\)/);
console.log("V13 evidence desk: four layers, source limits, three-feature readings and three-stop guide passed.");
