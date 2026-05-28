package com.invoiceocr.document.repository;

import com.invoiceocr.document.entity.InvoiceHeaderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface InvoiceHeaderRepository extends JpaRepository<InvoiceHeaderEntity, Long> {
    Optional<InvoiceHeaderEntity> findByDocumentId(Long documentId);
}
