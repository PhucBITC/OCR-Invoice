package com.invoiceocr.company.repository;

import com.invoiceocr.company.entity.CompanyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<CompanyEntity, Long> {
    List<CompanyEntity> findAllByDeletedAtIsNull();
    Optional<CompanyEntity> findByIdAndDeletedAtIsNull(Long id);
    Optional<CompanyEntity> findByTaxCodeAndDeletedAtIsNull(String taxCode);
}
