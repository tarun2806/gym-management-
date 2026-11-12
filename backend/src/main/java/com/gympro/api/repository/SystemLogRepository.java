package com.gympro.api.repository;

import com.gympro.api.model.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, String> {
    List<SystemLog> findTop50ByOrderByCreatedAtDesc();
}
