export function boothShotTargets() {
  return [1, 4, 6];
}

export function nextBoothState(state, shot) {
  const shots = [...state.shots, shot].slice(0, state.mode);
  return {
    ...state,
    shots,
    currentShot: shots.length,
    complete: shots.length >= state.mode,
  };
}

export function contactSheetLayout(count) {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  return { cols: 3, rows: 2 };
}
