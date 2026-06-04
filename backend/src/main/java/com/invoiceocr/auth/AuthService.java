package com.invoiceocr.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.invoiceocr.auth.dto.AuthResponse;
import com.invoiceocr.auth.dto.GoogleLoginRequest;
import com.invoiceocr.auth.dto.LocalLoginRequest;
import com.invoiceocr.auth.dto.RegisterRequest;
import com.invoiceocr.auth.entity.LoginLogEntity;
import com.invoiceocr.auth.repository.LoginLogRepository;
import com.invoiceocr.security.JwtService;
import com.invoiceocr.user.entity.RoleCode;
import com.invoiceocr.user.entity.RoleEntity;
import com.invoiceocr.user.entity.UserEntity;
import com.invoiceocr.user.repository.RoleRepository;
import com.invoiceocr.user.repository.UserRepository;
import com.invoiceocr.user.UserProfile;
import com.invoiceocr.user.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Collections;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@Service
public class AuthService {
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final LoginLogRepository loginLogRepository;
    private final String devGoogleToken;
    private final GoogleIdTokenVerifier googleVerifier;
    private final JavaMailSender mailSender;

    public AuthService(
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            UserRepository userRepository,
            RoleRepository roleRepository,
            LoginLogRepository loginLogRepository,
            @Value("${app.google.dev-token:dev-google-token}") String devGoogleToken,
            @Value("${app.google.client-id}") String googleClientId,
            JavaMailSender mailSender
    ) {
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.loginLogRepository = loginLogRepository;
        this.devGoogleToken = devGoogleToken;
        this.googleVerifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
        this.mailSender = mailSender;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        RoleEntity defaultRole = roleRepository.findByCode(RoleCode.STAFF)
                .orElseThrow(() -> new IllegalStateException("Default role STAFF not found"));

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(defaultRole);
        user.setStatus("ACTIVE");
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse loginLocal(LocalLoginRequest request) {
        String email = request.email().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> invalidLogin(email, "Invalid email or password"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidLogin(email, "Invalid email or password");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw invalidLogin(email, "User is not active");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        logLogin(email, true, "LOCAL_LOGIN_SUCCESS");
        return buildAuthResponse(user);
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleProfile profile = verifyGoogleToken(request.token());
        UserEntity user = userRepository.findByEmailIgnoreCase(profile.email())
                .orElseGet(() -> createGoogleUser(profile));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw invalidLogin(profile.email(), "User is not active");
        }

        user.setGoogleId(profile.googleId());
        user.setFullName(profile.fullName());
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        logLogin(user.getEmail(), true, "GOOGLE_LOGIN_SUCCESS");
        return buildAuthResponse(user);
    }

    private UserEntity createGoogleUser(GoogleProfile profile) {
        RoleEntity defaultRole = roleRepository.findByCode(RoleCode.STAFF)
                .orElseThrow(() -> new IllegalStateException("Default role STAFF not found"));

        UserEntity user = new UserEntity();
        user.setEmail(profile.email());
        user.setGoogleId(profile.googleId());
        user.setFullName(profile.fullName());
        user.setRole(defaultRole);
        user.setStatus("ACTIVE");
        return userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(UserEntity user) {
        String jwt = jwtService.generateToken(user.getEmail(), com.invoiceocr.user.Role.valueOf(user.getRole().getCode().name()));
        return new AuthResponse(jwt, "Bearer", jwtService.getExpirationSeconds());
    }

    private GoogleProfile verifyGoogleToken(String token) {
        if (devGoogleToken.equals(token)) {
            return new GoogleProfile("dev-google-id", "admin@local.dev", "Local Admin");
        }

        try {
            GoogleIdToken idToken = googleVerifier.verify(token);
            if (idToken == null) {
                throw new IllegalArgumentException("Google ID token is invalid.");
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String fullName = (String) payload.getOrDefault("name", "Google User");
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Google account email is missing.");
            }
            return new GoogleProfile(googleId, email.toLowerCase(), fullName);
        } catch (GeneralSecurityException | IOException e) {
            throw new IllegalArgumentException("Cannot verify Google token: " + e.getMessage());
        }
    }

    private RuntimeException invalidLogin(String email, String reason) {
        logLogin(email, false, reason);
        return new IllegalArgumentException(reason);
    }

    private void logLogin(String email, boolean success, String reason) {
        LoginLogEntity log = new LoginLogEntity();
        log.setEmail(email);
        log.setSuccess(success);
        log.setReason(reason);
        loginLogRepository.save(log);
    }

    @org.springframework.transaction.annotation.Transactional
    public void changePassword(String email, String oldPassword, String newPassword) {
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        
        if (user.getPasswordHash() == null || !passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu cũ không chính xác.");
        }
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("phucxo262@gmail.com");
            message.setTo(toEmail);
            message.setSubject("Mã OTP khôi phục mật khẩu - Invoice OCR");
            message.setText("Xin chào,\n\nMã OTP để khôi phục mật khẩu của bạn là: " + otp + "\n\nMã này có hiệu lực trong vòng 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.\n\nTrân trọng,\nĐội ngũ Invoice OCR");
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Lỗi gửi Email: " + e.getMessage());
            throw new RuntimeException("Không thể gửi email OTP. Chi tiết lỗi: " + e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void forgotPassword(String email) {
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại trong hệ thống."));
        
        // Generate 6 digit numeric OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setResetOtp(otp);
        user.setResetOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        
        // Print to console log as fallback
        System.out.println("\n==================================================");
        System.out.println("MÃ OTP RESET MẬT KHẨU CỦA " + email + " LÀ: " + otp);
        System.out.println("==================================================\n");

        // Send real email OTP
        sendOtpEmail(email, otp);
    }

    @org.springframework.transaction.annotation.Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại trong hệ thống."));
        
        if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
            throw new IllegalArgumentException("Mã OTP không chính xác.");
        }
        
        if (user.getResetOtpExpiresAt() == null || user.getResetOtpExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn.");
        }
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetOtp(null);
        user.setResetOtpExpiresAt(null);
        userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public void verifyOtp(String email, String otp) {
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại trong hệ thống."));
        
        if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
            throw new IllegalArgumentException("Mã OTP không chính xác.");
        }
        
        if (user.getResetOtpExpiresAt() == null || user.getResetOtpExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn.");
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public UserProfile updateProfile(String email, String fullName) {
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        
        user.setFullName(fullName.trim());
        UserEntity updated = userRepository.save(user);
        
        return new UserProfile(
                updated.getEmail(),
                updated.getFullName(),
                Role.valueOf(updated.getRole().getCode().name()),
                updated.getId(),
                updated.getStatus()
        );
    }

    private record GoogleProfile(String googleId, String email, String fullName) {
    }
}
