# Glassboard v2.1 — Liquid Glass Dashboard

New Tab extension cho Chrome/Edge, bố cục bám sát wireframe người dùng cung cấp.

## Bố cục v2.1
- Đồng hồ đặt góc trên bên trái theo wireframe cập nhật.
- Dynamic Island căn giữa màn hình.
- Hai cụm chức năng/widget áp sát mép trái/phải khoảng 2–5 px.
- Dock và nút + được căn giữa theo toàn màn hình.
- Dock hỗ trợ favicon tự lấy từ `/favicon.ico` của website; để trống trường icon khi thêm link để dùng favicon, hoặc nhập emoji/ký tự để dùng icon chữ.

## Bố cục
- Thanh trạng thái Liquid Glass ở phía trên giữa, có hiệu ứng gradient sRGB chuyển động.
- Đồng hồ, ngày và lời chào ở trung tâm.
- Thanh tìm kiếm Google.
- Ba nút chức năng bên trái: cài đặt, quản lý widget, bookmark.
- Ba widget bên phải: thời tiết, ghi chú tự lưu, mini widget đếm tương tác.
- Dock macOS ở cạnh dưới, icon phóng to khi rê chuột.

## Offline
CSS, JavaScript, icon và font đều chạy local. Không dùng CDN, Google Fonts, ảnh ngoài hoặc thư viện bên thứ ba. Chỉ widget thời tiết gọi Open-Meteo qua Internet. Hình nền mặc định là gradient CSS; hình nền cá nhân được lưu trong chrome.storage.local.

## Cài đặt
1. Giải nén file ZIP.
2. Chrome: mở `chrome://extensions`; Edge: mở `edge://extensions`.
3. Bật Developer mode.
4. Chọn Load unpacked và chọn thư mục `glassboard-v2`.
5. Mở tab mới. Nếu cập nhật code, bấm Reload trên trang Extensions.

## Ghi chú
- Thiết kế dùng CSS Grid, `100dvh`, `overflow:hidden`, `clamp()` và media queries để co giãn, không cuộn.
- Trên màn hình nhỏ, các widget chuyển thành hàng ngang; ở màn hình rất hẹp, widget giải trí tự ẩn để ưu tiên đồng hồ, ghi chú, thời tiết và Dock.
- Hình nền tải lên tối đa 5 MB.
- Bookmark Manager đọc bookmark thông qua quyền `bookmarks`.
- Weather sử dụng API miễn phí Open-Meteo, không cần API key.
