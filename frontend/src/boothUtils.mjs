export function boothShotTargets() {
  return [1, 4, 6];
}

export function createBoothSlots(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `slot-${index + 1}`,
    blob: null,
    url: "",
    resultUrl: "",
    meta: { faceLandmarks: [], handGesture: "None" },
    status: "empty",
  }));
}

export function acceptSlot(slots, index, pendingShot) {
  if (!pendingShot) throw new Error("pending shot required");
  return slots.map((slot, slotIndex) => {
    if (slotIndex !== index) return slot;
    return {
      ...slot,
      blob: pendingShot.blob,
      url: pendingShot.url,
      resultUrl: "",
      meta: pendingShot.meta,
      status: "accepted",
    };
  });
}

export function retakeSlot(slots, index) {
  return slots.map((slot, slotIndex) => {
    if (slotIndex !== index) return slot;
    return { ...slot, blob: null, url: "", resultUrl: "", status: "empty" };
  });
}

export function allSlotsReady(slots) {
  return slots.length > 0 && slots.every((slot) => slot.status === "accepted" || slot.status === "processed");
}

export function contactSheetLayout(count) {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  return { cols: 3, rows: 2 };
}
