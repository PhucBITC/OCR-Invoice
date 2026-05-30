package com.invoiceocr.auth;

import com.invoiceocr.auth.dto.*;
import com.invoiceocr.common.ApiResponse;
import com.invoiceocr.user.Role;
import com.invoiceocr.user.UserProfile;
import com.invoiceocr.user.entity.UserEntity;
import com.invoiceocr.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
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
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ApiResponse.ok("OK", new UserProfile(
                user.getEmail(),
                user.getFullName(),
                Role.valueOf(user.getRole().getCode().name()),
                user.getId(),
                user.getStatus()
        ));
    }

    @PostMapping("/logout")
    public ApiResponse<Map<String, String>> logout() {
        return ApiResponse.ok("Logout successful", Map.of("status", "ok"));
    }

    @PostMapping("/change-password")
    public ApiResponse<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Unauthorized");
        }
        String email = String.valueOf(authentication.getPrincipal());
        authService.changePassword(email, request.oldPassword(), request.newPassword());
        return ApiResponse.ok("Đổi mật khẩu thành công", null);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ApiResponse.ok("Mã OTP đã được gửi về email.", null);
    }

    @PostMapping("/verify-otp")
    public ApiResponse<String> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request.email(), request.otp());
        return ApiResponse.ok("Xác minh mã OTP thành công", null);
    }

    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.email(), request.otp(), request.newPassword());
        return ApiResponse.ok("Đặt lại mật khẩu thành công", null);
    }
}
