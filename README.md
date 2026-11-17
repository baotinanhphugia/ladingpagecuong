# DỰ ÁN CLONE 100% LANDING PAGE GIÀY THỂ THAO BẢO HỘ HÙNG VIỆT
### Kiến trúc: GitHub Pages + Google Apps Script Web App + Google Sheets Orders

> Được sao chép nguyên mẫu 100% chính xác từng điểm ảnh từ: `https://www.donhang.site/giaythethao1`  
> Đầy đủ tài nguyên Master Quality, Video mp4, Bảng quy đổi Size, Form xác thực SĐT/Tỉnh Thành và 2 Popup tương tác.

---

## 📂 Cấu trúc Thư mục Dự án

```text
landingpage_giaythethao1/
├── index.html                           # Mã nguồn Landing Page hoàn chỉnh (100% độc lập, không phụ thuộc Pancake CDN)
├── vietnam_provinces.json               # Cơ sở dữ liệu 63 Tỉnh/Thành & toàn bộ Quận/Huyện Việt Nam
├── DEPLOY_GITHUB_PAGES.md               # Hướng dẫn chi tiết triển khai lên GitHub Pages miễn phí
├── README.md                            # Tổng quan dự án
├── images/                              # Thư mục chứa 30 ảnh gốc chất lượng cao + 6 icon + 1 video mp4
│   ├── anh_01_...png đến anh_31_...jpg  # Ảnh sản phẩm, chi tiết mũi thép, đế chống đinh, banner
│   ├── icon_01.svg đến icon_06.png      # Các icon vector và bảng size guide
│   └── video_gioi_thieu_giay.mp4        # Video review cận cảnh 1080x1440
└── google_apps_script/
    ├── Code.gs                          # Mã nguồn Google Apps Script (doPost, doGet, khóa lock, Telegram)
    └── HUONG_DAN_CAI_DAT_GOOGLE_SHEET.md# Hướng dẫn cài đặt Google Sheets & Apps Script 3 bước
```

---

## 🌟 Các tính năng nổi bật được sao chép & nâng cấp

1. **Giao diện & Cấu trúc 100% chuẩn xác:**
   - Sticky Header cố định đỉnh trang có nút CTA "ĐẶT MUA NGAY".
   - Hero Section đầy đủ huy hiệu giảm giá 40%, giá gốc 599k, quà freeship khi mua 2 đôi.
   - Section Chi tiết sản phẩm với 3 khối tính năng an toàn (Đế chống đinh, Mũi thép chịu lực, Thoáng khí êm ái), bảng thông số kỹ thuật và video player tương tác.
   - Bảng giá ưu đãi 3 mẫu sản phẩm: Giày Safety Cổ cao (399k), Giày Safety Cổ thấp (329k), Giày Thể thao Hammer (329k).
   - Nút "ĐẶT HÀNG NGAY" trên từng sản phẩm sẽ tự động chọn đúng dòng sản phẩm đó trên form và cuộn mượt xuống.

2. **Hệ thống 2 Popups (Modal) hoàn chỉnh:**
   - **Popup 1 - Bảng Size (`w-sqgjtecr`):** Bấm "TƯ VẤN SIZE" hoặc nút "BẢNG SIZE" trên bất kỳ thẻ sản phẩm nào sẽ bật popup bảng đo kích thước chân chuẩn xác, có nút tắt [X] và tắt khi click nền mờ.
   - **Popup 2 - Đặt Hàng Thành Công (`w-__popup_default__`):** Khi gửi form thành công, hệ thống tự động bật popup chúc mừng kèm chi tiết đơn hàng (Mã đơn hàng, Họ tên, SĐT, Sản phẩm, Địa chỉ giao hàng).

3. **Form Đặt Hàng Thông Minh (Checkout Form):**
   - Xác thực họ tên, kiểm tra số điện thoại chuẩn định dạng Việt Nam 10 số.
   - Bộ chọn địa chỉ 2 cấp: Chọn **Tỉnh/Thành** tự động nạp danh sách **Quận/Huyện** tương ứng (đầy đủ 63 tỉnh thành).
   - Bộ chọn Size trực quan từ size 36 đến size 47 với hiệu ứng chọn sáng viền vàng cam.

4. **Kết nối Tự động Đa nền tảng:**
   - Dữ liệu gửi thẳng về **Google Sheets** theo thời gian thực.
   - Số điện thoại được lưu chuẩn chuỗi ký tự `'0xxxxxxxxx` (không bao giờ bị mất số 0).
   - Lưu trữ dự phòng tự động tại `localStorage` trình duyệt khách hàng, không bao giờ lo mất đơn kể cả khi mạng chập chờn.
   - Hỗ trợ gửi thông báo tức thì về nhóm chat **Telegram** kèm nút bấm gọi trực tiếp cho khách hàng.
