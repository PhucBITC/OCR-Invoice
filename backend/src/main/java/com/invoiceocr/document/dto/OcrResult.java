package com.invoiceocr.document.dto;

import java.util.List;

public record OcrResult(
    String invoiceNumber,
    String invoiceDate,
    String sellerName,
    String sellerTaxCode,
    String buyerName,
    String buyerTaxCode,
    Double subtotal,
    Double vatAmount,
    Double totalAmount,
    String paymentMethod,
    Double confidence,
    List<OcrItemDto> items
) {}
