package com.invoiceocr.company.dto;

import java.time.LocalDateTime;

public record CompanyResponse(
    Long id,
    String name,
    String taxCode,
    String address,
    String status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
