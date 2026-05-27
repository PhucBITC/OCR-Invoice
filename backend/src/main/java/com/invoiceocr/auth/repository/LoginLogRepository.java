package com.invoiceocr.auth.repository;

import com.invoiceocr.auth.entity.LoginLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginLogRepository extends JpaRepository<LoginLogEntity, Long> {
}
