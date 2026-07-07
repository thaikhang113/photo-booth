import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const camera = readFileSync(new URL("./components/CameraBooth.jsx", import.meta.url), "utf8");
const app = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

assert.match(camera, /Start Session/, "multi-shot booth must start a manual session");
assert.match(camera, /timerOptions\(\)\.map/, "timer choices must render from shared 0/3/5/10 options");
assert.match(camera, /Pose/, "multi-shot session must show pose guidance");
assert.match(camera, /Use Photo \/ OK/, "captured slot preview must require explicit OK");
assert.match(camera, /Retake/, "captured slot preview must allow retake");
assert.doesNotMatch(camera, /Start Booth/, "old auto booth button must not return");
assert.doesNotMatch(camera, /append/, "capture should no longer append auto-loop shots");
assert.match(camera, /scale\(-1,\s*1\)/, "captured frames must be flipped horizontally before saving");
assert.match(camera, /translate\(-canvas\.width,\s*0\)/, "horizontal flip must draw from the translated canvas origin");

assert.match(app, /createBoothSlots\(boothMode\)/, "session must create fixed slots");
assert.match(app, /Frame/, "review must expose frame/template controls");
assert.match(app, /Zoom/, "review must expose per-slot crop zoom");
assert.match(app, /Print Strip/, "review must expose print export");
assert.match(app, /boothTemplates\(boothShots\.length\|\|boothMode\)/, "template options must depend on shot count or active mode");
assert.match(app, /acceptSlot\(.*currentSlotIndex.*pendingShot/s, "OK must accept pending shot into current slot");
assert.doesNotMatch(app, /const nextIndex=nextShots\.findIndex/, "OK must not auto-advance before a filter is applied");
assert.match(app, /function goToNextSlot/, "processed slots need an explicit next-photo action");
assert.match(app, /currentShotProcessed/, "next-photo action must only show after current slot is processed");
assert.match(app, /retakeSlot\(prev,currentSlotIndex\)/, "retake must reset only current slot");
assert.match(app, /allSlotsReady\(boothShots\)/, "bulk actions must require all slots ready");
assert.match(app, /disabled=\{loading\|\|!slotsReady\}/, "Apply All and Make Strip must stay disabled until ready");

const styles = readFileSync(new URL("./styles/main.css", import.meta.url), "utf8");
assert.match(styles, /\.preview-frame video[\s\S]*scaleX\(-1\)/, "live camera preview must be horizontally flipped");

console.log("booth flow self-check ok");
