# Dự Án Web Frontend (Next.js)

Đây là ứng dụng web được xây dựng dựa trên framework [Next.js](https://nextjs.org), được khởi tạo bằng công cụ [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Dưới đây là hướng dẫn chi tiết để bạn cài đặt, chạy và phát triển dự án này.

## 1. Hướng dẫn Bắt đầu (Getting Started)

Trước tiên, hãy đảm bảo bạn đã cài đặt môi trường cần thiết (như Node.js). Sau đó, khởi chạy server phát triển (development server) bằng một trong các lệnh sau trong terminal:

```bash
npm run dev
# hoặc nếu dùng yarn
yarn dev
# hoặc nếu dùng pnpm
pnpm dev
# hoặc nếu dùng bun
bun dev
```

Sau khi chạy lệnh, màn hình console sẽ hiển thị địa chỉ localhost (thường là `http://localhost:3000`).

Hãy mở trình duyệt web và truy cập vào [http://localhost:3000](http://localhost:3000) để xem ứng dụng đang chạy.

## 2. Cấu trúc và Chỉnh sửa

- **Trang chủ**: Bạn có thể bắt đầu chỉnh sửa giao diện trang chủ bằng cách sửa đổi file `app/page.tsx`.
- **Tự động cập nhật**: Khi bạn lưu file, trình duyệt sẽ tự động cập nhật nội dung thay đổi mà không cần tải lại trang (tính năng Hot Reload).
- **Font chữ**: Dự án này sử dụng [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) để tối ưu hóa và tải bộ font [Geist](https://vercel.com/font) của Vercel.

## 3. Tài liệu Tham khảo (Learn More)

Để hiểu rõ hơn về cách hoạt động của Next.js, bạn có thể tham khảo các nguồn tài liệu chính thức sau:

- [Tài liệu Next.js (Next.js Documentation)](https://nextjs.org/docs): Nơi tra cứu đầy đủ về các tính năng và API của Next.js.
- [Học Next.js (Learn Next.js)](https://nextjs.org/learn): Khóa học tương tác giúp bạn nắm bắt Next.js từ cơ bản đến nâng cao.

Bạn cũng có thể xem mã nguồn và đóng góp ý kiến tại [GitHub repository của Next.js](https://github.com/vercel/next.js).

## 4. Triển khai Ứng dụng (Deploy)

Cách đơn giản và tối ưu nhất để đưa ứng dụng Next.js của bạn lên internet là sử dụng [Nền tảng Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) (được phát triển bởi chính đội ngũ tạo ra Next.js).

Xem thêm hướng dẫn chi tiết tại [Tài liệu triển khai Next.js](https://nextjs.org/docs/app/building-your-application/deploying).
