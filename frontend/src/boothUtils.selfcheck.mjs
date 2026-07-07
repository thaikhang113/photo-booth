import assert from "node:assert/strict";
import { boothShotTargets, contactSheetLayout, nextBoothState } from "./boothUtils.mjs";

assert.deepEqual(boothShotTargets(), [1, 4, 6], "booth should support single, 4, and 6 shots");

let state = { mode: 4, currentShot: 0, shots: [] };
state = nextBoothState(state, "a.png");
assert.equal(state.currentShot, 1);
assert.equal(state.complete, false);
state = nextBoothState(state, "b.png");
state = nextBoothState(state, "c.png");
state = nextBoothState(state, "d.png");
assert.equal(state.currentShot, 4);
assert.equal(state.complete, true);
assert.deepEqual(state.shots, ["a.png", "b.png", "c.png", "d.png"]);
assert.deepEqual(contactSheetLayout(4), { cols: 2, rows: 2 });
assert.deepEqual(contactSheetLayout(6), { cols: 3, rows: 2 });

console.log("booth utils self-check ok");
