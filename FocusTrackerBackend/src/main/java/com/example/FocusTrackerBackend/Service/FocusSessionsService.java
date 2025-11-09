package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Repository.FocusRepository;
import com.example.FocusTrackerBackend.model.FocusSessions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FocusSessionsService {

    @Autowired
    private FocusRepository repo;

    // Start new focus session
    public FocusSessions startSession(long userId) {
        FocusSessions session = new FocusSessions(userId, LocalDateTime.now());
        return repo.save(session);
    }

    // Stop session and calculate duration
    public FocusSessions stopSession(Long sessionId,Long userId) {
        FocusSessions session = repo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if(session.getUserId()!= (userId)) {
        throw new RuntimeException("Unauthorized: cannot stop another user's session");
        }

        if (session.isCompleted()) {
            throw new RuntimeException("Session already completed");
        }

        session.setEndTime(LocalDateTime.now());
        long duration = Duration.between(session.getStartTime(), session.getEndTime()).toMinutes();
        session.setDuration(duration);
        session.setCompleted(true);

        return repo.save(session);
    }

    // Get all sessions for a specific user
    public List<FocusSessions> getHistory(Long userId) {
        return repo.findByUserId(userId);
    }
}
