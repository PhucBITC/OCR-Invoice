package com.invoiceocr.auth;

import com.invoiceocr.auth.dto.*;
import com.invoiceocr.common.ApiResponse;
import com.invoiceocr.user.Role;
import com.invoiceocr.user.UserProfile;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Register successful", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LocalLoginRequest request) {
        return ApiResponse.ok("Login successful", authService.loginLocal(request));
    }

    @PostMapping("/google")
    public ApiResponse<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ApiResponse.ok("Login successful", authService.loginWithGoogle(request));
    }

    @GetMapping("/me")
    public ApiResponse<UserProfile> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Unauthorized");
        }
        String email = String.valueOf(authentication.getPrincipal());
        String role = authentication.getAuthorities().stream().findFirst().map(a -> a.getAuthority().replace("ROLE_", "")).orElse("STAFF");
        return ApiResponse.ok("OK", new UserProfile(email, "Authenticated User", Role.valueOf(role)));
    }

    @PostMapping("/logout")
    public ApiResponse<Map<String, String>> logout() {
        return ApiResponse.ok("Logout successful", Map.of("status", "ok"));
    }
}
