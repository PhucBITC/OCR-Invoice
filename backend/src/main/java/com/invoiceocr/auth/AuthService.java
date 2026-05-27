package com.invoiceocr.auth;

import com.invoiceocr.auth.dto.AuthResponse;
import com.invoiceocr.auth.dto.GoogleLoginRequest;
import com.invoiceocr.security.JwtService;
import com.invoiceocr.user.Role;
import com.invoiceocr.user.UserProfile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final JwtService jwtService;
    private final String devGoogleToken;

    public AuthService(JwtService jwtService, @Value("${app.google.dev-token:dev-google-token}") String devGoogleToken) {
        this.jwtService = jwtService;
        this.devGoogleToken = devGoogleToken;
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        UserProfile profile = verifyGoogleToken(request.token());
        String jwt = jwtService.generateToken(profile.email(), profile.role());
        return new AuthResponse(jwt, "Bearer", jwtService.getExpirationSeconds());
    }

    public UserProfile verifyGoogleToken(String token) {
        if (devGoogleToken.equals(token)) {
            return new UserProfile("admin@local.dev", "Local Admin", Role.ADMIN);
        }
        throw new IllegalArgumentException("Google token is invalid. Configure real verification in production.");
    }
}
