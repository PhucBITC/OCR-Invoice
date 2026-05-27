package com.invoiceocr.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LocalLoginRequest(
        @Email @NotBlank String email,
        @NotBlank String password
) {
}
