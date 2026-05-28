package com.invoiceocr.document.service.impl;

import com.invoiceocr.company.entity.CompanyEntity;
import com.invoiceocr.company.repository.CompanyRepository;
import com.invoiceocr.document.dto.DocumentResponse;
import com.invoiceocr.document.entity.DocumentEntity;
import com.invoiceocr.document.entity.DocumentTypeEntity;
import com.invoiceocr.document.repository.DocumentRepository;
import com.invoiceocr.document.repository.DocumentTypeRepository;
import com.invoiceocr.document.service.DocumentService;
import com.invoiceocr.user.entity.UserEntity;
import com.invoiceocr.user.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.invoiceocr.document.dto.OcrItemDto;
import com.invoiceocr.document.dto.OcrResult;
import com.invoiceocr.document.entity.OcrItemEntity;
import com.invoiceocr.document.entity.OcrResultEntity;
import com.invoiceocr.document.ocr.OcrProvider;
import com.invoiceocr.document.repository.OcrItemRepository;
import com.invoiceocr.document.repository.OcrResultRepository;
import com.invoiceocr.document.dto.AuditLogResponse;
import com.invoiceocr.document.dto.InvoiceHeaderResponse;
import com.invoiceocr.document.dto.InvoiceItemResponse;
import com.invoiceocr.document.entity.InvoiceHeaderEntity;
import com.invoiceocr.document.entity.InvoiceItemEntity;
import com.invoiceocr.document.entity.AuditLogEntity;
import com.invoiceocr.document.repository.InvoiceHeaderRepository;
import com.invoiceocr.document.repository.InvoiceItemRepository;
import com.invoiceocr.document.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;

@Service
public class DocumentServiceImpl implements DocumentService {
    private final DocumentRepository documentRepository;
    private final CompanyRepository companyRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final UserRepository userRepository;
    private final OcrProvider ocrProvider;
    private final OcrResultRepository ocrResultRepository;
    private final OcrItemRepository ocrItemRepository;
    private final InvoiceHeaderRepository invoiceHeaderRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final AuditLogRepository auditLogRepository;

    @Autowired
    @Lazy
    private DocumentService self;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Path rootLocation;

