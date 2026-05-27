package com.invoiceocr.user.repository;

import com.invoiceocr.user.entity.RoleCode;
import com.invoiceocr.user.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<RoleEntity, Long> {
    Optional<RoleEntity> findByCode(RoleCode code);
}
