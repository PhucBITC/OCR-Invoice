package com.invoiceocr.document.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ocr_results")
public class OcrResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false, unique = true)
    private DocumentEntity document;

    @Column(name = "invoice_number", length = 50)
    private String invoiceNumber;

    @Column(name = "invoice_date", length = 50)
    private String invoiceDate;

    @Column(name = "seller_name", length = 255)
    private String sellerName;

    @Column(name = "seller_tax_code", length = 50)
    private String sellerTaxCode;

    @Column(name = "buyer_name", length = 255)
    private String buyerName;

    @Column(name = "buyer_tax_code", length = 50)
    private String buyerTaxCode;

    @Column(name = "subtotal")
    private Double subtotal;

    @Column(name = "vat_amount")
    private Double vatAmount;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DocumentEntity getDocument() { return document; }
    public void setDocument(DocumentEntity document) { this.document = document; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(String invoiceDate) { this.invoiceDate = invoiceDate; }

    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }

    public String getSellerTaxCode() { return sellerTaxCode; }
    public void setSellerTaxCode(String sellerTaxCode) { this.sellerTaxCode = sellerTaxCode; }

    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }

    public String getBuyerTaxCode() { return buyerTaxCode; }
    public void setBuyerTaxCode(String buyerTaxCode) { this.buyerTaxCode = buyerTaxCode; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getVatAmount() { return vatAmount; }
    public void setVatAmount(Double vatAmount) { this.vatAmount = vatAmount; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