    public DocumentServiceImpl(
            DocumentRepository documentRepository,
            CompanyRepository companyRepository,
            DocumentTypeRepository documentTypeRepository,
            UserRepository userRepository,
            OcrProvider ocrProvider,
            OcrResultRepository ocrResultRepository,
            OcrItemRepository ocrItemRepository,
            InvoiceHeaderRepository invoiceHeaderRepository,
            InvoiceItemRepository invoiceItemRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.documentRepository = documentRepository;
        this.companyRepository = companyRepository;
        this.documentTypeRepository = documentTypeRepository;
        this.userRepository = userRepository;
        this.ocrProvider = ocrProvider;
        this.ocrResultRepository = ocrResultRepository;
        this.ocrItemRepository = ocrItemRepository;
        this.invoiceHeaderRepository = invoiceHeaderRepository;
        this.invoiceItemRepository = invoiceItemRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir);
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    @Override
    public DocumentResponse uploadDocument(MultipartFile file, Long companyId, Long documentTypeId, String note, String username) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Tên tệp không hợp lệ");
        }

        // Validate size (20MB)
        if (file.getSize() > 20 * 1024 * 1024) {
            throw new IllegalArgumentException("Dung lượng tệp vượt quá giới hạn cho phép là 20MB");
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("application/pdf") &&
                                    !contentType.equals("image/jpeg") &&
                                    !contentType.equals("image/png"))) {
            throw new IllegalArgumentException("Hệ thống chỉ hỗ trợ tệp định dạng PDF, JPEG hoặc PNG");
        }

        // Generate unique name to prevent collision
        String uniqueFileName = System.currentTimeMillis() + "_" + originalFilename;
        Path destination = this.rootLocation.resolve(uniqueFileName);

        try {
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Lỗi lưu trữ tệp vật lý", e);
        }

        // Resolve Entities
        UserEntity user = userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng: " + username));

        CompanyEntity company = null;
        if (companyId != null) {
            company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy doanh nghiệp"));
        }

        DocumentTypeEntity docType = null;
        if (documentTypeId != null) {
            docType = documentTypeRepository.findById(documentTypeId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy loại tài liệu"));
        }

        // Save metadata
        DocumentEntity doc = new DocumentEntity();
        doc.setFileName(originalFilename);
        doc.setFilePath(uniqueFileName); // Store relative unique name for portability
        doc.setFileType(contentType);
        doc.setFileSize(file.getSize());
        doc.setStatus("UPLOADED");
        doc.setNote(note);
        doc.setCompany(company);
        doc.setDocumentType(docType);
        doc.setUploadedBy(user);

        documentRepository.save(doc);

        // Kích hoạt xử lý OCR bất đồng bộ
        self.triggerOcrAsync(doc.getId());

        return mapToResponse(doc);
    }

    @Override
    public Page<DocumentResponse> getAllDocuments(int page, int size, String status, Long companyId, Long documentTypeId, String search) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Specification<DocumentEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }
            if (documentTypeId != null) {
                predicates.add(cb.equal(root.get("documentType").get("id"), documentTypeId));
            }
            if (search != null && !search.isBlank()) {
                String likePattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("fileName")), likePattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return documentRepository.findAll(spec, pageRequest).map(this::mapToResponse);
    }

    @Override
    public DocumentResponse getDocumentById(Long id) {
        DocumentEntity doc = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chứng từ"));
        return mapToResponse(doc);
    }

    @Override
    public Resource getDocumentFile(Long id) {
        DocumentEntity doc = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chứng từ"));
        try {
            Path file = rootLocation.resolve(doc.getFilePath());
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Tệp tin không tồn tại hoặc không thể đọc");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Lỗi đường dẫn tệp tin: " + e.getMessage());
        }
    }

    private DocumentResponse mapToResponse(DocumentEntity doc) {
        return new DocumentResponse(
                doc.getId(),
                doc.getFileName(),
                doc.getFileType(),
                doc.getFileSize(),
                doc.getStatus(),
                doc.getNote(),
                doc.getCompany() != null ? doc.getCompany().getId() : null,
                doc.getCompany() != null ? doc.getCompany().getName() : null,
                doc.getDocumentType() != null ? doc.getDocumentType().getId() : null,
                doc.getDocumentType() != null ? doc.getDocumentType().getCode() : null,
                doc.getDocumentType() != null ? doc.getDocumentType().getName() : null,
                doc.getUploadedBy() != null ? doc.getUploadedBy().getId() : null,
                doc.getUploadedBy() != null ? doc.getUploadedBy().getEmail() : null,
                doc.getUploadedBy() != null ? doc.getUploadedBy().getFullName() : null,
                doc.getCreatedAt(),
                doc.getUpdatedAt()
        );
    }

    @Override
    @Async
    @Transactional
    public void triggerOcrAsync(Long documentId) {
        DocumentEntity doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            return;
        }

        // 1. Chuyển trạng thái tài liệu thành ĐANG QUÉT (OCR_PROCESSING)
        doc.setStatus("OCR_PROCESSING");
        documentRepository.save(doc);

        try {
            // 2. Giả lập thời gian quét của AI (3 giây)
            Thread.sleep(3000);

            // 3. Thực hiện quét tệp tin
            OcrResult ocrResult = ocrProvider.performOcr(doc.getFilePath(), doc.getFileType());

            // 4. Xóa kết quả OCR cũ nếu có (để tránh lỗi Unique constraint hoặc duplicate khi quét thủ công lại)
            OcrResultEntity existingResult = ocrResultRepository.findByDocumentId(documentId).orElse(null);
            if (existingResult != null) {
                List<OcrItemEntity> existingItems = ocrItemRepository.findByOcrResultId(existingResult.getId());
                ocrItemRepository.deleteAll(existingItems);
                ocrResultRepository.delete(existingResult);
                ocrResultRepository.flush();
            }

            // 5. Lưu kết quả quét vào bảng ocr_results
            OcrResultEntity ocrResultEntity = new OcrResultEntity();
            ocrResultEntity.setDocument(doc);
            ocrResultEntity.setInvoiceNumber(ocrResult.invoiceNumber());
            ocrResultEntity.setInvoiceDate(ocrResult.invoiceDate());
            ocrResultEntity.setSellerName(ocrResult.sellerName());
            ocrResultEntity.setSellerTaxCode(ocrResult.sellerTaxCode());
            ocrResultEntity.setBuyerName(ocrResult.buyerName());
            ocrResultEntity.setBuyerTaxCode(ocrResult.buyerTaxCode());
            ocrResultEntity.setSubtotal(ocrResult.subtotal());
            ocrResultEntity.setVatAmount(ocrResult.vatAmount());
            ocrResultEntity.setTotalAmount(ocrResult.totalAmount());
            ocrResultEntity.setPaymentMethod(ocrResult.paymentMethod());
            ocrResultEntity.setConfidence(ocrResult.confidence());
            ocrResultRepository.save(ocrResultEntity);

            // 6. Lưu danh sách chi tiết mặt hàng vào bảng ocr_items
            if (ocrResult.items() != null) {
                for (OcrItemDto itemDto : ocrResult.items()) {
                    OcrItemEntity itemEntity = new OcrItemEntity();
                    itemEntity.setOcrResult(ocrResultEntity);
                    itemEntity.setDescription(itemDto.description());
                    itemEntity.setQuantity(itemDto.quantity());
                    itemEntity.setUnitPrice(itemDto.unitPrice());
                    itemEntity.setAmount(itemDto.amount());
                    ocrItemRepository.save(itemEntity);
                }
            }

            // 7. Chuyển trạng thái sang CẦN DUYỆT (NEED_REVIEW)
            doc.setStatus("NEED_REVIEW");
            documentRepository.save(doc);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            doc.setStatus("ERROR");
            documentRepository.save(doc);
        } catch (Exception e) {
            doc.setStatus("ERROR");
            documentRepository.save(doc);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public OcrResult getOcrResult(Long documentId) {
        OcrResultEntity ocrResultEntity = ocrResultRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kết quả OCR cho tài liệu này"));

        List<OcrItemEntity> itemEntities = ocrItemRepository.findByOcrResultId(ocrResultEntity.getId());
        List<OcrItemDto> itemDtos = itemEntities.stream()
                .map(item -> new OcrItemDto(
                        item.getDescription(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getAmount()
                ))
                .toList();

        return new OcrResult(
                ocrResultEntity.getInvoiceNumber(),
                ocrResultEntity.getInvoiceDate(),
                ocrResultEntity.getSellerName(),
                ocrResultEntity.getSellerTaxCode(),
                ocrResultEntity.getBuyerName(),
                ocrResultEntity.getBuyerTaxCode(),
                ocrResultEntity.getSubtotal(),
                ocrResultEntity.getVatAmount(),
                ocrResultEntity.getTotalAmount(),
                ocrResultEntity.getPaymentMethod(),
                ocrResultEntity.getConfidence(),
                itemDtos
        );
    }

    @Override
    @Transactional
    public void saveOcrDraft(Long documentId, OcrResult draftData, String username) {
        DocumentEntity doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chứng từ"));

        UserEntity user = userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng: " + username));

        doc.setUpdatedAt(LocalDateTime.now());
        documentRepository.save(doc);

        OcrResultEntity ocrResult = ocrResultRepository.findByDocumentId(documentId).orElse(null);
        if (ocrResult == null) {
            ocrResult = new OcrResultEntity();
            ocrResult.setDocument(doc);
        }

        StringBuilder changes = new StringBuilder("Lưu bản nháp OCR: ");
        if (draftData.invoiceNumber() != null && !draftData.invoiceNumber().equals(ocrResult.getInvoiceNumber())) {
            changes.append("Số HĐ: '").append(ocrResult.getInvoiceNumber()).append("' -> '").append(draftData.invoiceNumber()).append("'; ");
        }
        if (draftData.totalAmount() != null && !draftData.totalAmount().equals(ocrResult.getTotalAmount())) {
            changes.append("Tổng tiền: '").append(ocrResult.getTotalAmount()).append("' -> '").append(draftData.totalAmount()).append("'; ");
        }

        ocrResult.setInvoiceNumber(draftData.invoiceNumber());
        ocrResult.setInvoiceDate(draftData.invoiceDate());
        ocrResult.setSellerName(draftData.sellerName());
        ocrResult.setSellerTaxCode(draftData.sellerTaxCode());
        ocrResult.setBuyerName(draftData.buyerName());
        ocrResult.setBuyerTaxCode(draftData.buyerTaxCode());
        ocrResult.setSubtotal(draftData.subtotal());
        ocrResult.setVatAmount(draftData.vatAmount());
        ocrResult.setTotalAmount(draftData.totalAmount());
        ocrResult.setPaymentMethod(draftData.paymentMethod());
        ocrResult.setConfidence(draftData.confidence());
        ocrResultRepository.save(ocrResult);

        List<OcrItemEntity> existingItems = ocrItemRepository.findByOcrResultId(ocrResult.getId());
        ocrItemRepository.deleteAll(existingItems);

        if (draftData.items() != null) {
            for (OcrItemDto itemDto : draftData.items()) {
                OcrItemEntity itemEntity = new OcrItemEntity();
                itemEntity.setOcrResult(ocrResult);
                itemEntity.setDescription(itemDto.description());
                itemEntity.setQuantity(itemDto.quantity());
                itemEntity.setUnitPrice(itemDto.unitPrice());
                itemEntity.setAmount(itemDto.amount());
                ocrItemRepository.save(itemEntity);
            }
        }

        AuditLogEntity log = new AuditLogEntity();
        log.setDocumentId(documentId);
        log.setAction("OCR_EDIT");
        log.setPerformedByEmail(user.getEmail());
        log.setPerformedByName(user.getFullName());
        log.setDetails(changes.toString());
        auditLogRepository.save(log);
    }

    @Override
    @Transactional
    public void verifyDocument(Long documentId, OcrResult finalData, String username) {
        DocumentEntity doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chứng từ"));

        UserEntity user = userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng: " + username));

        doc.setStatus("VERIFIED");
        doc.setUpdatedAt(LocalDateTime.now());
        documentRepository.save(doc);

        OcrResultEntity ocrResult = ocrResultRepository.findByDocumentId(documentId).orElse(null);
        if (ocrResult == null) {
            ocrResult = new OcrResultEntity();
            ocrResult.setDocument(doc);
        }
        ocrResult.setInvoiceNumber(finalData.invoiceNumber());
        ocrResult.setInvoiceDate(finalData.invoiceDate());
        ocrResult.setSellerName(finalData.sellerName());
        ocrResult.setSellerTaxCode(finalData.sellerTaxCode());
        ocrResult.setBuyerName(finalData.buyerName());
        ocrResult.setBuyerTaxCode(finalData.buyerTaxCode());
        ocrResult.setSubtotal(finalData.subtotal());
        ocrResult.setVatAmount(finalData.vatAmount());
        ocrResult.setTotalAmount(finalData.totalAmount());
        ocrResult.setPaymentMethod(finalData.paymentMethod());
        ocrResult.setConfidence(finalData.confidence());
        ocrResultRepository.save(ocrResult);

        List<OcrItemEntity> existingOcrItems = ocrItemRepository.findByOcrResultId(ocrResult.getId());
        ocrItemRepository.deleteAll(existingOcrItems);

        if (finalData.items() != null) {
            for (OcrItemDto itemDto : finalData.items()) {
                OcrItemEntity itemEntity = new OcrItemEntity();
                itemEntity.setOcrResult(ocrResult);
                itemEntity.setDescription(itemDto.description());
                itemEntity.setQuantity(itemDto.quantity());
                itemEntity.setUnitPrice(itemDto.unitPrice());
                itemEntity.setAmount(itemDto.amount());
                ocrItemRepository.save(itemEntity);
            }
        }

        InvoiceHeaderEntity invoiceHeader = invoiceHeaderRepository.findByDocumentId(documentId).orElse(null);
        if (invoiceHeader != null) {
            List<InvoiceItemEntity> existingInvoiceItems = invoiceItemRepository.findByInvoiceHeaderId(invoiceHeader.getId());
            invoiceItemRepository.deleteAll(existingInvoiceItems);
            invoiceHeaderRepository.delete(invoiceHeader);
            invoiceHeaderRepository.flush();
        }

        InvoiceHeaderEntity newHeader = new InvoiceHeaderEntity();
        newHeader.setDocument(doc);
        newHeader.setInvoiceNumber(finalData.invoiceNumber());
        newHeader.setInvoiceDate(finalData.invoiceDate());
        newHeader.setSellerName(finalData.sellerName());
        newHeader.setSellerTaxCode(finalData.sellerTaxCode());
        newHeader.setBuyerName(finalData.buyerName());
        newHeader.setBuyerTaxCode(finalData.buyerTaxCode());
        newHeader.setSubtotal(finalData.subtotal());
        newHeader.setVatAmount(finalData.vatAmount());
        newHeader.setTotalAmount(finalData.totalAmount());
        newHeader.setPaymentMethod(finalData.paymentMethod());
        newHeader.setVerifiedBy(user);
        invoiceHeaderRepository.save(newHeader);

        if (finalData.items() != null) {
            for (OcrItemDto itemDto : finalData.items()) {
                InvoiceItemEntity itemEntity = new InvoiceItemEntity();
                itemEntity.setInvoiceHeader(newHeader);
                itemEntity.setDescription(itemDto.description());
                itemEntity.setQuantity(itemDto.quantity());
                itemEntity.setUnitPrice(itemDto.unitPrice());
                itemEntity.setAmount(itemDto.amount());
                invoiceItemRepository.save(itemEntity);
            }
        }

        AuditLogEntity log = new AuditLogEntity();
        log.setDocumentId(documentId);
        log.setAction("VERIFIED");
        log.setPerformedByEmail(user.getEmail());
        log.setPerformedByName(user.getFullName());
        log.setDetails("Phê duyệt chứng từ thành công. Số HĐ: " + finalData.invoiceNumber() + ", Tổng tiền: " + finalData.totalAmount());
        auditLogRepository.save(log);
    }

    @Override
    @Transactional
    public void rejectDocument(Long documentId, String reason, String username) {
        DocumentEntity doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chứng từ"));

        UserEntity user = userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng: " + username));

        doc.setStatus("REJECTED");
        doc.setNote(reason);
        doc.setUpdatedAt(LocalDateTime.now());
        documentRepository.save(doc);

        AuditLogEntity log = new AuditLogEntity();
        log.setDocumentId(documentId);
        log.setAction("REJECTED");
        log.setPerformedByEmail(user.getEmail());
        log.setPerformedByName(user.getFullName());
        log.setDetails("Từ chối chứng từ. Lý do: " + (reason != null && !reason.isBlank() ? reason : "Không có lý do"));
        auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLogs(Long documentId) {
        List<AuditLogEntity> logs = auditLogRepository.findByDocumentIdOrderByPerformedAtDesc(documentId);
        return logs.stream()
                .map(l -> new AuditLogResponse(
                        l.getId(),
                        l.getDocumentId(),
                        l.getAction(),
                        l.getPerformedByEmail(),
                        l.getPerformedByName(),
                        l.getPerformedAt(),
                        l.getDetails()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceHeaderResponse> getVerifiedInvoices(int page, int size, String invoiceNumber, String startDate, String endDate, Double minAmount, Double maxAmount) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("verifiedAt").descending());

        Specification<InvoiceHeaderEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (invoiceNumber != null && !invoiceNumber.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("invoiceNumber")), "%" + invoiceNumber.trim().toLowerCase() + "%"));
            }

            if (startDate != null && !startDate.isBlank()) {
                try {
                    java.time.LocalDate startLocalDate = java.time.LocalDate.parse(startDate.trim());
                    predicates.add(cb.greaterThanOrEqualTo(root.get("verifiedAt"), startLocalDate.atStartOfDay()));
                } catch (Exception e) {
                    // Ignore parsing exceptions
                }
            }

            if (endDate != null && !endDate.isBlank()) {
                try {
                    java.time.LocalDate endLocalDate = java.time.LocalDate.parse(endDate.trim());
                    predicates.add(cb.lessThanOrEqualTo(root.get("verifiedAt"), endLocalDate.atTime(23, 59, 59, 999999999)));
                } catch (Exception e) {
                    // Ignore parsing exceptions
                }
            }

            if (minAmount != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("totalAmount"), minAmount));
            }

            if (maxAmount != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("totalAmount"), maxAmount));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return invoiceHeaderRepository.findAll(spec, pageRequest).map(h -> new InvoiceHeaderResponse(
                h.getId(),
                h.getDocument().getId(),
                h.getInvoiceNumber(),
                h.getInvoiceDate(),
                h.getSellerName(),
                h.getSellerTaxCode(),
                h.getBuyerName(),
                h.getBuyerTaxCode(),
                h.getSubtotal(),
                h.getVatAmount(),
                h.getTotalAmount(),
                h.getPaymentMethod(),
                h.getVerifiedBy() != null ? h.getVerifiedBy().getId() : null,
                h.getVerifiedBy() != null ? h.getVerifiedBy().getEmail() : null,
                h.getVerifiedBy() != null ? h.getVerifiedBy().getFullName() : null,
                h.getVerifiedAt()
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getSystemAuditLogs(int page, int size, String action, String performedByEmail, String startDate, String endDate) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("performedAt").descending());

        Specification<AuditLogEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }

            if (performedByEmail != null && !performedByEmail.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("performedByEmail")), "%" + performedByEmail.trim().toLowerCase() + "%"));
            }

            if (startDate != null && !startDate.isBlank()) {
                try {
                    java.time.LocalDate startLocalDate = java.time.LocalDate.parse(startDate.trim());
                    predicates.add(cb.greaterThanOrEqualTo(root.get("performedAt"), startLocalDate.atStartOfDay()));
                } catch (Exception e) {
                    // Ignore parsing exceptions
                }
            }

            if (endDate != null && !endDate.isBlank()) {
                try {
                    java.time.LocalDate endLocalDate = java.time.LocalDate.parse(endDate.trim());
                    predicates.add(cb.lessThanOrEqualTo(root.get("performedAt"), endLocalDate.atTime(23, 59, 59, 999999999)));
                } catch (Exception e) {
                    // Ignore parsing exceptions
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return auditLogRepository.findAll(spec, pageRequest).map(l -> new AuditLogResponse(
                l.getId(),
                l.getDocumentId(),
                l.getAction(),
                l.getPerformedByEmail(),
                l.getPerformedByName(),
                l.getPerformedAt(),
                l.getDetails()
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceItemResponse> getVerifiedInvoiceItems(Long invoiceHeaderId) {
        List<InvoiceItemEntity> items = invoiceItemRepository.findByInvoiceHeaderId(invoiceHeaderId);
        return items.stream()
                .map(item -> new InvoiceItemResponse(
                        item.getDescription(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getAmount()
                ))
                .toList();
    }
}
