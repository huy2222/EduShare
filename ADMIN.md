# Khu vực quản trị EduShare

## Chạy thử

Khởi động backend với cấu hình cơ sở dữ liệu hiện tại (chạy mặc định từ IDE cũng tạo tài khoản mẫu):

```powershell
cd backend/edushare
.\mvnw.cmd spring-boot:run
```

Nếu `JAVA_HOME` chưa đúng, đặt biến này trỏ tới JDK 21 đang cài trên máy trước khi chạy Maven.

Khởi động frontend ở terminal khác:

```powershell
cd frontend
npm run dev
```

Đăng nhập tại `/login` bằng tài khoản **admin**, mật khẩu **admin123**. Sau khi đăng nhập, ứng dụng chuyển đến `/admin`. Menu tài khoản ở trang chủ cũng có liên kết **Quản trị hệ thống**.

Tài khoản mẫu được tạo khi chạy không chỉ định profile (`default`) hoặc dùng profile `dev`, mật khẩu được mã hoá bằng PasswordEncoder hiện có. Nếu tài khoản `admin` đã tồn tại, initializer không sửa mật khẩu, vai trò hoặc trạng thái của nó. Các profile khác tiếp tục sử dụng cơ chế cấp quyền admin hiện có. Sau khi cập nhật code, cần khởi động lại backend để initializer chạy.

## Chức năng

- `/admin`: thống kê người dùng, trạng thái tài khoản, khoa, môn học và tài liệu từ cơ sở dữ liệu.
- `/admin/users`: tìm theo tên/email, lọc vai trò/trạng thái, phân trang, xem thông tin, phân quyền và khoá/mở tài khoản đã xác thực. Không thể tự sửa quyền hoặc tự khoá tài khoản đang sử dụng. Tài khoản chưa xác thực vẫn phải hoàn tất luồng xác thực email.
- `/admin/faculties`: mục **Khoa & ngành** có hai tab. Tab Khoa cho phép thêm/sửa/xoá khoa và mở danh sách ngành trực thuộc bằng nút **Xem ngành**. Tab Ngành cho phép thêm/sửa/xoá ngành và lọc theo khoa. Mỗi ngành thuộc một khoa; có thể chuyển khoa quản lý. Khoa còn ngành hoặc môn học không thể xoá. Ngành còn môn học hoặc hồ sơ người dùng không thể xoá.
- `/admin/subjects`: mỗi môn có một khoa phụ trách, số tín chỉ và nhiều ngành sử dụng. Ngành sử dụng có thể thuộc khoa khác; đổi khoa phụ trách không tự bỏ các ngành đã chọn. Có bộ lọc theo khoa phụ trách và ngành sử dụng. Môn đã có tài liệu không thể xoá. Chọn ngành sử dụng môn học để môn xuất hiện trong luồng tải tài liệu hiện có.

Backend giữ cấu trúc feature/controller/service/repository, trả về `ApiResponse`, dùng xác thực cookie và CSRF hiện có. Các API `/api/v1/admin/**` chỉ cho phép ADMIN. Mỗi yêu cầu xác thực đọc lại trạng thái và quyền hiện tại để việc khoá tài khoản hoặc thay đổi quyền áp dụng cho cả token đã cấp.

Quan hệ `subjects.faculty_id` được bổ sung qua Hibernate `ddl-auto: update` đang dùng trong dự án. Môn cũ chưa có quan hệ trực tiếp này được hiển thị theo khoa của ngành liên kết; lưu môn từ trang admin sẽ ghi khoa được chọn. Quan hệ ngành–môn cũ được giữ nguyên cho đến khi chỉnh sửa.

## Kiểm tra

```powershell
# frontend
npm test
npm run build

# backend
.\mvnw.cmd test
```

Kiểm thử admin nằm ở `frontend/src/pages/AdminPages.test.jsx` và `backend/edushare/src/test/java/org/example/edushare/feature/admin/AdminServiceTest.java`.

## Tốc độ tải admin

Các cải tiến đã áp dụng:

