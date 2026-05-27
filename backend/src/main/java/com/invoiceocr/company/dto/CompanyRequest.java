package com.invoiceocr.company.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyRequest(
    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 150, message = "Company name must be between 2 and 150 characters")
    String name,

    @NotBlank(message = "Tax code is required")
    @Size(min = 5, max = 20, message = "Tax code must be between 5 and 20 characters")
    String taxCode,

    @Size(max = 255, message = "Address cannot exceed 255 characters")
    String address,

    String status
) {}
