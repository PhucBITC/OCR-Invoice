package com.invoiceocr.document.dto;

import java.time.LocalDateTime;

public record AuditLogResponse(
    Long id,
    Long documentId,
    String action,
    String performedByEmail,
    String performedByName,
    LocalDateTime performedAt,
    String details
) {}