- Trang admin dùng thông tin đăng nhập do App đã tải, bỏ lần gọi `/users/me` trùng lặp.
- Chỉ chờ 250 ms khi nhập từ khoá tìm người dùng; mở danh sách hoặc lọc không có từ khoá được gửi ngay.
- Tổng quan gom thống kê người dùng theo trạng thái: còn 4 truy vấn dữ liệu thay vì 8.
- Danh sách người dùng phân trang ở database; tải hồ sơ/vai trò của 10 người dùng trong trang bằng truy vấn chung, tránh truy vấn riêng từng dòng. Kiểm thử xác nhận tối đa 3 truy vấn dữ liệu cho trang đầy đủ.
- Kiểm tra tài khoản/quyền lấy dữ liệu liên quan bằng một truy vấn; không cache trạng thái đăng nhập nên khoá và đổi quyền vẫn có hiệu lực ở yêu cầu tiếp theo.
- Kiểm tra token bị thu hồi được gộp vào cùng truy vấn tài khoản/quyền bằng `LEFT JOIN`, giảm bước xác thực mỗi request từ hai lượt truy vấn database xuống một. Điều kiện thu hồi được kiểm tra ở từng request.
- Danh mục khoa, ngành, môn lấy sẵn các quan hệ cần hiển thị bằng fetch join.

Các con số trên là truy vấn của từng thao tác được kiểm thử trên H2, không phải toàn bộ truy vấn HTTP. Mỗi request xác thực còn có truy vấn kiểm tra token và quyền trước khi xử lý nghiệp vụ. Chưa đo thời gian phản hồi trên cơ sở dữ liệu Aiven thực tế.

Phương án tiếp theo nếu vẫn chậm:

1. Đo Network của `/admin/overview`, `/admin/users` và `/users/me`, đối chiếu thời gian SQL để tách độ trễ mạng/database khỏi xử lý ứng dụng. So sánh cùng bộ dữ liệu, cả lần đầu và các lần sau.
2. Nếu thời gian chủ yếu nằm ở kết nối Aiven: chạy database local khi phát triển hoặc đặt backend gần vùng của database khi triển khai. Không cần chuyển database trước khi có số đo.
3. Khi danh mục lớn: đưa tìm kiếm/phân trang khoa, ngành, môn về backend; tải danh sách chọn riêng theo nhu cầu. Hiện danh mục vẫn được tải toàn bộ và phân trang phía trình duyệt.
4. Nếu tổng quan được gọi nhiều: cân nhắc cache thống kê ngắn hạn với làm mới sau thao tác ghi. Không áp dụng cache này cho trạng thái khoá/quyền người dùng.

Đổi dòng “Đang tải…” thành skeleton chỉ cải thiện cảm nhận, không làm API nhanh hơn; ưu tiên đo và giảm thời gian xử lý trước.

### Đo trên backend đang chạy

Từ thư mục gốc EduShare, chạy:

```powershell
.\scripts\Measure-AdminApi.ps1
```

Script hỏi tài khoản/mật khẩu, đăng nhập một lần và đo ba lần mỗi API. Không in mật khẩu, token hoặc nội dung danh sách. Nếu backend dùng cổng khác, truyền `-BaseUrl`. Đăng nhập thất bại sẽ dừng script.

Để so sánh Aiven với MySQL local, cần có MySQL local và cùng bộ dữ liệu. Khởi động backend bằng cấu hình database local thông qua các biến `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` hiện có rồi chạy lại script. Lưu kết quả của từng môi trường và so sánh cả lần đầu lẫn những lần tiếp theo. Không dùng thời gian của API công khai hoặc request trả về 401 để kết luận tốc độ API admin.

Trong lần kiểm tra từ môi trường agent, API CSRF local trả 200 khoảng 119 ms nhưng tài khoản mẫu `admin/admin123` trả 401. Vì vậy chưa có số đo hợp lệ cho các API admin. Docker Desktop cũng chưa chạy, nên chưa so sánh được cùng dữ liệu trên MySQL local.
