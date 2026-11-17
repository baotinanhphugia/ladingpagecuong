# HƯỚNG DẪN CÀI ĐẶT GOOGLE SHEETS & GOOGLE APPS SCRIPT (3 BƯỚC HOÀN TẤT)

Tài liệu này hướng dẫn chi tiết cách thiết lập Google Sheets và Google Apps Script để nhận toàn bộ đơn hàng từ Landing Page `giaythethao1` tự động 100%.

---

## BƯỚC 1: TẠO GOOGLE SHEET MỚI

1. Truy cập [Google Sheets](https://sheets.new) để tạo một bảng tính mới.
2. Đặt tên bảng tính, ví dụ: **Quản Lý Đơn Hàng Giày Thể Thao**.
3. Tại thanh menu trên cùng, chọn: **Tiện ích mở rộng** (Extensions) -> **Apps Script**.

---

## BƯỚC 2: DÁN MÃ NGUỒN VÀ TRIỂN KHAI (DEPLOY)

1. Xóa toàn bộ nội dung mặc định trong tệp `Mã.gs` (hoặc `Code.gs`).
2. Mở file **`google_apps_script/Code.gs`** trong dự án này, sao chép toàn bộ nội dung và dán vào Apps Script.
3. Nhấn biểu tượng **Lưu** (hình đĩa mềm) hoặc bấm tổ hợp phím `Ctrl + S` (hoặc `Cmd + S` trên Mac).
4. Nhấn nút xanh **Triển khai (Deploy)** ở góc trên bên phải màn hình -> Chọn **Tùy chọn triển khai mới (New deployment)**.
5. Cấu hình bảng triển khai như sau:
   - **Chọn loại (Select type)**: Bấm vào biểu tượng bánh răng ⚙️ -> Chọn **Ứng dụng web (Web app)**.
   - **Mô tả (Description)**: Ghi `Phát hành v1` (hoặc tùy ý).
   - **Thực thi dưới tên (Execute as)**: Chọn **Tôi (Chủ sở hữu)** (Me).
   - **Người có quyền truy cập (Who has access)**: **BẮT BUỘC CHỌN: Bất kỳ ai (Anyone)**. *(Lưu ý: Phải chọn Anyone thì khách hàng vào Landing Page từ điện thoại/máy tính mới gửi được đơn về Sheet mà không bị lỗi cấp quyền).*
6. Nhấn nút **Triển khai (Deploy)**.
7. Google sẽ hiển thị cửa sổ yêu cầu cấp quyền:
   - Chọn tài khoản Google của bạn -> Bấm **Nâng cao (Advanced)** -> Bấm **Đi tới dự án (Không an toàn)** -> Bấm **Cho phép (Allow)**.
8. Sau khi triển khai xong, Google sẽ cung cấp cho bạn một **URL Ứng dụng web (Web App URL)** có dạng:
   ```text
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
   👉 **Hãy sao chép (Copy) đường link URL này!**

---

## BƯỚC 3: DÁN LINK VÀO FILE `index.html`

1. Mở file **`landingpage_giaythethao1/index.html`**.
2. Tìm dòng khai báo biến `APPS_SCRIPT_URL` (khoảng dòng 380-400):
   ```javascript
   const APPS_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
   ```
3. Thay thế `"YOUR_GOOGLE_APPS_SCRIPT_URL_HERE"` bằng đường link bạn vừa copy ở Bước 2.
   Ví dụ:
   ```javascript
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_abc123.../exec";
   ```
4. Lưu lại file `index.html`.

**Chúc mừng bạn! Kể từ lúc này, mọi khách hàng bấm "Đặt ngay" trên Landing Page sẽ ngay lập tức được ghi vào Google Sheet "Orders"!**

---

## TÙY CHỌN: GỬI THÔNG BÁO TỨC THÌ VỀ TELEGRAM BOT

Nếu bạn muốn có đơn mới là điện thoại "Ting Ting" kèm nút **"Gọi khách"** và **"Nhắn Zalo"**:

1. Mở Telegram, tìm bot `@BotFather` và gõ `/newbot` để tạo 1 con bot mới và lấy **Bot Token**.
2. Tạo 1 nhóm Telegram (hoặc chat riêng với bot), thêm bot vào nhóm và lấy **Chat ID**.
3. Trong giao diện Google Apps Script:
   - Bấm vào biểu tượng **Cài đặt dự án (Project Settings)** (hình bánh răng ⚙️ ở cột bên trái).
   - Cuộn xuống phần **Thuộc tính tập lệnh (Script Properties)** -> Bấm **Thêm thuộc tính (Add script property)**:
     - Tên: `TELEGRAM_BOT_TOKEN` | Giá trị: *Điền token bot của bạn*
     - Tên: `TELEGRAM_CHAT_ID` | Giá trị: *Điền chat ID của bạn*
   - Bấm **Lưu thuộc tính tập lệnh**.
