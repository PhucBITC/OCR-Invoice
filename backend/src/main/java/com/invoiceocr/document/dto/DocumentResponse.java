package com.invoiceocr.document.dto;

import java.time.LocalDateTime;

public record DocumentResponse(
    Long id,
    String fileName,
    String fileType,
    Long fileSize,
    String status,
    String note,
    Long companyId,
    String companyName,
    Long documentTypeId,
    String documentTypeCode,
    String documentTypeName,
    Long uploadedById,
    String uploadedByEmail,
    String uploadedByFullName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
