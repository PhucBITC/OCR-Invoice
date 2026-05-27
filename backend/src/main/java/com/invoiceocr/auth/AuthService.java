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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Collections;

@Service
public class AuthService {
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final LoginLogRepository loginLogRepository;
    private final String devGoogleToken;
    private final GoogleIdTokenVerifier googleVerifier;

    public AuthService(
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            UserRepository userRepository,
            RoleRepository roleRepository,
            LoginLogRepository loginLogRepository,
            @Value("${app.google.dev-token:dev-google-token}") String devGoogleToken,
            @Value("${app.google.client-id}") String googleClientId
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

    private record GoogleProfile(String googleId, String email, String fullName) {
    }
}
