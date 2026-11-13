package com.gympro.api.repository;

import com.gympro.api.model.SubscriptionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, String> {
    List<SubscriptionPayment> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);
    Optional<SubscriptionPayment> findByRazorpayOrderId(String orderId);
    Optional<SubscriptionPayment> findByRazorpayPaymentId(String paymentId);
    boolean existsByRazorpayPaymentId(String paymentId);
    boolean existsByRazorpayOrderId(String orderId);
}
