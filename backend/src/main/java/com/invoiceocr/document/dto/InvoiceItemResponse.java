package com.invoiceocr.document.dto;

public record InvoiceItemResponse(
    String description,
    Double quantity,
    Double unitPrice,
    Double amount
) {}
