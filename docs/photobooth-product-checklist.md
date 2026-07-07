# Photobooth Product Checklist

## Must Match Real Photobooth

- [x] Direct booth screen, no marketing landing page.
- [x] Live camera preview.
- [x] Mirror preview and captured output.
- [x] Single / 4 shots / 6 shots modes.
- [x] Manual 4/6 slot flow: capture -> preview -> OK or Retake -> Apply Filter -> Next Photo.
- [x] Clicking an empty thumbnail selects that slot as the next capture slot.
- [x] Per-shot timer option.
- [x] Review thumbnails.
- [x] Final strip actions only after all slots have filtered results.
- [x] Contact sheet / strip download.
- [x] Frame/template chooser before final strip.
- [x] Crop/zoom/reposition each slot before final strip.
- [x] Pose guide per slot.
- [x] Timer choices: Off, 3s, 5s, 10s.
- [x] Browser print layout for final strip.
- [x] Dong Ho filter uses natural folk palette, ivory diep paper texture, black woodcut lines, slight woodblock misregistration, lower caption, and folk border.

## Next Product Gaps

- [ ] QR download for contact sheet if storage/share URL exists.
- [ ] Clear camera permission troubleshooting.
- [ ] Data privacy note if any photo is uploaded/stored.

## Not For Web Demo V1

- [ ] Payment integration.
- [ ] Direct thermal/DNP printer control.
- [ ] Public gallery / long-term cloud storage.
- [ ] Staff/queue management.
- [ ] Heavy beauty AI pipeline.

## Acceptance Checklist Before Calling Booth Flow Done

- [ ] Start app and confirm no backend error.
- [ ] Start camera with permission granted.
- [ ] Select `4 shots`, press `Start Session`, see `Slot 1/4`.
- [ ] Click empty slot 3, verify it shows `Slot 3 - next` and the next capture fills slot 3.
- [ ] Capture slot 1, see preview, press `Retake`, return to live camera.
- [ ] Capture slot 1 again, press `Use Photo / OK`, choose a filter, press `Apply Filter`, then `Next Photo`.
- [ ] Fill all 4 slots, verify `Make Strip` becomes enabled only after every slot has a filtered result.
- [ ] Generate strip and download PNG.
- [ ] Repeat quick smoke for `6 shots`.
- [ ] Apply at least one cultural filter to each slot before making the final strip.
- [ ] Check browser console for runtime/fetch errors.
