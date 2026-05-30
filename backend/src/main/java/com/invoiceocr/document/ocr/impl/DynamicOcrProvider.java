package com.invoiceocr.document.ocr.impl;

import com.invoiceocr.document.dto.OcrResult;
import com.invoiceocr.document.ocr.OcrProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class DynamicOcrProvider implements OcrProvider {

    private final String providerName;
    private final OpenAiOcrProvider openAiOcrProvider;
    private final GeminiOcrProvider geminiOcrProvider;
    private final GroqOcrProvider groqOcrProvider;
    private final MockOcrProvider mockOcrProvider;

    public DynamicOcrProvider(
            @Value("${app.ocr.provider}") String providerName,
            OpenAiOcrProvider openAiOcrProvider,
            GeminiOcrProvider geminiOcrProvider,
            GroqOcrProvider groqOcrProvider,
            MockOcrProvider mockOcrProvider) {
        this.providerName = providerName;
        this.openAiOcrProvider = openAiOcrProvider;
        this.geminiOcrProvider = geminiOcrProvider;
        this.groqOcrProvider = groqOcrProvider;
        this.mockOcrProvider = mockOcrProvider;
    }

    @Override
    public OcrResult performOcr(String filePath, String fileType) {
        if ("gemini".equalsIgnoreCase(providerName)) {
            return geminiOcrProvider.performOcr(filePath, fileType);
        } else if ("groq".equalsIgnoreCase(providerName)) {
            return groqOcrProvider.performOcr(filePath, fileType);
        } else if ("openai".equalsIgnoreCase(providerName)) {
            return openAiOcrProvider.performOcr(filePath, fileType);
        } else {
            return mockOcrProvider.performOcr(filePath, fileType);
        }
    }
}
