package com.invoiceocr.config;

import com.invoiceocr.document.entity.DocumentTypeEntity;
import com.invoiceocr.document.repository.DocumentTypeRepository;
import com.invoiceocr.user.entity.RoleCode;
import com.invoiceocr.user.entity.RoleEntity;
import com.invoiceocr.user.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeederConfig {

    @Bean
    CommandLineRunner seedData(RoleRepository roleRepository, DocumentTypeRepository documentTypeRepository) {
        return args -> {
            seedRole(roleRepository, RoleCode.ADMIN, "Administrator");
            seedRole(roleRepository, RoleCode.STAFF, "Staff");
            seedRole(roleRepository, RoleCode.REVIEWER, "Reviewer");
            seedRole(roleRepository, RoleCode.MANAGER, "Manager");

            seedDocumentType(documentTypeRepository, "INVOICE_IN", "Hóa đơn mua vào", "Hóa đơn giá trị gia tăng mua vào");
            seedDocumentType(documentTypeRepository, "INVOICE_OUT", "Hóa đơn bán ra", "Hóa đơn giá trị gia tăng bán ra");
            seedDocumentType(documentTypeRepository, "RECEIPT", "Phiếu thu", "Phiếu thu tiền mặt hoặc ngân hàng");
            seedDocumentType(documentTypeRepository, "PAYMENT", "Phiếu chi", "Phiếu chi tiền mặt hoặc chuyển khoản");
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

    private void seedDocumentType(DocumentTypeRepository repo, String code, String name, String description) {
        repo.findByCode(code).orElseGet(() -> {
            DocumentTypeEntity entity = new DocumentTypeEntity();
            entity.setCode(code);
            entity.setName(name);
            entity.setDescription(description);
            return repo.save(entity);
        });
    }
}
