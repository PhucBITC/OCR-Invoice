package com.invoiceocr.document.service;

import com.invoiceocr.document.dto.DocumentResponse;
import com.invoiceocr.document.dto.OcrResult;
import com.invoiceocr.document.dto.AuditLogResponse;
import com.invoiceocr.document.dto.InvoiceHeaderResponse;
import com.invoiceocr.document.dto.InvoiceItemResponse;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface DocumentService {
    DocumentResponse uploadDocument(MultipartFile file, Long companyId, Long documentTypeId, String note, String username);
    Page<DocumentResponse> getAllDocuments(int page, int size, String status, Long companyId, Long documentTypeId, String search);
    DocumentResponse getDocumentById(Long id);
    Resource getDocumentFile(Long id);
    void triggerOcrAsync(Long documentId);
    OcrResult getOcrResult(Long documentId);
    void saveOcrDraft(Long documentId, OcrResult draftData, String username);
    void verifyDocument(Long documentId, OcrResult finalData, String username);
    void rejectDocument(Long documentId, String reason, String username);
    List<AuditLogResponse> getAuditLogs(Long documentId);
    Page<InvoiceHeaderResponse> getVerifiedInvoices(int page, int size, String invoiceNumber, String startDate, String endDate, Double minAmount, Double maxAmount);
    Page<AuditLogResponse> getSystemAuditLogs(int page, int size, String action, String performedByEmail, String startDate, String endDate);
    List<InvoiceItemResponse> getVerifiedInvoiceItems(Long invoiceHeaderId);
}
