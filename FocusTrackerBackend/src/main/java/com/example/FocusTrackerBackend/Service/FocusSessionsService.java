package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Dto.DailyStatsDto;
import com.example.FocusTrackerBackend.Dto.MonthlyStatsDto;
import com.example.FocusTrackerBackend.Dto.StreakDto;
import com.example.FocusTrackerBackend.Dto.WeeklyStatsDto;
import com.example.FocusTrackerBackend.Repository.FocusRepository;
import com.example.FocusTrackerBackend.Repository.UserRepository;
import com.example.FocusTrackerBackend.model.FocusSessions;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FocusSessionsService {

    @Autowired
    private UserRepository userrepo;
    @Autowired
    private FocusRepository repo;

    // Start new focus session
    public FocusSessions startSession(long userId) {
        User user = userrepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        FocusSessions session = new FocusSessions(user, LocalDateTime.now());
        return repo.save(session);
    }

    // Stop session and calculate duration
    public FocusSessions stopSession(Long sessionId,Long userId) {
        FocusSessions session = repo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if(session.getUser().getId()!= (userId)) {
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
        return repo.findByUser_Id(userId);
    }

    public FocusSessions getSessionById(long sessionId, Long userId) {
        FocusSessions sessions = repo.findById(sessionId)
                .orElseThrow(() ->new RuntimeException("Sessions not found"));
        if (sessions.getUser().getId() != userId) {
            throw new RuntimeException("Unauthorized access");
        }
        return sessions;
    }

    public DailyStatsDto getDailyStats(Long userId) {

        List<FocusSessions> sessions = repo.findByUser_Id(userId)
                .stream()
                .filter(s -> s.getStartTime().toLocalDate().equals(LocalDate.now()))
                .toList();
        int totalSessions = sessions.size();
        long totalMinutes = sessions.stream()
                .mapToLong(FocusSessions::getDuration)
                .sum();

        return new DailyStatsDto(totalMinutes,totalSessions);

    }

    public WeeklyStatsDto getWeeklyStats(Long userId) {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime weekStart = now.minusDays(7);
        List<FocusSessions> sessions = repo.findByUser_Id(userId)
                .stream()
                .filter(s -> s.getStartTime().isAfter(weekStart))
                .toList();
        int totalSessions = sessions.size();
        long totalMinutes  = sessions.stream()
                .mapToLong(FocusSessions::getDuration)
                .sum();
        return new WeeklyStatsDto(totalMinutes,totalSessions);
    }

    public MonthlyStatsDto getMontlyStats(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = now.withDayOfMonth(1);
        List<FocusSessions> sessions  = repo.findByUser_Id(userId)
                .stream()
                .filter(s->s.getStartTime().isAfter(monthStart))
                .toList();
        int totalSession = sessions.size();
        long totalMinutes = sessions.stream()
                .mapToLong(FocusSessions::getDuration)
                .sum();
        return new MonthlyStatsDto(totalMinutes,totalSession);
    }

    public StreakDto getStreak(Long userId) {
        LocalDate today = LocalDate.now();
        int streak = 0;
        while (true) {
            LocalDate dateTocheck = today.minusDays(streak);
            boolean hasSession = repo.findByUser_Id(userId)
                    .stream()
                    .anyMatch(s->s.getStartTime().toLocalDate().equals(dateTocheck));
            if(hasSession) {
                streak++;
            }else {
                break;

            }

        }
        return new StreakDto(streak);
        }
    }

