package com.invoiceocr.document.repository;

import com.invoiceocr.document.entity.OcrItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OcrItemRepository extends JpaRepository<OcrItemEntity, Long> {
    List<OcrItemEntity> findByOcrResultId(Long ocrResultId);
}
