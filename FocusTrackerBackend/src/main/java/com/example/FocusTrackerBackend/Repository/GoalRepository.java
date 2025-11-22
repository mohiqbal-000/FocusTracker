package com.example.FocusTrackerBackend.Repository;

import com.example.FocusTrackerBackend.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalRepository extends JpaRepository<Goal,Long> {


    List<Goal> findByUser_id(Long userId);
}
