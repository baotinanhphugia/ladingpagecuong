# HƯỚNG DẪN ĐẨY LÊN GITHUB PAGES MIỄN PHÍ TRONG 2 PHÚT

Landing Page này được xây dựng theo tiêu chuẩn chuẩn hóa, sẵn sàng chạy ngay trên **GitHub Pages** (hoặc bất kỳ dịch vụ web tĩnh nào như Cloudflare Pages, Vercel, Netlify) hoàn toàn miễn phí, có HTTPS và băng thông không giới hạn.

---

## CÁCH 1: DÙNG GITHUB DESKTOP HOẶC GIAO DIỆN WEB GITHUB

1. Đăng nhập [GitHub](https://github.com) -> Nhấn nút **New repository** (Tạo repo mới).
2. Đặt tên Repo, ví dụ: `giaythethao1` hoặc `donhang-giay`.
3. Chọn chế độ **Public** -> Bấm **Create repository**.
4. Kéo thả toàn bộ các tệp và thư mục trong thư mục `landingpage_giaythethao1` lên repo:
   - `index.html`
   - thư mục `images/`
   - `vietnam_provinces.json`
5. Nhấn **Commit changes**.
6. Vào tab **Settings** của repository trên GitHub -> Chọn mục **Pages** ở thanh menu bên trái.
7. Tại mục **Build and deployment**:
   - Source: Chọn **Deploy from a branch**
   - Branch: Chọn nhánh **`main`** (hoặc `master`), thư mục chọn **`/ (root)`** -> Nhấn **Save**.
8. Chờ khoảng 30 - 60 giây, GitHub Pages sẽ hiển thị đường link website của bạn:
   ```text
   https://<username>.github.io/<tên-repo>/
   ```
   Bạn có thể mở link trên điện thoại hoặc máy tính để chạy thử!

---

## CÁCH 2: DÙNG GIT TERMINAL TRÊN MÁY MAC

Mở Terminal và chạy các lệnh sau ngay tại thư mục dự án:

```bash
cd "/Users/edit/Documents/nghiên cứu dữ liệu /landingpage_giaythethao1"

# 1. Khởi tạo Git
git init
git add .
git commit -m "Khoi tao Landing Page Giay The Thao 100% clone kem Apps Script"

# 2. Đổi nhánh sang main
git branch -M main

# 3. Kết nối với repo GitHub của bạn (Thay URL repo thật của bạn vào)
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git

# 4. Đẩy mã nguồn lên GitHub
git push -u origin main
```

Sau khi đẩy xong, bạn chỉ cần vào **Settings** -> **Pages** trên GitHub và chọn nhánh `main` là xong!
