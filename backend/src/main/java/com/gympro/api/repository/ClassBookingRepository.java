package com.gympro.api.repository;

import com.gympro.api.model.ClassBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClassBookingRepository extends JpaRepository<ClassBooking, String> {
    List<ClassBooking> findByClassId(String classId);

    boolean existsByClassIdAndMemberIdAndStatus(String classId, String memberId, String status);

    long countByClassIdAndStatus(String classId, String status);
}
