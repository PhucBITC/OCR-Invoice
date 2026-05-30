package com.invoiceocr.document.ocr.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.invoiceocr.document.dto.OcrResult;
import com.invoiceocr.document.ocr.OcrProvider;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

@Component
public class GeminiOcrProvider implements OcrProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiOcrProvider.class);

    private final String apiKey;
    private final String model;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public GeminiOcrProvider(
            @Value("${app.gemini.key}") String apiKey,
            @Value("${app.gemini.model:gemini-1.5-flash}") String model,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public OcrResult performOcr(String filePath, String fileType) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.startsWith("${")) {
            throw new IllegalArgumentException("Google Gemini API Key chưa được cấu hình.");
        }

        log.info("=== [Gemini OCR] Bắt đầu quét hóa đơn thật sử dụng mô hình Gemini {} ===", model);
        try {
            byte[] imageBytes;
            // PDF conversion
            if (fileType.toLowerCase().contains("pdf") || filePath.toLowerCase().endsWith(".pdf")) {
                log.info("[Gemini OCR] Phát hiện định dạng PDF. Đang render trang đầu tiên thành ảnh...");
                try (PDDocument document = Loader.loadPDF(new File(filePath))) {
                    if (document.getNumberOfPages() > 0) {
                        PDFRenderer pdfRenderer = new PDFRenderer(document);
                        BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 150);
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        ImageIO.write(bim, "jpg", baos);
                        imageBytes = baos.toByteArray();
                        log.info("[Gemini OCR] Render PDF sang ảnh thành công (dung lượng: {} bytes)", imageBytes.length);
                    } else {
                        throw new IllegalArgumentException("File PDF không có trang nào.");
                    }
                }
            } else {
                imageBytes = Files.readAllBytes(Paths.get(filePath));
            }

            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            // Construct payload for Gemini API
            Map<String, Object> payload = new HashMap<>();
            
            // Contents list
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> contentObj = new HashMap<>();
            
            List<Map<String, Object>> parts = new ArrayList<>();
            
            // Text part
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", "Perform OCR on the provided invoice image. Extract all matching details in Vietnamese and output a JSON object matching this schema exactly: {\"invoiceNumber\": \"string\", \"invoiceDate\": \"YYYY-MM-DD\", \"sellerName\": \"string\", \"sellerTaxCode\": \"string\", \"buyerName\": \"string\", \"buyerTaxCode\": \"string\", \"subtotal\": number, \"vatAmount\": number, \"totalAmount\": number, \"paymentMethod\": \"string\", \"confidence\": number, \"items\": [{\"description\": \"string\", \"quantity\": number, \"unitPrice\": number, \"amount\": number}]}. If fields like tax codes are not found, leave them null. If confidence cannot be calculated, set it to 0.95.");
            parts.add(textPart);
            
            // InlineData part
            Map<String, Object> imagePart = new HashMap<>();
            Map<String, String> inlineData = new HashMap<>();
            inlineData.put("mimeType", "image/jpeg");
            inlineData.put("data", base64Image);
            imagePart.put("inlineData", inlineData);
            parts.add(imagePart);
            
            contentObj.put("parts", parts);
            contents.add(contentObj);
            payload.put("contents", contents);

            // generationConfig
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("responseMimeType", "application/json");
            payload.put("generationConfig", generationConfig);

            // Send request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            String jsonPayload = objectMapper.writeValueAsString(payload);
            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);
            
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
            
            log.info("[Gemini OCR] Đang gửi yêu cầu quét AI lên Google Gemini API...");
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            // Parse response
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String textResponse = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            log.info("[Gemini OCR] Nhận kết quả từ Google Gemini. Đang phân tích kết quả...");
            OcrResult result = objectMapper.readValue(textResponse, OcrResult.class);
            log.info("[Gemini OCR] Phân tích hoàn tất. Số hóa đơn trích xuất: {}", result.invoiceNumber());
            
            return result;

        } catch (Exception e) {
            log.error("=== [Gemini OCR] Có lỗi xảy ra trong quá trình gọi Google Gemini API ===", e);
            throw new RuntimeException("Lỗi gọi Gemini API: " + e.getMessage(), e);
        }
    }
}
