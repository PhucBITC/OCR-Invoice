package com.invoiceocr.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank(message = "Họ và tên không được bỏ trống") String fullName
) {}
