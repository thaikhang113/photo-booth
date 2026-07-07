# Nghiên Cứu Photobooth Việt Nam / Korean-Style

Ngày truy cập nguồn: 2026-07-07.

## 1. Photobooth Hoạt Động Ra Sao

Flow chung ngoài thị trường:

1. Khách vào booth hoặc khu event, chọn gói/frame/template/số bản in.
2. Hệ thống hoặc nhân viên hướng dẫn nhanh: đứng trước camera, nhìn màn hình mirror preview, chuẩn bị props.
3. Nếu là kiosk tự chụp: khách thanh toán trước bằng tiền mặt/chuyển khoản/QR; đèn bật, timer tổng bắt đầu.
4. Mỗi lượt chụp có countdown, thường 5-10 giây; khách tạo dáng, flash/camera chụp.
5. Khách chụp nhiều lượt, chọn ảnh ưng ý hoặc chọn ảnh đưa vào frame.
6. Hệ thống ghép frame/filter/template, in strip hoặc ảnh 10x15, đồng thời tạo QR/link/email/Zalo để lấy file số.
7. Nhân viên reset props/booth cho lượt tiếp theo nếu là event hoặc cửa hàng có vận hành.

Nguồn Việt Nam xác nhận các phần chính:

| Nguồn | Điểm đáng dùng cho app |
| --- | --- |
| PenConcept - hướng dẫn vận hành | Quy trình: kiểm tra thiết bị, hướng dẫn khách, chụp, chọn và in ảnh, gửi ảnh số, dọn props. Có countdown và chụp nhiều lần rồi chọn ảnh. |
| Cửu Long - hướng dẫn chụp | Kiosk có chọn cấu hình ảnh, thanh toán, đèn bật, timer tổng 2-3 phút. |
| SimpleTech - photobooth là gì | Người dùng nhìn màn hình, tạo dáng/căn góc, bấm nút chụp, màn hình đếm ngược 5 giây, flash rồi in ảnh. |
| SimpleTech - bộ sưu tập photobooth | Photobooth có màn hình cảm ứng để chụp, chỉnh sửa và in ảnh nhỏ gọn. |
| Fotomoto | Gói event có camera fullframe, flash, đèn studio, máy in DNP 15s/tấm, QR nhận file, prop và layout overlay. |
| 96 Photobooth / BlissfulBrides | Dịch vụ event có DSLR, đèn flash, in khoảng 15s, chia sẻ ảnh qua QR/Airdrop/email, frame theo chủ đề, phông nền/props. |
| Tuổi Trẻ / Phụ Nữ Online | Flow thực tế: nhân viên hướng dẫn vào booth trống, chọn khung/chủ đề/số lượng ảnh, thanh toán, in trực tiếp, quét QR tải bản mềm. |

## 2. 4 Shots / 6 Shots Nên Chạy Thế Nào

Korean-style 4-cut không phải “bấm một lần tự động xong hết” trong mọi trường hợp; điểm cốt lõi là khách thấy preview, có countdown, chụp thành nhiều pose, nhận strip cuối cùng. Thị trường thường có:

- **4-cut / Basic Four Cuts**: 4 ảnh dọc hoặc lưới 4 ảnh, thường in 2 strip giống nhau.
- **Multi Frame**: layout nhiều khung hơn hoặc frame đặc biệt, giá cao hơn Basic Four Cuts.
- **6-cut / multi-photo strip**: cùng logic 4-cut nhưng thêm slot; người dùng cần biết đang ở slot nào.

Flow web nên áp dụng:

1. Chọn `Single`, `4 shots`, hoặc `6 shots`.
2. Với 4/6: bấm `Start Session`, app tạo slot rỗng cố định.
3. Mỗi slot: live mirror preview -> `Capture` hoặc timer -> preview ảnh vừa chụp.
4. Người dùng bấm `Use Photo / OK` mới giữ ảnh slot hiện tại; `Retake` chụp lại slot đó.
5. Chọn filter cho slot hiện tại, bấm `Apply Filter`; sau khi slot có kết quả mới bấm `Next Photo`.
6. Sau khi tất cả slot đã apply filter: chọn frame/template, chỉnh crop/zoom nếu cần, rồi `Make Strip`, `Download Strip`, hoặc `Print Strip`.

