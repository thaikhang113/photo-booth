# DOCX Requirements Checklist

Status after implementation:

- PASS: Webcam preview and capture flow.
- PASS: 6 Vietnamese cultural filters.
- PASS: Face detection / face landmark runtime via browser MediaPipe.
- PASS: Hand gesture recognition via browser MediaPipe.
- PASS: Gesture control: next filter, apply, reset.
- PASS: Image segmentation fallback via OpenCV GrabCut / center mask.
- PASS: Edge detection and color quantization for Dong Ho.
- PASS: Morphological operations for segmentation mask.
- PASS: Alpha blending for landmark and costume overlays.
- PASS: Time Travel modes: 1980, modern, future.
- PASS: Landmark options: Hoi An, Hue, Ho Guom, Ha Long with generated placeholders when assets are absent.
- PASS: Costume options: non la, khan dong, khan ran.
- PASS: Tet decorations include flowers, lanterns, Phuc/New Year text.
- PASS: Lightweight live preview mode.
- PASS: Download result in browser.
- PASS: Server does not persist processed photos.

Known simplification:
- Landmark/gesture quality depends on webcam and MediaPipe model availability.
- Missing real raster assets use OpenCV placeholders.
