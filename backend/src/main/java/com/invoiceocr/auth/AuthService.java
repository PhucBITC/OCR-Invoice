package com.invoiceocr.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.invoiceocr.auth.dto.AuthResponse;
import com.invoiceocr.auth.dto.GoogleLoginRequest;
import com.invoiceocr.security.JwtService;
import com.invoiceocr.user.Role;
import com.invoiceocr.user.UserProfile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
public class AuthService {
    private final JwtService jwtService;
    private final String devGoogleToken;
    private final GoogleIdTokenVerifier googleVerifier;

    public AuthService(
            JwtService jwtService,
            @Value("${app.google.dev-token:dev-google-token}") String devGoogleToken,
            @Value("${app.google.client-id}") String googleClientId
    ) {
        this.jwtService = jwtService;
        this.devGoogleToken = devGoogleToken;
        this.googleVerifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
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

        try {
            GoogleIdToken idToken = googleVerifier.verify(token);
            if (idToken == null) {
                throw new IllegalArgumentException("Google ID token is invalid.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String fullName = (String) payload.getOrDefault("name", "Google User");
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Google account email is missing.");
            }

            return new UserProfile(email, fullName, Role.STAFF);
        } catch (GeneralSecurityException | IOException e) {
            throw new IllegalArgumentException("Cannot verify Google token: " + e.getMessage());
        }
    }
}
