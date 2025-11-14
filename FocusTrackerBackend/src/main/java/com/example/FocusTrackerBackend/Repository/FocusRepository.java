package com.example.FocusTrackerBackend.Repository;

import com.example.FocusTrackerBackend.model.FocusSessions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FocusRepository extends JpaRepository<FocusSessions,Long> {
    List<FocusSessions> findByUser_Id(Long userId);
}
