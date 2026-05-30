package com.invoiceocr.admin.controller;

import com.invoiceocr.common.ApiResponse;
import com.invoiceocr.user.Role;
import com.invoiceocr.user.UserProfile;
import com.invoiceocr.user.entity.RoleCode;
import com.invoiceocr.user.entity.RoleEntity;
import com.invoiceocr.user.entity.UserEntity;
import com.invoiceocr.user.repository.RoleRepository;
import com.invoiceocr.user.repository.UserRepository;
import com.invoiceocr.document.repository.DocumentRepository;
import com.invoiceocr.document.repository.InvoiceHeaderRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final DocumentRepository documentRepository;
    private final InvoiceHeaderRepository invoiceHeaderRepository;

    public AdminUserController(
            UserRepository userRepository, 
            RoleRepository roleRepository, 
            PasswordEncoder passwordEncoder,
            DocumentRepository documentRepository,
            InvoiceHeaderRepository invoiceHeaderRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.documentRepository = documentRepository;
        this.invoiceHeaderRepository = invoiceHeaderRepository;
    }

    @GetMapping
    public ApiResponse<List<UserProfile>> getAllUsers() {
        List<UserProfile> profiles = userRepository.findAll().stream()
                .map(this::toUserProfile)
                .toList();
        return ApiResponse.ok("Success", profiles);
    }

    @PostMapping
    public ApiResponse<UserProfile> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        RoleCode roleCode = RoleCode.valueOf(request.role().trim().toUpperCase());
        RoleEntity roleEntity = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        user.setRole(roleEntity);
        user.setStatus(request.status() == null || request.status().isBlank() ? "ACTIVE" : request.status().trim().toUpperCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);
        return ApiResponse.ok("User created successfully", toUserProfile(user));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserProfile> updateUser(@PathVariable Long id, @Valid @RequestBody AdminUpdateUserRequest request) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.role() != null && !request.role().isBlank()) {
            RoleCode roleCode = RoleCode.valueOf(request.role().trim().toUpperCase());
            RoleEntity roleEntity = roleRepository.findByCode(roleCode)
                    .orElseThrow(() -> new IllegalArgumentException("Role not found"));
            user.setRole(roleEntity);
        }
        if (request.status() != null && !request.status().isBlank()) {
            user.setStatus(request.status().trim().toUpperCase());
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        userRepository.save(user);
        return ApiResponse.ok("User updated successfully", toUserProfile(user));
    }

    @PutMapping("/{id}/roles")
    public ApiResponse<UserProfile> updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        if (roleStr == null || roleStr.isBlank()) {
            throw new IllegalArgumentException("Role is required");
        }

        String currentEmail = String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        UserEntity currentUser = userRepository.findByEmailIgnoreCase(currentEmail)
                .orElseThrow(() -> new IllegalArgumentException("Current user not found"));

        if (currentUser.getId().equals(id)) {
            throw new IllegalArgumentException("Bạn không thể tự thay đổi quyền của chính mình.");
        }

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        RoleCode roleCode = RoleCode.valueOf(roleStr.toUpperCase());
        RoleEntity roleEntity = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));

        user.setRole(roleEntity);
        userRepository.save(user);

        return ApiResponse.ok("Role updated successfully", toUserProfile(user));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<UserProfile> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        String currentEmail = String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        UserEntity currentUser = userRepository.findByEmailIgnoreCase(currentEmail)
                .orElseThrow(() -> new IllegalArgumentException("Current user not found"));

        if (currentUser.getId().equals(id)) {
            throw new IllegalArgumentException("Bạn không thể tự khóa tài khoản của chính mình.");
        }

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setStatus(statusStr.toUpperCase());
        userRepository.save(user);

        return ApiResponse.ok("Status updated successfully", toUserProfile(user));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<UserProfile> deleteUser(@PathVariable Long id) {
        String currentEmail = String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        UserEntity currentUser = userRepository.findByEmailIgnoreCase(currentEmail)
                .orElseThrow(() -> new IllegalArgumentException("Current user not found"));

        if (currentUser.getId().equals(id)) {
            throw new IllegalArgumentException("Bạn không thể tự xóa tài khoản của chính mình.");
        }

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean hasUploadedDocs = documentRepository.existsByUploadedById(id);
        boolean hasVerifiedInvoices = invoiceHeaderRepository.existsByVerifiedById(id);

        if (hasUploadedDocs || hasVerifiedInvoices) {
            // Soft delete due to dependencies
            user.setStatus("DELETED");
            userRepository.save(user);
            return ApiResponse.ok("Đã khóa tài khoản (Soft Delete) do có dữ liệu liên kết.", toUserProfile(user));
        } else {
            // Hard delete
            userRepository.delete(user);
            return ApiResponse.ok("Đã xóa vĩnh viễn tài khoản khỏi hệ thống.", null);
        }
    }

    private UserProfile toUserProfile(UserEntity user) {
        return new UserProfile(
                user.getEmail(),
                user.getFullName(),
                Role.valueOf(user.getRole().getCode().name()),
                user.getId(),
                user.getStatus()
        );
    }

    record AdminCreateUserRequest(
            @NotBlank @Email String email,
            @NotBlank String fullName,
            @NotBlank String role,
            @NotBlank @Size(min = 6, max = 100) String password,
            String status
    ) {}

    record AdminUpdateUserRequest(
            String fullName,
            String role,
            @Size(min = 6, max = 100) String password,
            String status
    ) {}
}
