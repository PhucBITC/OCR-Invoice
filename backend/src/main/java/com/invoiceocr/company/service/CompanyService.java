package com.invoiceocr.company.service;

import com.invoiceocr.company.dto.CompanyRequest;
import com.invoiceocr.company.dto.CompanyResponse;
import java.util.List;

public interface CompanyService {
    List<CompanyResponse> getAllActiveCompanies();
    CompanyResponse getCompanyById(Long id);
    CompanyResponse createCompany(CompanyRequest request);
    CompanyResponse updateCompany(Long id, CompanyRequest request);
    void deleteCompany(Long id);
}
