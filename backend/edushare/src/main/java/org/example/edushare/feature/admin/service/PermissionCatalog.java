package org.example.edushare.feature.admin.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class PermissionCatalog {
    private PermissionCatalog() {}
    public record Item(String code, String name, String group, String description, boolean available) {}
    public static final List<Item> ITEMS = List.of(
        new Item("OVERVIEW_VIEW", "Xem tổng quan", "Tổng quan", "Xem thống kê hệ thống", true),
        new Item("USER_VIEW", "Xem người dùng", "Người dùng", "Tìm kiếm và xem danh sách tài khoản", true),
        new Item("USER_BAN", "Khoá / mở tài khoản", "Người dùng", "Thay đổi trạng thái tài khoản đã xác thực", true),
        new Item("USER_ROLE_ASSIGN", "Gán vai trò", "Người dùng", "Gán nhiều vai trò cho tài khoản khác; tài khoản ADMIN chỉ do ADMIN quản lý", true),
        new Item("PROFILE_VIEW_OWN", "Xem hồ sơ cá nhân", "Hồ sơ cá nhân", "Xem hồ sơ của chính mình", true),
        new Item("PROFILE_UPDATE_OWN", "Sửa hồ sơ cá nhân", "Hồ sơ cá nhân", "Cập nhật thông tin của chính mình", true),
        new Item("FACULTY_VIEW", "Xem khoa", "Khoa", "Xem dữ liệu khoa trong khu vực quản trị", true),
        new Item("FACULTY_CREATE", "Thêm khoa", "Khoa", "Thêm dữ liệu khoa trong khu vực quản trị", true),
        new Item("FACULTY_UPDATE", "Sửa khoa", "Khoa", "Sửa dữ liệu khoa trong khu vực quản trị", true),
        new Item("FACULTY_DELETE", "Xoá khoa", "Khoa", "Xoá dữ liệu khoa trong khu vực quản trị", true),
        new Item("MAJOR_VIEW", "Xem ngành", "Ngành", "Xem dữ liệu ngành trong khu vực quản trị", true),
        new Item("MAJOR_CREATE", "Thêm ngành", "Ngành", "Thêm dữ liệu ngành trong khu vực quản trị", true),
        new Item("MAJOR_UPDATE", "Sửa ngành", "Ngành", "Sửa dữ liệu ngành trong khu vực quản trị", true),
        new Item("MAJOR_DELETE", "Xoá ngành", "Ngành", "Xoá dữ liệu ngành trong khu vực quản trị", true),
        new Item("SUBJECT_VIEW", "Xem môn học", "Môn học", "Xem dữ liệu môn học trong khu vực quản trị", true),
        new Item("SUBJECT_CREATE", "Thêm môn học", "Môn học", "Thêm dữ liệu môn học trong khu vực quản trị", true),
        new Item("SUBJECT_UPDATE", "Sửa môn học", "Môn học", "Sửa dữ liệu môn học trong khu vực quản trị", true),
        new Item("SUBJECT_DELETE", "Xoá môn học", "Môn học", "Xoá dữ liệu môn học trong khu vực quản trị", true),
        new Item("DOCUMENT_VIEW", "Xem tài liệu", "Tài liệu", "Xem danh sách và chi tiết tài liệu được phép truy cập", true),
        new Item("DOCUMENT_UPLOAD", "Tải tài liệu lên", "Tài liệu", "Đăng tài liệu mới vào hệ thống", true),
        new Item("DOCUMENT_DELETE_OWN", "Xoá tài liệu của mình", "Tài liệu", "Xoá tài liệu do chính mình tải lên", true),
        new Item("DOCUMENT_DELETE_ANY", "Xoá tài liệu bất kỳ", "Tài liệu", "Xoá tài liệu của người dùng khác", true),
        new Item("DOCUMENT_APPROVE", "Phê duyệt tài liệu", "Tài liệu", "Chuyển tài liệu sang trạng thái được duyệt", true),
        new Item("DOCUMENT_REJECT", "Từ chối tài liệu", "Tài liệu", "Từ chối tài liệu kèm lý do", true),
        new Item("DOCUMENT_HIDE", "Ẩn tài liệu", "Tài liệu", "Ẩn tài liệu kèm lý do", true),
        new Item("ACCESS_ROLE_VIEW", "Xem vai trò", "Vai trò và phân quyền", "Xem danh sách vai trò và các quyền đã cấp", true),
        new Item("ACCESS_ROLE_CREATE", "Tạo vai trò", "Vai trò và phân quyền", "Tạo vai trò mới chưa có quyền", true),
        new Item("ACCESS_ROLE_UPDATE", "Sửa vai trò", "Vai trò và phân quyền", "Sửa tên, mô tả và kích hoạt/ngừng hoạt động", true),
        new Item("ACCESS_ROLE_DELETE", "Xoá vai trò", "Vai trò và phân quyền", "Xoá vai trò chưa được sử dụng", true),
        new Item("PERMISSION_MANAGE", "Cấu hình quyền vai trò", "Vai trò và phân quyền", "Cấp hoặc gỡ quyền cho vai trò; không sửa quyền ADMIN", true),
        new Item("CATALOG_VIEW", "Xem toàn bộ danh mục", "Quyền gộp tương thích", "Bao gồm quyền xem khoa, ngành và môn", true),
        new Item("CATALOG_MANAGE", "Quản lý toàn bộ danh mục", "Quyền gộp tương thích", "Bao gồm thêm, sửa, xoá khoa, ngành và môn", true),
        new Item("APPROVE_DOCUMENT", "Toàn bộ thao tác kiểm duyệt", "Quyền gộp tương thích", "Bao gồm phê duyệt, từ chối và ẩn tài liệu", true),
        new Item("USER_UPDATE", "Cập nhật hồ sơ người dùng khác", "Chưa triển khai", "Chưa có API sửa hồ sơ của người dùng khác", false),
        new Item("DOCUMENT_EDIT_OWN", "Sửa tài liệu của mình", "Chưa triển khai", "Chưa có chức năng sửa nội dung tài liệu", false),
        new Item("DOCUMENT_DOWNLOAD", "Tải tài liệu xuống", "Chưa triển khai", "Chưa có API tải file tài liệu xuống", false),
        new Item("REPORT_VIEW", "Xem báo cáo vi phạm", "Báo cáo vi phạm", "Chưa có phân hệ báo cáo vi phạm", false),
        new Item("REPORT_REVIEW", "Thẩm định báo cáo", "Báo cáo vi phạm", "Chưa có phân hệ báo cáo vi phạm", false),
        new Item("REPORT_RESOLVE", "Xử lý báo cáo", "Báo cáo vi phạm", "Chưa có phân hệ báo cáo vi phạm", false)
    );
    public static Set<String> availableCodes() {
        return ITEMS.stream().filter(Item::available).map(Item::code).collect(Collectors.toSet());
    }
}
