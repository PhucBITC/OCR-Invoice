package com.invoiceocr.document.ocr;

import com.invoiceocr.document.dto.OcrResult;

public interface OcrProvider {
    OcrResult performOcr(String filePath, String fileType);
}
