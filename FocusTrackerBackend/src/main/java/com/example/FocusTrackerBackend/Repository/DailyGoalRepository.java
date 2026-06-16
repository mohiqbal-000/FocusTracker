package com.example.FocusTrackerBackend.Repository;

import com.example.FocusTrackerBackend.model.DailyGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DailyGoalRepository extends JpaRepository<DailyGoal, Long> {
    Optional<DailyGoal> findByUser_Id(Long userId);
    boolean existsByUser_Id(Long userId);
}