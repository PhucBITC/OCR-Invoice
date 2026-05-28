package com.invoiceocr.document.service;

import com.invoiceocr.document.dto.DocumentResponse;
import com.invoiceocr.document.dto.OcrResult;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentService {
    DocumentResponse uploadDocument(MultipartFile file, Long companyId, Long documentTypeId, String note, String username);
    Page<DocumentResponse> getAllDocuments(int page, int size, String status, Long companyId, Long documentTypeId, String search);
    DocumentResponse getDocumentById(Long id);
    Resource getDocumentFile(Long id);
    void triggerOcrAsync(Long documentId);
    OcrResult getOcrResult(Long documentId);
}
