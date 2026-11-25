# ĐẶC TẢ KIẾN TRÚC HỢP NHẤT & CẢI TIẾN (V2) — MINI-WAF PROJECT

**Đề tài:** Xây dựng Hệ thống Tường lửa Ứng dụng Web Chủ động (Mini-WAF) Kết hợp Giám sát Thời gian thực và Đánh giá Hiệu năng  
**Nhóm thực hiện:** Sơn (Nhóm trưởng), Hùng, Quyết, Khánh (04 thành viên — 01 macOS + 03 Ubuntu Linux VM)  
**Công nghệ lõi:** Python 3.11+, FastAPI, HTTPX, SQLite WAL (`aiosqlite`), Docker Compose  

---

## 1. Các Điểm Mâu thuẫn Đã được Xử lý giữa Bản Đặc tả 9 Trang & Đề cương 11 Trang

1. **Hợp nhất Mục tiêu Kiểm thử Kép (`target_web` + `DVWA`)**:
   - Reverse Proxy cấu hình qua biến `UPSTREAM_URL` bên trong mạng nội bộ cô lập `backend_net (internal: true)`.
   - Mặc định trỏ tới `target_web` (Website Quản lý Điểm Sinh viên tự lập trình cổng `8000`) hỗ trợ hai chế độ `APP_SECURITY_MODE=vulnerable | secure` để chứng minh thực nghiệm đối chứng, đồng thời kích hoạt song song DVWA qua Docker Compose profile (`--profile dvwa`).
   - Cả hai ứng dụng mục tiêu đều **không mở cổng ra máy Host**, đảm bảo mọi lưu lượng bắt buộc đi qua Mini-WAF cổng `:8080`.
2. **Tách biệt Cổng Quản trị `:8888` & Khóa Xác thực Admin**:
   - Khắc phục rủi ro lộ `/dashboard` ngay trên cổng Proxy `:8080` bằng cách chạy hai tiến trình ASGI độc lập: Proxy ở `:8080` và Control Plane Dashboard ở `127.0.0.1:8888`.
   - Bảo vệ toàn bộ API `/api/stats`, `/api/mode`, `/api/unban`, `/api/defense-config` trên `:8888` bằng Cookie phiên `HttpOnly; SameSite=Lax` / Header `X-Admin-Token`. Cổng `:8080` trả `404` đối với mọi truy cập tới API quản trị.
3. **Chuẩn hóa Tín hiệu `User-Agent` (`SCN-01`) Tránh Khóa Nhầm**:
   - Hạ trọng số `SCN-01` từ `+10` xuống `+3` (dưới ngưỡng chặn `5`): chỉ riêng `User-Agent` (vốn dễ giả mạo) sẽ không khóa cứng request bình thường, nhưng khi đi kèm bất kỳ tín hiệu tấn công nào khác (`SQL-01` `+2`, `SCN-02` nhạy cảm `/.env` `+3`) sẽ chạm ngưỡng `>= 5` và bị `BLOCK` ngay lập tức.
4. **Chuẩn hóa Đa tầng Chống Né lọc & Phân tích Từ vựng SQL**:
   - `waf/inspection/parser.py`: Hỗ trợ bảo toàn nhiều tham số trùng tên (**HTTP Parameter Pollution**, ghép `query_hpp`), trích xuất đệ quy cây JSON lồng nhau, giới hạn kích thước tham số (`4096` bytes) chống **ReDoS** và giữ nguyên HTML entity gửi thẳng trên query string.
   - `waf/inspection/normalizer.py`: Tạo đồng thời 2 biểu diễn `spaced` (biến `/**/` thành dấu cách tránh dính chữ `SELECTFROM`) và `collapsed` (ghép chữ bị tách `UN/**/ION`), kết hợp giải mã URL đệ quy 3 lớp, Unicode NFKC, `\uXXXX` và gỡ comment điều kiện MySQL `/*!50000...*/`.
   - `waf/inspection/sql_lexer.py`: Bộ phân tích từ vựng SQL nhận diện cấu trúc ngữ pháp giúp ca biên họ tên chứa dấu nháy đơn (`O'Brien`, `D'Angelo`, `O'Connor`) và biểu thức toán học (`5 < 10`) đạt **0% chặn nhầm**.
5. **Phòng thủ Chủ động Có Kiểm soát & An toàn Dữ liệu Nhật ký**:
   - Hỗ trợ đồng thời **Fixed Window** và **Sliding Window (`collections.deque`)** để kiểm chứng thực nghiệm lỗi đột biến lưu lượng gấp đôi tại ranh giới khung thời gian cố định.
   - Chống giả mạo `X-Forwarded-For`: chỉ tin cậy IP chuyển tiếp nếu socket peer nằm trong `TRUSTED_PROXIES`.
   - Bật `PRAGMA journal_mode = WAL` trên SQLite cho truy xuất đồng thời, che giấu `password`, `Cookie`, `Authorization`, JWT (`***MASKED***`) trước khi ghi DB và tuyệt đối không gửi payload thô hay PII qua Telegram Bot bất đồng bộ.

---

## 2. Kết quả Thực nghiệm Tự động (Chạy trên `mini-waf-project`)

- **Kiểm thử Đơn vị & Tích hợp (`pytest`)**: `9/9 PASSED` (0.31s).
- **Đánh giá Định lượng 100 Mẫu x 3 Lượt (`benchmark/run_benchmark.py`)**:
  - **Chế độ `OFF` (Không WAF):** `300/300` request chạm máy chủ đích; Latency TB = `0.853 ms` (Median `0.797 ms`, p95 `1.142 ms`).
  - **Chế độ `MONITOR`:** Phát hiện `50/50` sự kiện (`monitored_logged = 50`), máy chủ đích vẫn nhận `100/100` request (không can thiệp chặn).
  - **Chế độ `BLOCKING`:**
    - `TP = 50`, `FP = 0`, `TN = 50`, `FN = 0`
    - `Precision = 100.0%` | `Recall (TPR) = 100.0%` | `FPR = 0.0%` | `F1-score = 100.0%`
    - Latency TB = `1.545 ms` (Median `1.648 ms`, p95 `2.072 ms`) → Độ trễ phụ trội ($\Delta t$) = **`+0.692 ms`** (p95 $\Delta t$ = `+0.930 ms`).
    - **Backend Shielding:** Chỉ đúng `150` request sạch đi tới máy chủ đích (`0` payload độc hại lọt qua!).
  - **Active Defense:** Sliding Window kích hoạt chính xác `HTTP 429` kèm `Retry-After`, Auto-Ban khóa `403` tự động từ lần vi phạm thứ 3 và gỡ được trực tiếp qua `/api/unban`.
