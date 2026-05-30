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
import org.springframework.context.annotation.Primary;
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
public class OpenAiOcrProvider implements OcrProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiOcrProvider.class);
    
    private final String apiKey;
    private final String model;
    private final MockOcrProvider mockOcrProvider;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public OpenAiOcrProvider(
            @Value("${app.openai.key}") String apiKey,
            @Value("${app.openai.model}") String model,
            MockOcrProvider mockOcrProvider,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.mockOcrProvider = mockOcrProvider;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public OcrResult performOcr(String filePath, String fileType) {
        // 1. Kiểm tra cấu hình OpenAI API key, nếu rỗng thì fallback sang Mock OCR
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.startsWith("${")) {
            log.warn("=== [OpenAI OCR] Key API chưa được cấu hình. Chuyển sang cơ chế FALLBACK (Mock OCR) ===");
            return mockOcrProvider.performOcr(filePath, fileType);
        }

        log.info("=== [OpenAI OCR] Bắt đầu quét hóa đơn thật sử dụng mô hình OpenAI {} ===", model);
        try {
            byte[] imageBytes;
            // 2. Nếu file là PDF, dùng PDFBox render trang đầu tiên thành ảnh JPEG
            if (fileType.toLowerCase().contains("pdf") || filePath.toLowerCase().endsWith(".pdf")) {
                log.info("[OpenAI OCR] Phát hiện định dạng PDF. Đang render trang đầu tiên thành ảnh...");
                try (PDDocument document = Loader.loadPDF(new File(filePath))) {
                    if (document.getNumberOfPages() > 0) {
                        PDFRenderer pdfRenderer = new PDFRenderer(document);
                        BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 150);
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        ImageIO.write(bim, "jpg", baos);
                        imageBytes = baos.toByteArray();
                        log.info("[OpenAI OCR] Render PDF sang ảnh thành công (dung lượng: {} bytes)", imageBytes.length);
                    } else {
                        throw new IllegalArgumentException("File PDF không có trang nào.");
                    }
                }
            } else {
                // Đọc file ảnh trực tiếp
                imageBytes = Files.readAllBytes(Paths.get(filePath));
            }

            // 3. Mã hóa ảnh sang Base64
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            // 4. Xây dựng Payload gọi API OpenAI
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            
            Map<String, String> responseFormat = new HashMap<>();
            responseFormat.put("type", "json_object");
            requestBody.put("response_format", responseFormat);
            
            List<Map<String, Object>> messages = new ArrayList<>();
            
            // System instruction
            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "You are an expert accountant AI. Perform OCR on the provided invoice image. Extract all matching details in Vietnamese and output a JSON object matching this schema exactly: {\"invoiceNumber\": \"string\", \"invoiceDate\": \"YYYY-MM-DD\", \"sellerName\": \"string\", \"sellerTaxCode\": \"string\", \"buyerName\": \"string\", \"buyerTaxCode\": \"string\", \"subtotal\": number, \"vatAmount\": number, \"totalAmount\": number, \"paymentMethod\": \"string\", \"confidence\": number, \"items\": [{\"description\": \"string\", \"quantity\": number, \"unitPrice\": number, \"amount\": number}]}. If fields like tax codes are not found, leave them null. If confidence cannot be calculated, set it to 0.95.");
            messages.add(systemMessage);
            
            // User query
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            
            List<Map<String, Object>> userContent = new ArrayList<>();
            
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("type", "text");
            textPart.put("text", "Trích xuất thông tin hóa đơn này.");
            userContent.add(textPart);
            
            Map<String, Object> imagePart = new HashMap<>();
            imagePart.put("type", "image_url");
            Map<String, String> imageUrl = new HashMap<>();
            imageUrl.put("url", "data:image/jpeg;base64," + base64Image);
            imagePart.put("image_url", imageUrl);
            userContent.add(imagePart);
            
            userMessage.put("content", userContent);
            messages.add(userMessage);
            
            requestBody.put("messages", messages);

            // 5. Gửi POST Request đến OpenAI API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            String jsonPayload = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);
            
            log.info("[OpenAI OCR] Đang gửi yêu cầu quét AI lên OpenAI...");
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.openai.com/v1/chat/completions",
                    entity,
                    String.class
            );

            // 6. Phân tích kết quả JSON trả về
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String contentJson = rootNode.path("choices").get(0).path("message").path("content").asText();
            
            log.info("[OpenAI OCR] Nhận kết quả từ OpenAI. Đang phân tích kết quả...");
            OcrResult result = objectMapper.readValue(contentJson, OcrResult.class);
            log.info("[OpenAI OCR] Phân tích hoàn tất. Số hóa đơn trích xuất: {}", result.invoiceNumber());
            
            return result;

        } catch (Exception e) {
            log.error("=== [OpenAI OCR] Có lỗi xảy ra trong quá trình gọi OpenAI ===", e);
            throw new RuntimeException("Lỗi gọi OpenAI API: " + e.getMessage(), e);
        }
    }
}
