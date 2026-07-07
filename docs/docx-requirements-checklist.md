# DOCX Requirements Checklist

Status after filter-scope cleanup:

- PASS: Webcam preview and capture flow.
- PASS: 3 Vietnamese cultural filters kept for demo: Tranh Đông Hồ, Địa Danh Việt Nam, Tết Việt Nam.
- PASS: Face detection / face landmark runtime via browser MediaPipe.
- PASS: Hand gesture recognition via browser MediaPipe.
- PASS: Gesture control: next filter, apply, reset.
- PASS: Image segmentation fallback via OpenCV GrabCut / center mask.
- PASS: Dong Ho uses edge detection, fixed folk color quantization, ivory diep paper texture, and black woodcut lines.
- PASS: Morphological operations for segmentation mask.
- PASS: Alpha blending for landmark and Tet background replacement.
- PASS: Landmark options: Hoi An, Hue, Ho Guom, Ha Long.
- PASS: Tet location options: home, street, flower_market.
- PASS: Lightweight live preview mode.
- PASS: Download result in browser.
- PASS: Server does not persist processed photos.
- PASS: Removed filters are rejected by public API: time_travel, costume, tuong.

Known simplification:
- Camera/landmark/gesture quality depends on webcam permission and MediaPipe model availability.
- Project scope now intentionally keeps only three public filters.
