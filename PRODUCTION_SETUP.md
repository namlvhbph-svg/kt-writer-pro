# KT Writer PRO — Xưởng sản xuất nội dung

## Chạy tại máy

Yêu cầu Node.js 22.6 trở lên. Trên Windows PowerShell dùng `npm.cmd` nếu hệ thống chặn `npm.ps1`.

```sh
npm install
npm run dev
npm run check
npm run test:production
npm run build:prod
```

Đăng nhập và mở `/production` hoặc mục **Xưởng sản xuất nội dung** trong thanh điều hướng.

## Bật chức năng AI

Backend dùng Supabase hiện có và OpenAI Responses API. Khóa AI chỉ lưu tại Supabase Secrets, tuyệt đối không đưa vào biến `VITE_*` hay trình duyệt.

1. Trong Supabase Dashboard của dự án đang dùng, thêm hai Secrets: `OPENAI_API_KEY` và `OPENAI_MODEL`. Chọn model tài khoản của bạn có quyền sử dụng, hỗ trợ Responses API và Structured Outputs. Không có model mặc định ngầm.
2. Triển khai thư mục `supabase/functions/kt-generate-article` (bao gồm `contract.ts`) bằng Supabase CLI đã đăng nhập:

```sh
supabase functions deploy kt-generate-article --project-ref uqldbfisdwjhhqhvvmzx
```

3. Giữ xác thực JWT được bật. Hàm cũng kiểm tra phiên người dùng bằng `auth.getUser()` và đọc nguồn bằng quyền của người đăng nhập. Không dùng service-role key.
4. Cơ sở dữ liệu cần các bảng trong hai migration hiện có. Nếu dự án đã có bảng, không chạy lại migration tạo bảng. Bản cập nhật xưởng nội dung không cần thêm bảng.

Tài liệu API đã đối chiếu: [OpenAI — Text generation](https://developers.openai.com/api/docs/guides/text).

## Quy trình sử dụng

1. Thêm tài liệu trong kho nguồn hoặc dùng chức năng thu thập hiện có. Nhập nội dung thực tế tối thiểu 300 ký tự, URL và ngày ban hành/đăng chính xác. Có thể dùng nhóm Tài chính hoặc Tin nóng cho nguồn tương ứng.
2. Chọn một trong bốn chuyên mục: Kế toán, Thuế, Tài chính, Tin nóng. Chọn tài liệu và đặt độc giả, định dạng, độ dài, yêu cầu SEO.
3. Tạo bản nháp AI, chỉnh tiêu đề, mô tả và Markdown ngay tại xưởng. Tạo lại thay bản đang hiển thị; lưu trước để giữ bản cũ. Rời trang sẽ mất bản chưa lưu.
4. Lưu vào kho bài viết ở trạng thái Nháp. Mở trình biên tập để đối chiếu nguồn và chuyển trạng thái duyệt. Xuất Markdown hoặc JSON bằng chức năng hiện có.

Tin nóng bắt buộc URL HTTP/HTTPS và ngày nguồn trong 72 giờ gần đây, không chấp nhận ngày tương lai. Ngày này là trường `issued_date` do người dùng cung cấp; hệ thống không tự xác thực ngày trên trang gốc. Xưởng hiện viết từ nguồn đã chọn, chưa có dò xu hướng trực tuyến, lịch sản xuất nền, tự đăng CMS hay đăng đa kênh. Trạng thái “Đã xuất bản” hiện chỉ là trạng thái nội bộ.

Checklist chỉ kiểm tra cấu trúc và mức độ đầy đủ, không chứng nhận chính xác pháp lý. Người duyệt cần kiểm tra hiệu lực văn bản, điều khoản, số liệu và sự kiện. Máy chủ giới hạn nội dung nguồn gửi AI ở 24.000 ký tự; dùng tài liệu phù hợp với chủ đề và kiểm tra lại văn bản dài.

## Trạng thái kiểm chứng

Kiểm tra mã nguồn gồm lint, TypeScript, build và các ca kiểm thử hợp đồng tạo bài. Kiểm thử tạo bài thực qua AI cần Secrets và Edge Function đã triển khai; không thể suy ra thành công chỉ từ build frontend.
