package com.invoiceocr.company.service.impl;

import com.invoiceocr.company.dto.CompanyRequest;
import com.invoiceocr.company.dto.CompanyResponse;
import com.invoiceocr.company.entity.CompanyEntity;
import com.invoiceocr.company.repository.CompanyRepository;
import com.invoiceocr.company.service.CompanyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class CompanyServiceImpl implements CompanyService {
    private final CompanyRepository companyRepository;

    public CompanyServiceImpl(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompanyResponse> getAllActiveCompanies() {
        return companyRepository.findAllByDeletedAtIsNull().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyResponse getCompanyById(Long id) {
        CompanyEntity entity = companyRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Company not found or deleted"));
        return mapToResponse(entity);
    }

    @Override
    public CompanyResponse createCompany(CompanyRequest request) {
        if (companyRepository.findByTaxCodeAndDeletedAtIsNull(request.taxCode()).isPresent()) {
            throw new IllegalArgumentException("Tax code already exists");
        }

        CompanyEntity entity = new CompanyEntity();
        entity.setName(request.name().trim());
        entity.setTaxCode(request.taxCode().trim());
        entity.setAddress(request.address() != null ? request.address().trim() : null);
        if (request.status() != null && !request.status().isBlank()) {
            entity.setStatus(request.status().trim());
        }

        CompanyEntity saved = companyRepository.save(entity);
        return mapToResponse(saved);
    }

    @Override
    public CompanyResponse updateCompany(Long id, CompanyRequest request) {
        CompanyEntity entity = companyRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Company not found or deleted"));

        companyRepository.findByTaxCodeAndDeletedAtIsNull(request.taxCode())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Tax code already exists for another company");
                });

        entity.setName(request.name().trim());
        entity.setTaxCode(request.taxCode().trim());
        entity.setAddress(request.address() != null ? request.address().trim() : null);
        if (request.status() != null && !request.status().isBlank()) {
            entity.setStatus(request.status().trim());
        }

        CompanyEntity saved = companyRepository.save(entity);
        return mapToResponse(saved);
    }

    @Override
    public void deleteCompany(Long id) {
        CompanyEntity entity = companyRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Company not found or deleted"));
        entity.setDeletedAt(LocalDateTime.now());
        companyRepository.save(entity);
    }

    private CompanyResponse mapToResponse(CompanyEntity entity) {
        return new CompanyResponse(
                entity.getId(),
                entity.getName(),
                entity.getTaxCode(),
                entity.getAddress(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
