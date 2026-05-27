package com.invoiceocr.auth;

import com.invoiceocr.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public ApiResponse<Map<String, String>> me() {
        return ApiResponse.ok("OK", Map.of("email", "placeholder@local", "role", "ADMIN"));
    }
}
