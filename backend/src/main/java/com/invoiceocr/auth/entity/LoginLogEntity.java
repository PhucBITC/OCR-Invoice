package com.invoiceocr.auth.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_logs")
public class LoginLogEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "success", nullable = false)
    private boolean success;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { createdAt = LocalDateTime.now(); }

    public void setEmail(String email) { this.email = email; }
    public void setSuccess(boolean success) { this.success = success; }
    public void setReason(String reason) { this.reason = reason; }
}
