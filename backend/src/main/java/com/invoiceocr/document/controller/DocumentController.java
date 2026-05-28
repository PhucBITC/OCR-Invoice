package com.invoiceocr.document.controller;

import com.invoiceocr.common.ApiResponse;
import com.invoiceocr.document.dto.DocumentResponse;
import com.invoiceocr.document.service.DocumentService;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/upload")
    public ApiResponse<DocumentResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "documentTypeId", required = false) Long documentTypeId,
            @RequestParam(value = "note", required = false) String note
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Unauthorized");
        }
        String email = String.valueOf(authentication.getPrincipal());
        DocumentResponse response = documentService.uploadDocument(file, companyId, documentTypeId, note, email);
        return ApiResponse.ok("File uploaded successfully", response);
    }

    @GetMapping
    public ApiResponse<Page<DocumentResponse>> getAll(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "documentTypeId", required = false) Long documentTypeId,
            @RequestParam(value = "search", required = false) String search
    ) {
        Page<DocumentResponse> response = documentService.getAllDocuments(page, size, status, companyId, documentTypeId, search);
        return ApiResponse.ok("Success", response);
    }

    @GetMapping("/{id}")
    public ApiResponse<DocumentResponse> getById(@PathVariable Long id) {
        DocumentResponse response = documentService.getDocumentById(id);
        return ApiResponse.ok("Success", response);
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> getFile(@PathVariable Long id) {
        Resource file = documentService.getDocumentFile(id);
        DocumentResponse doc = documentService.getDocumentById(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, doc.fileType())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.fileName() + "\"")
                .body(file);
    }
}
