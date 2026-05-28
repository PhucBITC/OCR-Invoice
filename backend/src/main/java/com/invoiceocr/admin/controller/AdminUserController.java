package com.invoiceocr.admin.controller;

import com.invoiceocr.common.ApiResponse;
import com.invoiceocr.user.Role;
import com.invoiceocr.user.UserProfile;
import com.invoiceocr.user.entity.RoleCode;
import com.invoiceocr.user.entity.RoleEntity;
import com.invoiceocr.user.entity.UserEntity;
import com.invoiceocr.user.repository.RoleRepository;
import com.invoiceocr.user.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public AdminUserController(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @GetMapping
    public ApiResponse<List<UserProfile>> getAllUsers() {
        List<UserProfile> profiles = userRepository.findAll().stream()
                .map(user -> new UserProfile(
                        user.getEmail(),
                        user.getFullName(),
                        Role.valueOf(user.getRole().getCode().name()),
                        user.getId(),
                        user.getStatus()
                ))
                .toList();
        return ApiResponse.ok("Success", profiles);
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

        return ApiResponse.ok("Role updated successfully", new UserProfile(
                user.getEmail(),
                user.getFullName(),
                Role.valueOf(user.getRole().getCode().name()),
                user.getId(),
                user.getStatus()
        ));
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

        return ApiResponse.ok("Status updated successfully", new UserProfile(
                user.getEmail(),
                user.getFullName(),
                Role.valueOf(user.getRole().getCode().name()),
                user.getId(),
                user.getStatus()
        ));
    }
}
