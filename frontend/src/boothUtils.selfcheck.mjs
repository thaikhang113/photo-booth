import assert from "node:assert/strict";
import {
  acceptSlot,
  allSlotsReady,
  boothShotTargets,
  contactSheetLayout,
  createBoothSlots,
  retakeSlot,
} from "./boothUtils.mjs";

assert.deepEqual(boothShotTargets(), [1, 4, 6], "booth should support single, 4, and 6 shots");

const empty4 = createBoothSlots(4);
assert.equal(empty4.length, 4);
assert.deepEqual(empty4.map((slot) => slot.status), ["empty", "empty", "empty", "empty"]);

const pending = { blob: "blob-a", url: "a.png", meta: { faceLandmarks: [], handGesture: "None" } };
assert.throws(() => acceptSlot(empty4, 0, null), /pending shot/i);
const accepted = acceptSlot(empty4, 0, pending);
assert.equal(accepted[0].status, "accepted");
assert.equal(accepted[0].url, "a.png");
assert.equal(accepted[1].status, "empty");
assert.equal(allSlotsReady(accepted), false);

const accepted2 = acceptSlot(accepted, 1, { ...pending, url: "b.png" });
const retaken = retakeSlot(accepted2, 1);
assert.equal(retaken[0].status, "accepted");
assert.equal(retaken[0].url, "a.png");
assert.equal(retaken[1].status, "empty");
assert.equal(retaken[1].url, "");

const ready = [0, 1, 2, 3].reduce(
  (slots, index) => acceptSlot(slots, index, { ...pending, url: `${index}.png` }),
  createBoothSlots(4),
);
assert.equal(allSlotsReady(ready), true);
assert.deepEqual(contactSheetLayout(4), { cols: 2, rows: 2 });
assert.deepEqual(contactSheetLayout(6), { cols: 3, rows: 2 });

console.log("booth utils self-check ok");
