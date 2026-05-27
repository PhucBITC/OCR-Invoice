# QUY TRINH TRIEN KHAI DU AN OCR HOA DON (React + Spring Boot + MySQL)

## 1. Muc tieu va pham vi
- Xay dung web app ho tro cong ty ke toan xu ly nhap lieu hoa don/chung tu theo quy trinh co kiem soat.
- Luong nghiep vu cot loi: `Dang nhap -> Upload -> OCR -> Review/Sua -> Verify/Reject -> Luu -> Thong ke/Audit -> Export`.
- Uu tien lam MVP chac chan truoc (Mock OCR), sau do moi nang cap OCR that.

### 1.1 Dau ra can co
- Source code day du tren GitHub (mono-repo).
- Video demo YouTube 5-8 phut.
- Tai lieu huong dan chay va mo ta giai phap (README + docs).

### 1.2 Nguyen tac trien khai
- Khong om qua nhieu nang cao som.
- Moi giai doan phai chay duoc.
- Kien truc mo de thay OCR provider ma khong anh huong module khac.
- Moi thao tac quan trong phai co audit log.

## 2. Vai tro va phan quyen
- `ADMIN`: quan ly user/role/company/document type, audit logs, dashboard.
- `STAFF`: upload chung tu, OCR, sua du lieu OCR, quan ly chung tu duoc cap quyen.
- `REVIEWER`: duyet (verify) hoac tu choi (reject) chung tu.
- `MANAGER`: xem dashboard, thong ke, nang suat.

## 3. Yeu cau nghiep vu cot loi
- Nguoi dung dang nhap bang Google SSO.
- Upload file `PDF/JPG/JPEG/PNG` (gioi han 20MB).
- Gan metadata: company, document type, note, ngay chung tu.
- OCR trich xuat text + field cau truc.
- Man hinh review cho phep sua truoc khi xac nhan.
- Luu ket qua hoa don sau verify.
- Co truy van lich su, thong ke va audit day du.

## 4. Kien truc tong the
- Frontend: React + Vite + Axios + React Router.
- Backend: Spring Boot REST + Spring Security + JWT + Google token verify + JPA.
- Database: MySQL 8.
- Storage: local uploads (MVP), co the doi sang MinIO/S3.
- OCR: qua `OcrProvider` interface (`Mock -> Tesseract -> Google Vision/OpenAI/Anthropic`).

## 5. Cau truc repo de xuat
```text
invoice-ocr-system/
|- backend/
|- frontend/
|- docs/
|- docker-compose.yml (tuy chon)
|- README.md
```

## 6. Quy uoc ky thuat bat buoc
- API response thong nhat:
  - Success: `{ success, message, data }`
  - Error: `{ success, message, errors }`
- Khong tra entity truc tiep, dung DTO.
- Co validation input va phan trang danh sach.
- Phan quyen ca backend (API) va frontend (route/UI).
- Khong commit secret/API key.
- Co seed data toi thieu: roles, document_types, admin demo (neu can).

## 7. Thiet ke du lieu (MVP -> mo rong)

### 7.1 Cac bang can co
- `roles`, `users`, `user_roles`
- `companies`, `company_users`
- `document_types`
- `documents`
- `ocr_results`, `ocr_fields`
- `invoice_headers`, `invoice_items`
- `audit_logs`, `login_logs`
- `file_processing_jobs`

### 7.2 Trang thai chung tu
- `UPLOADED`
- `OCR_PROCESSING`
- `OCR_DONE`
- `NEED_REVIEW`
- `VERIFIED`
- `REJECTED`
- `EXPORTED`

### 7.3 Field OCR quan trong
- `invoice_number`
- `invoice_date`
- `seller_name`
- `seller_tax_code`
- `buyer_name`
- `buyer_tax_code`
- `subtotal`
- `vat_amount`
- `total_amount`
- `payment_method`

## 8. Thiet ke API cot loi

