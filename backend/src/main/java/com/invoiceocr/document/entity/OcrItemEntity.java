package com.invoiceocr.document.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ocr_items")
public class OcrItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ocr_result_id", nullable = false)
    private OcrResultEntity ocrResult;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "quantity")
    private Double quantity;

    @Column(name = "unit_price")
    private Double unitPrice;

    @Column(name = "amount")
    private Double amount;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public OcrResultEntity getOcrResult() { return ocrResult; }
    public void setOcrResult(OcrResultEntity ocrResult) { this.ocrResult = ocrResult; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
}
