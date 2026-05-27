package com.invoiceocr.config;

import com.invoiceocr.user.entity.RoleCode;
import com.invoiceocr.user.entity.RoleEntity;
import com.invoiceocr.user.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeederConfig {

    @Bean
    CommandLineRunner seedRoles(RoleRepository roleRepository) {
        return args -> {
            seedRole(roleRepository, RoleCode.ADMIN, "Administrator");
            seedRole(roleRepository, RoleCode.STAFF, "Staff");
            seedRole(roleRepository, RoleCode.REVIEWER, "Reviewer");
            seedRole(roleRepository, RoleCode.MANAGER, "Manager");
        };
    }

    private void seedRole(RoleRepository repo, RoleCode code, String name) {
        repo.findByCode(code).orElseGet(() -> {
            RoleEntity role = new RoleEntity();
            role.setCode(code);
            role.setName(name);
            return repo.save(role);
        });
    }
}
