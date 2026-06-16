package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Dto.PomodoroSessionDto;
import com.example.FocusTrackerBackend.Dto.PomodoroStartRequest;
import com.example.FocusTrackerBackend.Repository.FocusRepository;
import com.example.FocusTrackerBackend.Repository.UserRepository;
import com.example.FocusTrackerBackend.model.FocusSessions;
import com.example.FocusTrackerBackend.model.PomodoroMode;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class PomodoroService {

    private final FocusRepository focusRepo;
    private final UserRepository userRepo;

    public PomodoroService(FocusRepository focusRepo, UserRepository userRepo) {
        this.focusRepo = focusRepo;
        this.userRepo = userRepo;
    }

    // ── Start a new session ──────────────────────────────────────────────────

    public PomodoroSessionDto startSession(Long userId, PomodoroStartRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateRequest(request);

        FocusSessions session = new FocusSessions(
                user,
                LocalDateTime.now(),
                request.getMode(),
                request.getCustomWorkMinutes(),
                request.getCustomBreakMinutes()
        );

        return toDto(focusRepo.save(session));
    }

    // ── Stop focus block, move to break ─────────────────────────────────────

    public PomodoroSessionDto stopFocus(Long sessionId, Long userId, String note) {
        FocusSessions session = findAndAuthorise(sessionId, userId);

        if (session.isCompleted()) {
            throw new RuntimeException("Session already completed");
        }
        if (session.isBreakStarted()) {
            throw new RuntimeException("Break already started — call /end-break to finish");
        }

        LocalDateTime now = LocalDateTime.now();
        session.setEndTime(now);
        session.setDuration(Duration.between(session.getStartTime(), now).toMinutes());
        session.setBreakStarted(true);
        session.setBreakStartTime(now);

        if (note != null && !note.isBlank()) {
            session.setNote(note.trim());
        }

        return toDto(focusRepo.save(session));
    }

    // ── End the break, mark session fully complete ───────────────────────────

    public PomodoroSessionDto endBreak(Long sessionId, Long userId) {
        FocusSessions session = findAndAuthorise(sessionId, userId);

        if (session.isCompleted()) {
            throw new RuntimeException("Session already completed");
        }
        if (!session.isBreakStarted()) {
            throw new RuntimeException("Focus block not stopped yet — call /stop first");
        }

        session.setBreakEndTime(LocalDateTime.now());
        session.setCompleted(true);

        return toDto(focusRepo.save(session));
    }

    // ── Skip the break entirely ──────────────────────────────────────────────

    public PomodoroSessionDto skipBreak(Long sessionId, Long userId) {
        FocusSessions session = findAndAuthorise(sessionId, userId);

        if (session.isCompleted()) {
            throw new RuntimeException("Session already completed");
        }
        if (!session.isBreakStarted()) {
            throw new RuntimeException("Stop the focus block first before skipping the break");
        }

        session.setCompleted(true);   // no break recorded — breakEndTime stays null

        return toDto(focusRepo.save(session));
    }

    // ── Get live status of an in-progress session ────────────────────────────

    public PomodoroSessionDto getStatus(Long sessionId, Long userId) {
        return toDto(findAndAuthorise(sessionId, userId));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private FocusSessions findAndAuthorise(Long sessionId, Long userId) {
        FocusSessions session = focusRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if (!Objects.equals(session.getUser().getId(), userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        return session;
    }

    private void validateRequest(PomodoroStartRequest request) {
        if (request.getMode() == PomodoroMode.CUSTOM) {
            if (request.getCustomWorkMinutes() == null || request.getCustomWorkMinutes() <= 0) {
                throw new RuntimeException("customWorkMinutes is required and must be > 0 for CUSTOM mode");
            }
            if (request.getCustomBreakMinutes() == null || request.getCustomBreakMinutes() < 0) {
                throw new RuntimeException("customBreakMinutes is required and must be >= 0 for CUSTOM mode");
            }
        }
    }

    private int resolveWorkMinutes(FocusSessions session) {
        if (session.getMode() == PomodoroMode.CUSTOM) {
            return session.getCustomWorkMinutes() != null ? session.getCustomWorkMinutes() : 25;
        }
        return session.getMode().getWorkMinutes();
    }

    private int resolveBreakMinutes(FocusSessions session) {
        if (session.getMode() == PomodoroMode.CUSTOM) {
            return session.getCustomBreakMinutes() != null ? session.getCustomBreakMinutes() : 5;
        }
        return session.getMode().getBreakMinutes();
    }

    private String resolveStatus(FocusSessions session) {
        if (session.isCompleted())    return "COMPLETED";
        if (session.isBreakStarted()) return "ON_BREAK";
        return "FOCUSING";
    }

    private int focusProgress(FocusSessions session, int workMinutes) {
        if (session.getEndTime() != null) return 100; // focus block finished
        long elapsed = Duration.between(session.getStartTime(), LocalDateTime.now()).toMinutes();
        return (int) Math.min(100, (elapsed * 100) / workMinutes);
    }

    private int breakProgress(FocusSessions session, int breakMinutes) {
        if (!session.isBreakStarted() || session.getBreakStartTime() == null) return 0;
        if (session.getBreakEndTime() != null) return 100; // break finished
        if (breakMinutes == 0) return 100;
        long elapsed = Duration.between(session.getBreakStartTime(), LocalDateTime.now()).toMinutes();
        return (int) Math.min(100, (elapsed * 100) / breakMinutes);
    }

    private long breakDuration(FocusSessions session) {
        if (session.getBreakStartTime() == null) return 0;
        LocalDateTime end = session.getBreakEndTime() != null
                ? session.getBreakEndTime()
                : LocalDateTime.now();
        return Duration.between(session.getBreakStartTime(), end).toMinutes();
    }

    public PomodoroSessionDto toDto(FocusSessions session) {
        int workMins  = resolveWorkMinutes(session);
        int breakMins = resolveBreakMinutes(session);

        return new PomodoroSessionDto(
                session.getId(),
                session.getMode(),
                workMins,
                breakMins,
                session.getStartTime(),
                session.getEndTime(),
                session.getBreakStartTime(),
                session.getBreakEndTime(),
                session.getDuration(),
                breakDuration(session),
                session.isCompleted(),
                session.isBreakStarted(),
                session.getNote(),
                resolveStatus(session),
                focusProgress(session, workMins),
                breakProgress(session, breakMins)
        );
    }
}