Ghi chú scope project:

- Bài project này không mô phỏng kinh doanh photobooth, nên bỏ payment, bảng giá và gói thuê khỏi yêu cầu sản phẩm.
- Phần cần học theo thị trường là flow chụp: chọn frame/template, mirror preview, countdown, OK/Retake, chọn/căn ảnh, tạo strip, download/print.
- QR chỉ nên làm khi có share URL thật từ backend/storage; không tạo QR cho blob local vì link mất sau khi đóng tab.

## 3. Bảng Tính Năng Thực Tế

| Giai đoạn | Thị trường thực tế | Trạng thái app hiện tại | Khuyến nghị |
| --- | --- | --- | --- |
| Chọn gói | Chọn frame/gói/số bản in, đôi khi payment trước | Có Single/4/6; chưa có frame/gói/payment | Làm frame/template chooser, bỏ payment v1 |
| Chuẩn bị | Mirror preview, props, hướng dẫn pose, nhân viên hỗ trợ | Có camera preview mirror, face/gesture status | Thêm pose guide nhẹ, không cần nhân viên |
| Chụp | Countdown 5-10s, flash, timer tổng ở kiosk | Có timer từng shot: Off/3s/5s/10s, capture thủ công | Đạt cho web demo |
| Chọn ảnh | Chụp nhiều lần/chọn ảnh in | Có OK/Retake từng slot, review thumbnail, crop/zoom/reposition | Đạt flow chính |
| Filter/beauty | Filter, template, frame, sticker/branding | Có filter văn hoá, frame/template, crop/zoom; chưa beauty/sticker | Beauty/sticker bỏ qua v1 |
| In / chia sẻ | In 10-60s, QR/link/email/Zalo | Có download PNG, contact sheet, browser print; chưa QR thật | QR chỉ thêm khi có storage/share URL thật |
| Vận hành | Camera DSLR/fullframe, đèn, máy in, màn cảm ứng | Webcam/browser + backend image processing | Giữ web-first; không hứa chất lượng DSLR |

## 4. UX Checklist Cho App Web

- Màn hình đầu tiên phải vào thẳng booth, không landing page.
- Camera preview phải mirror ngang như người dùng soi gương; ảnh capture phải cùng hướng với preview.
- Button capture phải lớn, dễ bấm trên mobile; trạng thái disabled phải rõ.
- Với 4/6 shots luôn hiển thị `Slot x/n` và số ảnh đã OK.
- Sau capture phải hiện hai quyết định rõ: `Use Photo / OK` và `Retake`.
- Sau `Use Photo / OK`, người dùng phải chọn filter và `Apply Filter` cho slot đó trước khi qua slot tiếp theo.
- Không cho `Make Strip / Download Strip / Print Strip` khi chưa đủ slot đã apply filter.
- Review strip phải cho chọn từng thumbnail, retake từng ảnh, apply filter riêng.
- Nên có frame/template chọn trước hoặc trước khi xuất strip.
- Sau khi tạo strip cần có download rõ; nếu thêm QR thì QR phải trỏ tới blob/file hoặc backend storage hợp lệ.
- Nếu camera lỗi, hiển thị lý do ngắn: quyền camera, camera đang bị app khác dùng, hoặc browser không hỗ trợ.

## 5. Feature Gap Và Ưu Tiên Cho App Hiện Tại

Nên làm tiếp trong web:

