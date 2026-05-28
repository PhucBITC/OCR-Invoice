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

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Path rootLocation;

    public DocumentServiceImpl(
            DocumentRepository documentRepository,
            CompanyRepository companyRepository,
            DocumentTypeRepository documentTypeRepository,
            UserRepository userRepository
    ) {
        this.documentRepository = documentRepository;
        this.companyRepository = companyRepository;
        this.documentTypeRepository = documentTypeRepository;
        this.userRepository = userRepository;
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
}
