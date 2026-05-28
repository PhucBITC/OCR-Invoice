package com.invoiceocr.document.controller;

import com.invoiceocr.common.ApiResponse;
import com.invoiceocr.company.repository.CompanyRepository;
import com.invoiceocr.document.entity.DocumentEntity;
import com.invoiceocr.document.entity.InvoiceHeaderEntity;
import com.invoiceocr.document.entity.OcrResultEntity;
import com.invoiceocr.document.entity.AuditLogEntity;
import com.invoiceocr.document.repository.DocumentRepository;
import com.invoiceocr.document.repository.InvoiceHeaderRepository;
import com.invoiceocr.document.repository.OcrResultRepository;
import com.invoiceocr.document.repository.AuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DocumentRepository documentRepository;
    private final CompanyRepository companyRepository;
    private final OcrResultRepository ocrResultRepository;
    private final InvoiceHeaderRepository invoiceHeaderRepository;
    private final AuditLogRepository auditLogRepository;

    public DashboardController(
            DocumentRepository documentRepository,
            CompanyRepository companyRepository,
            OcrResultRepository ocrResultRepository,
            InvoiceHeaderRepository invoiceHeaderRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.documentRepository = documentRepository;
        this.companyRepository = companyRepository;
        this.ocrResultRepository = ocrResultRepository;
        this.invoiceHeaderRepository = invoiceHeaderRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. KPI counters
        long totalDocuments = documentRepository.count();
        stats.put("totalDocuments", totalDocuments);

        // Count pending statuses
        long pendingDocuments = 0;
        List<DocumentEntity> allDocs = documentRepository.findAll();
        for (DocumentEntity d : allDocs) {
            String s = d.getStatus();
            if ("UPLOADED".equals(s) || "OCR_PROCESSING".equals(s) || "NEED_REVIEW".equals(s)) {
                pendingDocuments++;
            }
        }
        stats.put("pendingDocuments", pendingDocuments);

        long totalCompanies = companyRepository.count();
        stats.put("totalCompanies", totalCompanies);

        // Average accuracy from OCR results
        List<OcrResultEntity> ocrResults = ocrResultRepository.findAll();
        double avgConfidence = 0.95;
        if (!ocrResults.isEmpty()) {
            double sum = ocrResults.stream()
                    .mapToDouble(r -> r.getConfidence() != null ? r.getConfidence() : 0.95)
                    .sum();
            avgConfidence = sum / ocrResults.size();
        }
        stats.put("averageAccuracy", avgConfidence);

        // 2. Recent documents
        List<DocumentEntity> recentDocs = documentRepository.findAll(
                PageRequest.of(0, 5, Sort.by("createdAt").descending())
        ).getContent();
        
        List<Map<String, Object>> recentDocsList = new ArrayList<>();
        for (DocumentEntity d : recentDocs) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", d.getId());
            m.put("fileName", d.getFileName());
            m.put("status", d.getStatus());
            m.put("fileSize", d.getFileSize());
            m.put("createdAt", d.getCreatedAt());
            m.put("companyName", d.getCompany() != null ? d.getCompany().getName() : "-");
            m.put("uploadedByFullName", d.getUploadedBy() != null ? d.getUploadedBy().getFullName() : "-");
            
            // Set invoice fields if verified
            Optional<InvoiceHeaderEntity> header = invoiceHeaderRepository.findByDocumentId(d.getId());
            if (header.isPresent()) {
                m.put("totalAmount", header.get().getTotalAmount());
                m.put("invoiceNumber", header.get().getInvoiceNumber());
            } else {
                Optional<OcrResultEntity> ocr = ocrResultRepository.findByDocumentId(d.getId());
                if (ocr.isPresent()) {
                    m.put("totalAmount", ocr.get().getTotalAmount());
                    m.put("invoiceNumber", ocr.get().getInvoiceNumber());
                } else {
                    m.put("totalAmount", 0.0);
                    m.put("invoiceNumber", "-");
                }
            }
            recentDocsList.add(m);
        }
        stats.put("recentDocuments", recentDocsList);

        // 3. Recent audit logs
        List<AuditLogEntity> recentLogs = auditLogRepository.findAll(
                PageRequest.of(0, 5, Sort.by("performedAt").descending())
        ).getContent();
        
        List<Map<String, Object>> recentLogsList = new ArrayList<>();
        for (AuditLogEntity l : recentLogs) {
            Map<String, Object> lm = new HashMap<>();
            lm.put("id", l.getId());
            lm.put("action", l.getAction());
            lm.put("performedByEmail", l.getPerformedByEmail());
            lm.put("performedByName", l.getPerformedByName());
            lm.put("performedAt", l.getPerformedAt());
            lm.put("details", l.getDetails());
            recentLogsList.add(lm);
        }
        stats.put("recentActivities", recentLogsList);

        return ApiResponse.ok("Success", stats);
    }

    @GetMapping("/charts")
    public ApiResponse<Map<String, Object>> getCharts() {
        Map<String, Object> charts = new HashMap<>();

        // 1. Monthly revenue data for current year
        int currentYear = LocalDate.now().getYear();
        List<InvoiceHeaderEntity> verifiedHeaders = invoiceHeaderRepository.findAll();
        double[] monthlyAmounts = new double[12];
        for (InvoiceHeaderEntity header : verifiedHeaders) {
            if (header.getVerifiedAt() != null && header.getVerifiedAt().getYear() == currentYear) {
                int month = header.getVerifiedAt().getMonthValue();
                monthlyAmounts[month - 1] += header.getTotalAmount() != null ? header.getTotalAmount() : 0.0;
            }
        }
        
        List<Map<String, Object>> revenueList = new ArrayList<>();
        String[] monthNames = {"T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"};
        for (int i = 0; i < 12; i++) {
            Map<String, Object> m = new HashMap<>();
            m.put("label", monthNames[i]);
            m.put("value", monthlyAmounts[i]);
            revenueList.add(m);
        }
        charts.put("revenueData", revenueList);

        // 2. Document count by status
        List<DocumentEntity> allDocs = documentRepository.findAll();
        Map<String, Long> statusCounts = new HashMap<>();
        // Set default 0 for major statuses
        statusCounts.put("UPLOADED", 0L);
        statusCounts.put("OCR_PROCESSING", 0L);
        statusCounts.put("NEED_REVIEW", 0L);
        statusCounts.put("VERIFIED", 0L);
        statusCounts.put("REJECTED", 0L);
        statusCounts.put("ERROR", 0L);

        for (DocumentEntity d : allDocs) {
            String s = d.getStatus();
            statusCounts.put(s, statusCounts.getOrDefault(s, 0L) + 1);
        }
        
        List<Map<String, Object>> statusList = new ArrayList<>();
        for (Map.Entry<String, Long> entry : statusCounts.entrySet()) {
            Map<String, Object> m = new HashMap<>();
            m.put("status", entry.getKey());
            m.put("count", entry.getValue());
            statusList.add(m);
        }
        charts.put("statusData", statusList);

        return ApiResponse.ok("Success", charts);
    }
}
