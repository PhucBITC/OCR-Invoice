package com.invoiceocr.document.repository;

import com.invoiceocr.document.entity.OcrResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OcrResultRepository extends JpaRepository<OcrResultEntity, Long> {
    Optional<OcrResultEntity> findByDocumentId(Long documentId);
}