1. **Đã làm - Frame/template chooser**: 4-shot có vertical strip, 2x2 grid, classic Korean; 6-shot có 3x2 grid và vertical strip.
2. **Đã làm - Crop/zoom từng slot**: review thumbnail mở ảnh hiện tại, kéo để reposition và dùng slider zoom; contact sheet dùng crop này.
3. **Đã làm - Pose guide**: gợi ý pose nhanh theo slot 1-4/6.
4. **Đã làm - Timer options**: Off/3s/5s/10s theo từng lần chụp.
5. **Đã làm - Print stylesheet / browser print**: hỗ trợ in contact sheet từ trình duyệt, không thêm endpoint.
6. **Chưa làm - QR/download bản số qua link thật**: chỉ nên thêm khi có backend storage/share URL; hiện tại download PNG là đủ cho demo.

Không nên làm ngay:

- Payment/VNPay/Momo: cần tài khoản merchant, bảo mật và luồng giao dịch thật.
- Điều khiển máy in DNP/thermal: cần phần cứng, driver, kiosk runtime.
- Lưu ảnh lâu dài/public gallery: liên quan dữ liệu cá nhân; cần consent, xoá dữ liệu, storage policy.
- Beauty AI nặng: dễ lệch kỳ vọng, tốn compute; ưu tiên crop/frame trước.
- Event staff/queue management: không cần cho web demo.

## 6. Nguồn

1. PenConcept - Hướng dẫn vận hành photobooth: https://penconcept.vn/huong-dan-van-hanh-photobooth-hieu-qua-cho-nguoi-moi/
2. PenConcept - Thiết bị photobooth Hàn Quốc: https://penconcept.vn/thiet-bi-photobooth-chup-anh-han-quoc-can-phai-co/
3. Cửu Long - Hướng dẫn cách chụp ảnh Photo Booth: https://truyenthongcuulong.com/chup-anh-photo-booth/
4. Cửu Long - Tạo dáng photobooth, khoảng cách/đèn: https://truyenthongcuulong.com/tao-dang-chup-anh-photobooth/
5. SimpleTech - Photobooth collection: https://simpletech.vn/collections/photobooth
6. SimpleTech - Photobooth là gì: https://simpletech.vn/blogs/photobooth/photobooth-la-gi
7. SimpleTech - Giá thuê photobooth: https://simpletech.vn/blogs/photobooth/thue-photobooth
8. Fotomoto - Dịch vụ photobooth: https://www.fotomoto.vn/photobooth/
9. Fotomoto homepage: https://www.fotomoto.vn/
10. Báo Đà Nẵng - Fotomoto in ảnh 15s, DSLR, frame: https://baodanang.vn/fotomoto-don-vi-di-dau-trong-dich-vu-photo-booth-chup-hinh-in-lay-lien-trong-moi-su-kien-3071508.html
11. 96 Photobooth website: https://www.96photoboothco.vn/
12. 96 Photobooth - photobooth di động: https://www.96photoboothco.vn/post/photobooth-di-%C4%91%E1%BB%99ng-d%E1%BB%8Bch-v%E1%BB%A5-ch%E1%BB%A5p-%E1%BA%A3nh-ho%C3%A0n-h%E1%BA%A3o-cho-m%E1%BB%8Di-s%E1%BB%B1-ki%E1%BB%87n
13. 96 Photobooth trên BlissfulBrides: https://blissfulbrides.vn/vendor/96-photobooth/
14. 96 Photobooth trên Marry.vn: https://www.marry.vn/nha-cung-cap/96-photobooth-co.-vietnam
15. Life4cut Vietnam TripAdvisor: https://www.tripadvisor.com/Attraction_Review-g25231262-d25423306-Reviews-Life4cut_Vietnam-Hai_Chau_Da_Nang.html
16. Life4cuts USA - QR/digital access: https://life4cutsusa.com/
17. Lemon8 - Life4cut trải nghiệm QR/download: https://www.lemon8-app.com/%40vanbamz/7161294408065794561?region=sg
18. Tuổi Trẻ / Phụ Nữ Online - flow và dữ liệu cá nhân: https://tuoitre.vn/phunuonline/chup-anh-photobooth-vui-tien-nhung-co-an-toan-du-lieu-ca-nhan-a1580502.html
19. Photo Booth 4U: https://photobooth4u.vn/
20. Printaphy Photobooth Vietnam: https://gallery.printaphy.com/
