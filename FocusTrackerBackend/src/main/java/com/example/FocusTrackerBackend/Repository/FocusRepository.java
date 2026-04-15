package com.example.FocusTrackerBackend.Repository;

import com.example.FocusTrackerBackend.model.FocusSessions;
import com.example.FocusTrackerBackend.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FocusRepository extends JpaRepository<FocusSessions,Long> {
    List<FocusSessions> findByUser_Id(Long userId);

    List<FocusSessions> findByUser_IdAndStartTimeBetween(Long userId, LocalDateTime start,LocalDateTime end);


    // All sessions for a user with a specific tag
    List<FocusSessions> findByUser_IdAndTag(Long userId, Tag tag);

    // All sessions for a user where tag name matches (case-insensitive)
    List<FocusSessions> findByUser_IdAndTag_NameIgnoreCase(Long userId, String tagName);
}
