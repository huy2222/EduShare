# Khu vực quản trị EduShare

## Phân quyền & vai trò

Mục `/admin/access` dành cho ADMIN, gồm danh sách vai trò dạng thẻ có tìm kiếm/phân trang, tạo/sửa vai trò, kích hoạt/ngừng hoạt động, xoá vai trò chưa sử dụng và tab phân quyền người dùng. Mã vai trò cố định sau khi tạo; tên hiển thị và mô tả có thể chỉnh sửa. `ADMIN` và `USER` là vai trò hệ thống được bảo vệ. `USER` tiếp tục là vai trò mặc định của tài khoản đăng ký mới.

Cấu hình quyền được lưu nguyên bộ trong một giao dịch. Có tìm tên/mã, lọc nhóm, chọn/bỏ theo nhóm và đặt lại thay đổi chưa lưu. Danh mục chỉ gồm quyền đã nối với backend: xem tổng quan, xem người dùng, khoá/mở tài khoản, gán vai trò, xem/quản lý khoa-ngành-môn và kiểm duyệt tài liệu. Quyền báo cáo vi phạm chưa triển khai nên chưa có ô chọn.

Vai trò ngừng hoạt động vẫn được giữ trên tài khoản nhưng không còn cấp role/permission cho yêu cầu tiếp theo; không cần đăng nhập lại. Giao diện sau khi tải lại nhận danh sách quyền hiện tại từ `/users/me` và hiển thị các mục quản trị được phép. Chỉ ADMIN được tạo/cấu hình vai trò và thay đổi tài khoản ADMIN. Người có quyền gán vai trò không tự động có quyền khoá tài khoản. ADMIN không thể tự thay đổi quyền hoặc khoá chính mình trong màn hình người dùng.

Khởi động lại backend để tạo danh mục quyền và bổ sung các cột `displayName`, `active` qua cơ chế `ddl-auto: update` hiện có. Cột active mặc định true cho vai trò cũ. Vai trò MODERATOR có sẵn được gán quyền kiểm duyệt nếu quyền APPROVE_DOCUMENT được tạo lần đầu; các lần khởi động sau không khôi phục quyền đã gỡ. Nếu APPROVE_DOCUMENT đã tồn tại từ trước, ADMIN tự cấu hình quyền cho MODERATOR theo nhu cầu. API kiểm duyệt dùng quyền này hoặc ADMIN, không dùng tên MODERATOR để bỏ qua cấu hình quyền.

Thao tác lưu/xoá vai trò, cấu hình quyền và gán vai trò người dùng ghi log backend với actor và ID đối tượng. Hiện chưa có màn hình xem nhật ký phân quyền riêng.

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

Backend giữ cấu trúc feature/controller/service/repository, trả về `ApiResponse`, dùng xác thực cookie và CSRF hiện có. API `/api/v1/admin/access/**` chỉ cho phép ADMIN. Các API quản trị còn lại kiểm tra ADMIN hoặc quyền chức năng tương ứng ở service. Mỗi yêu cầu xác thực đọc lại trạng thái và quyền hiện tại để việc khoá tài khoản hoặc thay đổi quyền áp dụng cho cả token đã cấp.

## Bản xem trước Word khi kiểm duyệt

DOC và DOCX sau khi quét ClamAV sạch được lưu bình thường ở `documents/` rồi được worker nền chuyển thành PDF bằng LibreOffice. Bản PDF nằm riêng trong `previews/`, không public, và chỉ endpoint admin `GET /api/v1/admin/documents/{id}/preview` mới trả nội dung để hiển thị trong màn hình kiểm duyệt.

Trạng thái preview là `PENDING`, `CONVERTING`, `AVAILABLE` hoặc `FAILED`; PDF gốc dùng trực tiếp nên có trạng thái `NOT_REQUIRED`. Backend gửi Word qua HTTP đến Gotenberg, nơi LibreOffice chạy trong Docker; mặc định endpoint là `http://localhost:3000`, hoặc cấu hình biến môi trường `GOTENBERG_URL`. Có thể điều chỉnh thời gian tối đa và chu kỳ worker qua `DOCUMENT_PREVIEW_TIMEOUT_SECONDS` và `DOCUMENT_PREVIEW_POLL_DELAY_MILLISECONDS`.

