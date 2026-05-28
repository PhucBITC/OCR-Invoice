package com.invoiceocr.document.dto;

public record OcrItemDto(
    String description,
    Double quantity,
    Double unitPrice,
    Double amount
) {}
