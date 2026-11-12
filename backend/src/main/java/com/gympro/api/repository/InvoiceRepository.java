package com.gympro.api.repository;

import com.gympro.api.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    List<Invoice> findByOrganizationId(String organizationId);
    List<Invoice> findByOrganizationIdAndBranchId(String organizationId, String branchId);
    Optional<Invoice> findByOrganizationIdAndInvoiceNumber(String organizationId, String invoiceNumber);
    Optional<Invoice> findByOrganizationIdAndBranchIdAndInvoiceNumber(String organizationId, String branchId, String invoiceNumber);
}
