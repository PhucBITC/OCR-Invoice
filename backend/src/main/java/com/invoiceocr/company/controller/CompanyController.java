package com.invoiceocr.company.controller;

import com.invoiceocr.common.ApiResponse;
import com.invoiceocr.company.dto.CompanyRequest;
import com.invoiceocr.company.dto.CompanyResponse;
import com.invoiceocr.company.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {
    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping
    public ApiResponse<List<CompanyResponse>> getAll() {
        return ApiResponse.ok("Success", companyService.getAllActiveCompanies());
    }

    @GetMapping("/{id}")
    public ApiResponse<CompanyResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok("Success", companyService.getCompanyById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CompanyResponse> create(@Valid @RequestBody CompanyRequest request) {
        return ApiResponse.ok("Company created successfully", companyService.createCompany(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CompanyResponse> update(@PathVariable Long id, @Valid @RequestBody CompanyRequest request) {
        return ApiResponse.ok("Company updated successfully", companyService.updateCompany(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        companyService.deleteCompany(id);
        return ApiResponse.ok("Company deleted successfully", null);
    }
}
