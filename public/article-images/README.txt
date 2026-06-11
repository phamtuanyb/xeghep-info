KHO ẢNH BÀI VIẾT — TÁCH RIÊNG THEO TỪNG WEBSITE
================================================

Mỗi website (tenant) có thư mục ảnh RIÊNG:
    public/article-images/<tenantId>/

KHÔNG bỏ ảnh thẳng vào thư mục gốc này. Thay vào đó, admin của từng website
TẢI ẢNH LÊN ngay trong trang quản trị:

    Admin -> Tin tức -> "Kho ảnh bài viết (riêng website này)" -> Tải ảnh lên kho

Hệ thống tự tạo thư mục theo tenantId và lưu ảnh (đã tối ưu sang .webp) vào đó.

Khi đăng/import bài, hệ thống tự lấy NGẪU NHIÊN từ ĐÚNG kho của website đó:
  - 1 ảnh bìa
  - 1 ảnh chèn trong nội dung (nếu bài chưa có ảnh)

-> Ảnh của web này KHÔNG lẫn sang web khác.

Lưu ý deploy VPS: giữ thư mục public/article-images/ trên máy chủ (đọc lúc chạy).
