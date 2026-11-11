# BTL An Toàn Thông Tin — Web Mô phỏng Kịch bản 4 Thành viên (DVWA Security Audit)

Trang web tương tác mô phỏng toàn bộ kịch bản thực hành **Kiểm thử Hộp đen (Black-Box)** và **Kiểm toán Hộp trắng (White-Box)** trên hệ thống mục tiêu **DVWA (`vulnerables/web-dvwa`)**, chia rõ từng bước thực hành cho **4 thành viên** (1 MacBook macOS + 3 Laptop Windows Ubuntu VM) và hỗ trợ nâng Band 9.5 (Live Patching, Log Forensics, Bcrypt, Least Privilege DB, WAF ModSecurity).

---

## 1. Cấu trúc Các Trang Chính

- **`/` (Trang chủ — Form tổng quan ý tưởng chính BTL):**
  - Định danh đề tài, chuẩn kiểm thử PTES kết hợp Black-box & White-box, mục tiêu OWASP A03:2021.
  - Sơ đồ luồng 4 giai đoạn tấn công → phòng thủ kết nối trực tiếp tới từng thành viên.
  - Bảng phân vai 4 thành viên (`Slide 1–7`, `8–9`, `10–11`, `12–15`, 3,5–4 phút/người) kèm tiến độ đồng bộ.
  - Bảng chuẩn hóa rủi ro quốc tế (`CWE-89`, `CWE-200`, `CWE-759`, `CWE-614` + CVSS v3.1) & bảng đối chiếu kỹ thuật `low.php` vs `impossible.php`.
- **`/thanh-vien/1` .. `/thanh-vien/4` (Kịch bản chi tiết từng người + Trình mô phỏng):**
  - Bộ điền biến động (`Container ID/Name`, `PHPSESSID`, `user_token`) tự cập nhật vào mọi câu lệnh để copy 1 chạm.
  - Kịch bản từng bước: mục tiêu, thao tác chi tiết đánh số, câu lệnh copy, kết quả kỳ vọng, lời thoại thuyết trình, giải thích học thuật.
  - Trình mô phỏng thực tế riêng cho từng người (Terminal Trinh sát & Live Apache Patch; Burp Suite Repeater & Log Forensics; SQLMap 3 lệnh & MariaDB Bcrypt/Least Privilege; Diff PHP 4 cấp độ, PoC 5 gốc vs tinh chỉnh & WAF ModSecurity Tester).
  - Checklist hoàn thành & ghi chú cá nhân lưu trực tiếp lên Supabase + Ngân hàng câu hỏi phản biện Q&A.
- **`/lab-setup` (Cài đặt Lab Ubuntu & Kết nối Supabase):**
  - Tải script 1-click `setup_dvwa_ubuntu.sh` cho 3 máy ảo Ubuntu.
  - Hướng dẫn khởi tạo bảng Supabase và nút 1-click đồng bộ dữ liệu lên Supabase.

---

## 2. Thiết lập Cơ sở dữ liệu Supabase

1. Tạo project tại [supabase.com](https://supabase.com) (khuyên chọn region Singapore).
2. Vào **SQL Editor**, dán và chạy toàn bộ file `supabase/schema.sql`.
3. Chạy tiếp file `supabase/seed.sql` (hoặc sau khi gắn biến môi trường lên Vercel, bấm nút **"Seed / Đồng bộ dữ liệu lên Supabase"** tại `/lab-setup`).
4. Lấy `Project URL` và `anon public key` tại **Project Settings → API**.

---

## 3. Chạy Local & Deploy Vercel

```bash
npm install
cp .env.example .env.local
# Điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY vào .env.local
npm run dev
```

Trên Vercel, cấu hình 2 Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
