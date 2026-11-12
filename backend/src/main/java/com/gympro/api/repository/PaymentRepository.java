package com.gympro.api.repository;

import com.gympro.api.model.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    Page<Payment> findByOrganizationIdOrderByCreatedAtDesc(String organizationId, Pageable pageable);
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
}
