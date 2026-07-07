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
    crop: defaultCrop(),
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
      crop: pendingShot.crop || defaultCrop(),
      status: "accepted",
    };
  });
}

export function retakeSlot(slots, index) {
  return slots.map((slot, slotIndex) => {
    if (slotIndex !== index) return slot;
    return { ...slot, blob: null, url: "", resultUrl: "", crop: defaultCrop(), status: "empty" };
  });
}

export function allSlotsReady(slots) {
  return slots.length > 0 && slots.every((slot) => slot.status === "accepted" || slot.status === "processed");
}

export function contactSheetLayout(count, templateId = "") {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count <= 4) {
    if (templateId === "vertical" || templateId === "classic") return { cols: 1, rows: 4 };
    return { cols: 2, rows: 2 };
  }
  if (templateId === "vertical") return { cols: 1, rows: 6 };
  return { cols: 3, rows: 2 };
}

export function timerOptions() {
  return [
    { seconds: 0, label: "Off" },
    { seconds: 3, label: "Timer 3s" },
    { seconds: 5, label: "Timer 5s" },
    { seconds: 10, label: "Timer 10s" },
  ];
}

export function boothTemplates(count) {
  if (count <= 4) {
    return [
      { id: "vertical", label: "Vertical strip" },
      { id: "grid-2x2", label: "2x2 grid" },
      { id: "classic", label: "Classic Korean" },
    ];
  }
  return [
    { id: "grid-3x2", label: "3x2 grid" },
    { id: "vertical", label: "Vertical strip" },
  ];
}

export function defaultCrop() {
  return { zoom: 1, x: 0, y: 0 };
}

export function normalizeCrop(crop = {}) {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
  return {
    zoom: clamp(Number(crop.zoom ?? 1), 1, 3),
    x: clamp(Number(crop.x ?? 0), -50, 50),
    y: clamp(Number(crop.y ?? 0), -50, 50),
  };
}
