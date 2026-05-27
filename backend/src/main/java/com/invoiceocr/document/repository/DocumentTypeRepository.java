package com.invoiceocr.document.repository;

import com.invoiceocr.document.entity.DocumentTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DocumentTypeRepository extends JpaRepository<DocumentTypeEntity, Long> {
    Optional<DocumentTypeEntity> findByCode(String code);
}