Quan hệ `subjects.faculty_id` được bổ sung qua Hibernate `ddl-auto: update` đang dùng trong dự án. Môn cũ chưa có quan hệ trực tiếp này hiển thị Chưa phân khoa trong danh sách. Form sửa gợi ý khoa từ ngành đã liên kết; lưu môn sẽ ghi khoa được chọn. Quan hệ ngành–môn cũ được giữ nguyên cho đến khi chỉnh sửa.

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
- Danh mục khoa, ngành, môn truy vấn DTO projection, phân trang/tìm kiếm/lọc ngay tại database. Mặc định 10 dòng, giới hạn tối đa 50 dòng/trang; chỉ lấy cột hiển thị, không fetch toàn bộ entity và quan hệ.
- Danh sách người dùng dùng projection cho hồ sơ và một truy vấn vai trò của đúng các ID trong trang. API chỉ trả các trường trong UserResponse.
- Các API danh sách trả ApiResponse với result gồm items, page, size, totalElements. Frontend chuyển trang bằng request mới, không cắt toàn bộ dữ liệu trong bộ nhớ.
- Chi tiết lấy qua GET /admin/{type}/{id} khi bấm Sửa. Danh sách chọn dùng cùng endpoint danh mục với options=true, có tìm kiếm và phân trang riêng; chỉ tải khi mở form/bộ lọc. Các ngành đã chọn được giữ lại khi chuyển trang/tìm kiếm lựa chọn.
- Tổng quan cache trong bộ nhớ từng tiến trình trong 30 giây; các thao tác ghi admin xoá cache sau commit thành công. Rollback không xoá cache. Các thay đổi từ luồng khác (ví dụ đăng ký) có thể hiển thị trễ tối đa 30 giây. Không cache quyền/trạng thái khoá.

Các con số trên là truy vấn của từng thao tác được kiểm thử trên H2, không phải toàn bộ truy vấn HTTP. Mỗi request xác thực còn có truy vấn kiểm tra token và quyền trước khi xử lý nghiệp vụ. Chưa đo thời gian phản hồi trên cơ sở dữ liệu Aiven thực tế.

Phương án tiếp theo nếu vẫn chậm:

1. Đo Network của `/admin/overview`, `/admin/users` và `/users/me`, đối chiếu thời gian SQL để tách độ trễ mạng/database khỏi xử lý ứng dụng. So sánh cùng bộ dữ liệu, cả lần đầu và các lần sau.
2. Nếu thời gian chủ yếu nằm ở kết nối Aiven: chạy database local khi phát triển hoặc đặt backend gần vùng của database khi triển khai. Không cần chuyển database trước khi có số đo.
3. Nếu dữ liệu tiếp tục tăng, đo execution plan của truy vấn COUNT và tìm kiếm trước khi bổ sung index hoặc đổi chiến lược phân trang. Các API danh mục đã phân trang tại backend và tổng quan đã có cache 30 giây.

Đổi dòng “Đang tải…” thành skeleton chỉ cải thiện cảm nhận, không làm API nhanh hơn; ưu tiên đo và giảm thời gian xử lý trước.

### Đo trên backend đang chạy

Từ thư mục gốc EduShare, chạy:

```powershell
.\scripts\Measure-AdminApi.ps1
```

Script hỏi tài khoản/mật khẩu, đăng nhập một lần và đo ba lần mỗi API. Không in mật khẩu, token hoặc nội dung danh sách. Nếu backend dùng cổng khác, truyền `-BaseUrl`. Đăng nhập thất bại sẽ dừng script.

Để so sánh Aiven với MySQL local, cần có MySQL local và cùng bộ dữ liệu. Khởi động backend bằng cấu hình database local thông qua các biến `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` hiện có rồi chạy lại script. Lưu kết quả của từng môi trường và so sánh cả lần đầu lẫn những lần tiếp theo. Không dùng thời gian của API công khai hoặc request trả về 401 để kết luận tốc độ API admin.

Trong lần kiểm tra từ môi trường agent, API CSRF local trả 200 khoảng 119 ms nhưng tài khoản mẫu `admin/admin123` trả 401. Vì vậy chưa có số đo hợp lệ cho các API admin. Docker Desktop cũng chưa chạy, nên chưa so sánh được cùng dữ liệu trên MySQL local.

Kiểm thử AdminCatalogQueryTest xác nhận 23 môn liên kết ngành khác khoa chỉ trả 10 dòng/trang, dùng 2 truy vấn và không tải entity vào persistence context; kiểm tra cả bộ lọc, quyền truy cập, cache hết hạn, làm mới sau commit và rollback. Đây là kiểm thử trên H2, chưa phải số đo độ trễ Aiven thực tế.
