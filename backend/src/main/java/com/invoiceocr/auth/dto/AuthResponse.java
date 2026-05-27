package com.invoiceocr.auth.dto;

public record AuthResponse(String accessToken, String tokenType, long expiresInSeconds) {
}
