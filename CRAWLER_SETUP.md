# Thu thập nội dung vào kho, không cần API AI

## Chạy bộ quét mới

Từ CMD tại máy đang có mã nguồn:

```cmd
cd /d C:\kt-writer-pro-source
npx.cmd supabase functions deploy kt-crawl-sources --project-ref uqldbfisdwjhhqhvvmzx --use-api
```

Giữ xác thực JWT bật. Hàm kiểm tra người đăng nhập và lưu bằng quyền người dùng, không sử dụng khóa OpenAI hoặc service-role.

## Cấu hình nguồn

Vào **Cấu hình → Nguồn**, thêm hoặc sửa từng nguồn:

1. Chọn nhóm **Kế toán**, **Thuế**, **Tài chính** hoặc **Tin nóng**.
2. Nhập URL trang chuyên mục công khai chứa bài cần thu thập (HTML, cùng tên miền với bài chi tiết). Có thể thêm nhiều nguồn cho mỗi nhóm.
3. Nếu cần, nhập chuỗi trong URL bài vào bộ lọc liên kết, ví dụ `/kinh-nghiem-ke-toan/` hoặc `.html`. Để trống nếu chưa biết; bộ quét vẫn kiểm tra bài chi tiết.
4. Bật nguồn và lưu. Nhóm nội dung được tự tạo trong kho khi quét nguồn đó.

Hai địa chỉ đã thử đọc bài công khai trong đợt sửa: `https://ketoanleanh.edu.vn/kinh-nghiem-ke-toan` và `https://vnexpress.net/thoi-su`. Với nguồn tài chính có thể cấu hình chuyên mục tương ứng; kết quả cần được người dùng kiểm tra đúng phạm vi nội dung. Nguồn Thuế cần URL chuyên mục HTML hoạt động; không dùng trang bị chặn truy cập. Máy chủ nguồn có thể thay đổi hoặc chặn bot, nên không đảm bảo mọi trang đều quét được.

## Thu thập và tiếp tục

Mở **Kho tài liệu & tin tức → Quét nguồn tự động**. Mỗi lần gọi xử lý **một nguồn, tối đa hai liên kết chi tiết**, kể cả trang bị loại/tải lỗi. Kết quả phân biệt số bài mới, trùng và bị loại/tải lỗi.

Nếu còn danh sách, bấm quét lần nữa. Vị trí và danh sách liên kết được giữ trong session của tab trình duyệt theo người dùng và phạm vi quét. Vòng quét chung đi qua các nguồn đang bật theo thứ tự cố định. Vòng hoàn tất hoặc tab đóng sẽ bắt đầu danh sách mới lần sau; bài đã lưu được bỏ qua theo URL. Tài liệu chưa tải được có thể thử lại trong vòng quét mới. Không tự chạy nền hay tự chuyển sang trang danh mục tiếp theo; mỗi vòng lấy tối đa 100 liên kết ở URL danh mục đã cấu hình.

## Dữ liệu lưu

- Tiêu đề, URL gốc, toàn văn chính (tối đa 80.000 ký tự), ngày đăng nếu có metadata/time, nguồn và nhóm nội dung.
- Ngày phát hiện/thu thập dùng trường riêng; không lấy ngày quét giả làm ngày đăng.
- Trạng thái ban đầu Mới, hiệu lực pháp lý Chưa xác định. Không tự coi tin tức là văn bản pháp luật hoặc gắn loại VAS.
- Chống trùng URL; so sánh thêm dấu vân tay nội dung cho tài liệu do bộ quét mới tạo.

## Giới hạn và dữ liệu cũ

Giới hạn HTML 700 KB/trang, timeout tối đa 10 giây/tải, tối đa hai trang chi tiết mỗi yêu cầu để giảm nguy cơ vượt CPU của Supabase. Không tải file PDF/Word, không chạy JavaScript và không vượt CAPTCHA/đăng nhập. Trang không nhận diện chắc chắn nội dung sẽ bị bỏ qua thay vì lưu toàn bộ menu.

Các bản ghi cũ như “Chuyên mục…”, “Media Luật” không tự bị xóa. Kiểm tra và xóa từng bản ghi lỗi bằng giao diện nếu cần; bộ quét mới chỉ thay đổi cách thu thập từ nay.

Kiểm tra mã: `npm run check`, `npm run test:crawler`, `npm run test:production`, `npm run build:prod`.
