package com.invoiceocr.document.ocr.impl;

import com.invoiceocr.document.dto.OcrItemDto;
import com.invoiceocr.document.dto.OcrResult;
import com.invoiceocr.document.ocr.OcrProvider;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class MockOcrProvider implements OcrProvider {

    private final Random random = new Random();

    @Override
    public OcrResult performOcr(String filePath, String fileType) {
        // Generate mock invoice numbers and dates
        String invoiceNumber = "INV-" + LocalDate.now().getYear() + "-" + String.format("%06d", random.nextInt(1000000));
        String invoiceDate = LocalDate.now().minusDays(random.nextInt(10)).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        
        // Setup sellers based on filename/random
        String sellerName = "CÔNG TY TNHH GIẢI PHÁP CÔNG NGHỆ VÀ TRUYỀN THÔNG VINA";
        String sellerTaxCode = "0109283746";
        String buyerName = "CÔNG TY CỔ PHẦN ĐẦU TƯ VÀ PHÁT TRIỂN CÔNG NGHỆ PHÚC AN";
        String buyerTaxCode = "0316492837";
        
        // Mock items
        List<OcrItemDto> items = new ArrayList<>();
        double subtotal = 0.0;
        
        // Create 2-4 random items
        int numItems = 2 + random.nextInt(3);
        String[] descriptions = {
            "Máy in đa năng HP LaserJet Pro M404dn",
            "Mực máy in HP LaserJet 76A Black",
            "Gói dịch vụ bảo trì hệ thống mạng nội bộ Q2/2026",
            "Ổ cứng SSD Samsung 980 PRO 1TB PCIe NVMe",
            "Ram Laptop DDR4 Kingston 16GB Bus 3200",
            "Bộ phát Wifi TP-Link Archer AX73 Wi-Fi 6"
        };
        
        double[] prices = { 5490000.0, 2150000.0, 4500000.0, 2350000.0, 950000.0, 1890000.0 };
        
        // To make it look realistic, we pick unique items
        List<Integer> pickedIndices = new ArrayList<>();
        while (pickedIndices.size() < numItems) {
            int idx = random.nextInt(descriptions.length);
            if (!pickedIndices.contains(idx)) {
                pickedIndices.add(idx);
            }
        }
        
        for (int idx : pickedIndices) {
            double quantity = 1.0 + random.nextInt(5);
            double unitPrice = prices[idx];
            double amount = quantity * unitPrice;
            subtotal += amount;
            
            items.add(new OcrItemDto(
                descriptions[idx],
                quantity,
                unitPrice,
                amount
            ));
        }
        
        // Calculate tax and total
        double vatRate = 0.10; // 10% VAT
        double vatAmount = Math.round(subtotal * vatRate * 100.0) / 100.0;
        double totalAmount = subtotal + vatAmount;
        
        String paymentMethod = random.nextBoolean() ? "Chuyển khoản" : "Tiền mặt";
        double confidence = 0.85 + (random.nextDouble() * 0.14); // confidence between 0.85 and 0.99
        confidence = Math.round(confidence * 100.0) / 100.0;
        
        return new OcrResult(
            invoiceNumber,
            invoiceDate,
            sellerName,
            sellerTaxCode,
            buyerName,
            buyerTaxCode,
            subtotal,
            vatAmount,
            totalAmount,
            paymentMethod,
            confidence,
            items
        );
    }
}
