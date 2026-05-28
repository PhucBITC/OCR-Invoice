package com.invoiceocr.document.dto;

import java.time.LocalDateTime;

public record InvoiceHeaderResponse(
    Long id,
    Long documentId,
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
    Long verifiedById,
    String verifiedByEmail,
    String verifiedByFullName,
    LocalDateTime verifiedAt
) {}
