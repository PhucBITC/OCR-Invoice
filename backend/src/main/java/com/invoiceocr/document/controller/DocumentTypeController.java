package com.invoiceocr.document.controller;

import com.invoiceocr.common.ApiResponse;
import com.invoiceocr.document.entity.DocumentTypeEntity;
import com.invoiceocr.document.repository.DocumentTypeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/document-types")
public class DocumentTypeController {
    private final DocumentTypeRepository documentTypeRepository;

    public DocumentTypeController(DocumentTypeRepository documentTypeRepository) {
        this.documentTypeRepository = documentTypeRepository;
    }

    @GetMapping
    public ApiResponse<List<DocumentTypeEntity>> getAll() {
        return ApiResponse.ok("Success", documentTypeRepository.findAll());
    }
}