### 8.1 Auth
- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### 8.2 Company
- `GET /api/companies`
- `POST /api/companies` (ADMIN)
- `PUT /api/companies/{id}` (ADMIN)
- `DELETE /api/companies/{id}` (ADMIN, xoa mem)

### 8.3 Document
- `GET /api/document-types`
- `POST /api/documents/upload`
- `GET /api/documents`
- `GET /api/documents/{id}`
- `GET /api/documents/{id}/file`

### 8.4 OCR + Review
- `POST /api/documents/{id}/ocr`
- `GET /api/documents/{id}/ocr-result`
- `PUT /api/documents/{id}/ocr-fields`
- `POST /api/documents/{id}/verify`
- `POST /api/documents/{id}/reject`

### 8.5 Admin + Dashboard
- `GET /api/admin/users`
- `PUT /api/admin/users/{id}/roles`
- `PUT /api/admin/users/{id}/status`
- `GET /api/admin/audit-logs`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/documents-by-status`
- `GET /api/dashboard/user-productivity`

## 9. Frontend pages bat buoc
- `LoginPage`
- `DashboardPage`
- `UploadDocumentPage`
- `DocumentListPage`
- `DocumentReviewPage`
- `CompaniesPage`
- `AdminUsersPage`
- `AuditLogsPage`

### 9.1 Component nen tach
- Layout: `Sidebar`, `Header`, `ProtectedLayout`, `RoleBasedMenu`
- Upload: `FileDropzone`, `UploadProgress`, `FilePreview`
- OCR: `OcrFieldForm`, `InvoiceItemsTable`, `ConfidenceBadge`, `DocumentViewer`
- Common: `DataTable`, `Pagination`, `SearchInput`, `StatusBadge`, `ConfirmDialog`, `Toast`
- Dashboard: `StatCard`, `DocumentsByStatusChart`, `ProductivityChart`

## 10. OCR strategy

### 10.1 Muc MVP
- Dung `MockOcrProvider` tra du lieu mau theo file/loai chung tu.
- Muc tieu: dam bao demo truan truot, khong phu thuoc API key.

### 10.2 Muc nang cao
- Tich hop `Tesseract` local hoac API ngoai.
- Van giu nguyen contract `OcrProvider`.

### 10.3 Quy tac review
- Khong tu dong tin OCR 100%.
- Field trong yeu phai duoc nguoi dung xac nhan.
- Field confidence thap can highlight.
- Luu `corrected_value` + audit khi user sua.

## 11. Lo trinh code theo giai doan (bat buoc theo thu tu)

## GD1 - Khoi tao nen tang
### Muc tieu
- Tao mono-repo backend/frontend/docs.
- Cau hinh MySQL, CORS, Swagger/OpenAPI.

### Viec can lam
- Tao Spring Boot skeleton: controller/service/repository/entity/dto/config/security.
- Tao React Vite skeleton + router + layout co ban.
- Cau hinh env backend/frontend.

### Dieu kien hoan thanh
- `backend` chay duoc (`mvn spring-boot:run`).
- `frontend` chay duoc (`npm run dev`).
- Ket noi DB thanh cong.

## GD2 - Auth Google SSO + JWT + Role
### Muc tieu
- Dang nhap Google, sinh JWT noi bo, phan quyen role.

### Viec can lam
- Frontend: Google login flow.
- Backend: verify Google token, tao/cap nhat user, phat JWT.
- Spring Security chan API theo role.
- API `/auth/me`, login log co ban.

### Dieu kien hoan thanh
- Dang nhap thanh cong, route private hoat dong.
- API role-protected tra dung 401/403.

## GD3 - Admin co ban (du lieu nen)
### Muc tieu
- Quan ly company, user, role, document type.

### Viec can lam
- CRUD company (xoa mem).
- Danh sach user + doi role + khoa/mo.
- Tao/seed document types.

### Dieu kien hoan thanh
- ADMIN thao tac CRUD duoc tren UI + API.

## GD4 - Upload + danh sach chung tu
### Muc tieu
- Staff upload file va xem danh sach/chi tiet.

### Viec can lam
- Validate MIME + size.
- Luu file vao storage + metadata vao `documents`.
- Xay dung list/detail/filter/pagination.
- API xem file goc.

### Dieu kien hoan thanh
- Upload PDF/JPG/PNG thanh cong.
- Danh sach hien thi dung theo bo loc.

## GD5 - OCR MVP (Mock)
### Muc tieu
- Tao luong OCR demo hoan chinh.

### Viec can lam
- Dinh nghia `OcrProvider` interface.
- Implement `MockOcrProvider`.
- Luu `ocr_results`, `ocr_fields`.
- Trang thai `OCR_PROCESSING -> OCR_DONE/NEED_REVIEW`.

### Dieu kien hoan thanh
- Nhan OCR cho 1 document va nhan duoc fields mau.

## GD6 - Review + Verify/Reject
### Muc tieu
- Hoan tat man hinh quan trong nhat: review OCR.

### Viec can lam
- UI xem file goc ben trai, field OCR ben phai.
- Cho phep sua field, luu corrected value.
- Verify tao/cap nhat `invoice_headers`, `invoice_items`.
- Reject de tra lai staff.
- Ghi audit logs cho sua/verify/reject.

### Dieu kien hoan thanh
- Luong `Upload -> OCR -> Review -> Verify/Reject` chay tron ven.

## GD7 - Dashboard + Audit hoan chinh
### Muc tieu
- Quan tri va thong ke cho ADMIN/MANAGER.

### Viec can lam
- Dashboard summary, chart theo status/user.
- Audit logs + login logs query co filter.

### Dieu kien hoan thanh
- ADMIN/MANAGER xem duoc so lieu co y nghia.

## GD8 - Nang cao ky thuat
### Muc tieu
- Tang chat luong san pham sau khi MVP on dinh.

### Viec can lam
- OCR that (Tesseract/Google Vision/OpenAI...).
- Retry job OCR.
- Export Excel/CSV.
- Tu chon: bbox highlight, queue async.

### Dieu kien hoan thanh
- Co it nhat 1 nang cap gia tri cao va demo duoc.

## GD9 - Dong goi nop bai
### Muc tieu
- Hoan tat san pham de nop/cham.

### Viec can lam
- Viet README day du.
- Chuan bi seed data, file demo.
- Ghi kich ban video va quay demo.

### Dieu kien hoan thanh
- Nguoi khac clone repo, doc README va chay duoc.

## 12. Checklist chat luong moi giai doan
- Chay backend khong loi.
- Chay frontend khong loi.
- API test pass cac case chinh.
- Co xu ly loi ro rang (validation/business).
- Co kiem tra phan quyen.
- Khong hardcode secret.
- Co cap nhat tai lieu (docs/README) sau moi moc lon.

## 13. Dinh nghia Done cho MVP
- Dang nhap Google + JWT + role hoat dong.
- CRUD company/document type/user co ban.
- Upload file + luu metadata + list/detail.
- OCR mock + man hinh review + sua + verify/reject.
- Luu invoice header/items sau verify.
- Audit logs co du thao tac quan trong.
- Dashboard tong quan toi thieu theo status.

## 14. Quy trinh lam viec voi AI coding agent (Codex)
- Luon code theo thu tu GD1 -> GD9.
- Moi turn uu tien xong tron 1 phan nho co the chay test ngay.
- Truoc khi chuyen giai doan, bat buoc:
  - Chay app va tu test luong lien quan.
  - Ghi lai da lam gi/chua lam gi trong docs.
- Neu phat sinh yeu cau moi, danh gia anh huong roi chen vao giai doan phu hop (khong pha vo luong MVP).

## 15. Ke hoach su dung file nay ve sau
- File `QuyTrinh.MD` la tai lieu chuan de bam sat khi code.
- Moi lan bat dau lam tiep, xac dinh dang o giai doan nao va checklist con thieu.
- Neu can thay doi pham vi, cap nhat ngay file nay truoc khi code tiep de tranh lech huong.
