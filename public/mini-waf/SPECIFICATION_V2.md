# ĐẶC TẢ KIẾN TRÚC HỢP NHẤT & PHÂN CÔNG CHUẨN (V2) — MINI-WAF PROJECT

**Đề tài:** Xây dựng Hệ thống Tường lửa Ứng dụng Web Chủ động (Mini-WAF) Kết hợp Giám sát Thời gian thực và Đánh giá Hiệu năng  
**Nhóm thực hiện:** Sơn (Nhóm trưởng), Hùng, Quyết, Khánh (04 thành viên — 01 macOS + 03 Ubuntu Linux VM)

---

## 1. Bảng Phân công Mã nguồn & Điểm Trọng tâm Phản biện (25% / Thành viên)

| Thành viên | Vai trò & Phạm vi sở hữu | Thư mục / Tệp trực tiếp code | Trọng tâm Bảo vệ ATTT khi Giảng viên hỏi |
| :--- | :--- | :--- | :--- |
| **1. Sơn** | Web Demo 2 chế độ & Cửa ngõ Reverse Proxy | `target_web/` (cổng `8000`), `waf/main.py`, `waf/proxy/server.py`, `waf/proxy/forward.py`, `docker-compose.yml` | Thiết kế Website Quản lý Điểm Sinh viên với 2 chế độ `VULNERABLE` / `HARDENED` (Secure Coding), lập trình Reverse Proxy bất đồng bộ (FastAPI + HTTPX), xóa `Server` / `X-Powered-By`, gắn `HttpOnly; SameSite=Lax`, cô lập mạng `backend_net: internal=true` không mở port `8000` ra Host. |
| **2. Hùng** | Bộ não Phân tích Nội dung (Inspection Engine) | `waf/inspection/parser.py`, `normalizer.py`, `sqli.py`, `xss.py`, `traversal.py`, `engine.py`, `waf/rules.json` | Chuẩn hóa chống bypass đa tầng (URL decode 3 lớp, HTML entity, NFKC, `un/**/ion` & `/*!50000...*/`), bảo toàn HPP & JSON lồng nhau, kết hợp SQL Lexical Tokenizer trong `sqli.py` nhận diện SQLi/XSS/Path Traversal và đạt **0% chặn nhầm** trên tên `O'Brien`, `D'Angelo`, `5 < 10`. |
| **3. Quyết** | Phòng thủ Hành vi & Trung tâm Giám sát | `waf/protection/` (`rate_limit.py`, `blacklist.py`, `decision.py`, `client_ip.py`), `waf/database/`, `waf/monitoring/` (`logger.py`, `dashboard.py`, `telegram_alert.py`, `dashboard.html`) | So sánh Fixed vs Sliding Window (`deque`), Auto-Ban có TTL 300s, chống giả mạo `X-Forwarded-For`, lưu SQLite WAL có masking `Cookie`/`password`/`Bearer`, Dashboard tách cổng `:8888` xác thực Admin & nút `Unban`, Telegram bất đồng bộ không lộ PII. |
| **4. Khánh** | Kiểm thử Xâm nhập & Đo kiểm Khoa học | `tests/` (`test_sqli.py`, `test_xss.py`, `test_proxy.py`, `test_defense.py`, `benchmark.py`), `benchmark/dataset.json` | Dùng Nmap/Burp Suite/SQLMap kiểm chứng đối chứng (Không WAF vs Có WAF vs `HARDENED`), đo `Precision`, `Recall (TPR)`, `FPR`, `F1-score`, Backend Shielding (`0` attack hits) và độ trễ `mean`, `median`, `p95`. |

---

## 2. Kết quả Thực nghiệm Đã đo Đạc (`tests/benchmark.py` & `pytest`)

- **Bộ kiểm thử Đơn vị & Tích hợp (`pytest`)**: **`13 passed in 0.38s`** (0 warnings) trên `test_sqli.py`, `test_xss.py`, `test_proxy.py`, `test_defense.py`.
- **Kiểm chứng TCP đa tiến trình**: Proxy `:8080` ẩn hoàn toàn header `Server`, gắn `X-Frame-Options: DENY`, cho qua `O'Brien` (`200 OK`) và chặn SQLi obfuscation (`403 Forbidden`), cổng `:8888` ghi nhận thống kê tách biệt.
- **Đo kiểm 100 Mẫu x 3 Lượt (`300` requests/chế độ):**
  - **Không WAF (`OFF`):** `300/300` request chạm `target_web`; Latency Mean = `0.928 ms`, Median = `0.859 ms`, p95 = `1.404 ms`.
  - **Có Mini-WAF (`MONITOR`):** Phát hiện `50/50` sự kiện (`monitored_logged = 50`), không can thiệp lưu lượng.
  - **Có Mini-WAF (`BLOCKING`):** `TP = 50, FP = 0, TN = 50, FN = 0` → `Precision = 100.0%`, `Recall (TPR) = 100.0%`, `FPR = 0.0%`, `F1-score = 100.0%`. Latency Mean = `1.637 ms` (Median `1.693 ms`, p95 `2.16 ms`), độ trễ phụ trội TB = **`+0.709 ms`**. Chỉ đúng `150` request sạch đi tới `target_web` (`0` payload độc hại lọt qua).
