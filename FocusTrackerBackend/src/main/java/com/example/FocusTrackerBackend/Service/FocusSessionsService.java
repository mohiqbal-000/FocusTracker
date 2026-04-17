package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Dto.*;
import com.example.FocusTrackerBackend.Repository.FocusRepository;
import com.example.FocusTrackerBackend.Repository.TagRepository;
import com.example.FocusTrackerBackend.Repository.UserRepository;
import com.example.FocusTrackerBackend.model.FocusSessions;
import com.example.FocusTrackerBackend.model.Tag;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FocusSessionsService {

    @Autowired
    private UserRepository userRepo;
    @Autowired
    private FocusRepository repo;

    @Autowired
    private TagRepository tagRepo;

    @Autowired
    private DailyGoalService dailyGoalService;



    // Updated startSession — tagName is optional, pass null to start untagged
    public FocusSessions startSession(Long userId, String tagName) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FocusSessions session = new FocusSessions(user);

        if (tagName != null && !tagName.isBlank()) {
            Tag tag = tagRepo.findByNameIgnoreCase(tagName.trim())
                    .orElseThrow(() -> new RuntimeException(
                            "Tag '" + tagName + "' not found. Create it first via POST /api/tags"));
            session.setTag(tag);
        }

        return repo.save(session);
    }

    // Stop session and calculate duration
    public FocusSessions stopSession(Long sessionId,Long userId) {
        FocusSessions session = repo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if(!Objects.equals(session.getUser().getId(), userId)) {
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
    public List<FocusSessions> getHistory(Long userId, String tagName) {
        if (tagName != null && !tagName.isBlank()) {
            return repo.findByUser_IdAndTag_NameIgnoreCase(userId, tagName.trim());
        }
        return repo.findByUser_Id(userId);
    }
    public FocusSessions getSessionById(long sessionId, Long userId) {
        FocusSessions sessions = repo.findById(sessionId)
                .orElseThrow(() ->new RuntimeException("Sessions not found"));
        if (!Objects.equals(sessions.getUser().getId(), userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        return sessions;
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

    public MonthlyStatsDto getMonthlyStats(Long userId) {
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

        Set<LocalDate> sessionDates = repo.findByUser_Id(userId)
                .stream()
                .map(s -> s.getStartTime().toLocalDate())
                .collect(Collectors.toSet());

        int streak = 0;
        while (sessionDates.contains(today.minusDays(streak))) {
            streak++;
        }
        return new StreakDto();
    }

    public FocusSessions addNote(Long sessionId, Long userId, String note) {
        FocusSessions session = repo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!Objects.equals(session.getUser().getId(), userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        if (!session.isCompleted()) {
            throw new RuntimeException("Cannot add a note to an in-progress session");
        }
        if (note == null || note.isBlank()) {
            throw new RuntimeException("Note cannot be empty");
        }

        session.setNote(note.trim());
        return repo.save(session);
    }

    public FocusSessions deleteNote(Long sessionId, Long userId) {
        FocusSessions session = repo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!Objects.equals(session.getUser().getId(), userId)) {
            throw new RuntimeException("Unauthorized access");
        }

        session.setNote(null);
        return repo.save(session);
    }
    public DailyStatsDto getDailyStats(Long userId) {

        // Collect today's completed sessions
        List<FocusSessions> sessions = repo.findByUser_Id(userId)
                .stream()
                .filter(s -> s.isCompleted() &&
                        s.getStartTime().toLocalDate().equals(LocalDate.now()))
                .toList();

        int totalSessions = sessions.size();
        long totalMinutes = sessions.stream()
                .mapToLong(FocusSessions::getDuration)
                .sum();

        // Check if user has a daily goal
        return dailyGoalService.findGoal(userId)
                .map(goal -> {
                    int target = goal.getTargetMinutes();
                    int progress = (int) Math.min(100, (totalMinutes * 100) / target);
                    long remaining = Math.max(0, target - totalMinutes);
                    boolean achieved = totalMinutes >= target;

                    return new DailyStatsDto(
                            totalMinutes, totalSessions,
                            target, progress, remaining, achieved
                    );
                })
                // No goal set — return basic stats without goal fields
                .orElse(new DailyStatsDto(totalMinutes, totalSessions));
    }
    public BestHoursDto getBestHours(Long userId) {

        // Only analyse completed sessions — in-progress sessions have no duration
        List<FocusSessions> completed = repo.findByUser_Id(userId)
                .stream()
                .filter(FocusSessions::isCompleted)
                .toList();

        if (completed.isEmpty()) {
            return emptyBestHours();
        }

        // Group sessions by the hour their startTime falls in (0–23)
        Map<Integer, List<FocusSessions>> byHour = completed.stream()
                .collect(Collectors.groupingBy(s -> s.getStartTime().getHour()));

        // Find the maximum totalMinutes across all slots — used to scale intensityLevel
        long maxMinutes = byHour.values().stream()
                .mapToLong(sessions -> sessions.stream()
                        .mapToLong(FocusSessions::getDuration).sum())
                .max()
                .orElse(1);   // avoid division by zero

        // Build all 24 hourly buckets, filling empty hours with zeros
        List<HourlyBucketDto> allHours = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            List<FocusSessions> sessions = byHour.getOrDefault(h, List.of());
            long totalMinutes = sessions.stream()
                    .mapToLong(FocusSessions::getDuration).sum();
            int count = sessions.size();
            double avg = count > 0
                    ? Math.round((totalMinutes * 10.0) / count) / 10.0
                    : 0.0;
            int intensity = calculateIntensity(totalMinutes, maxMinutes);

            allHours.add(new HourlyBucketDto(h, formatHour(h), totalMinutes, count, avg, intensity));
        }

        // Top 3 hours by total focus minutes
        List<HourlyBucketDto> topHours = allHours.stream()
                .filter(b -> b.getTotalMinutes() > 0)
                .sorted(Comparator.comparingLong(HourlyBucketDto::getTotalMinutes).reversed())
                .limit(3)
                .toList();

        String peakPeriod = topHours.isEmpty() ? "none"
                : classifyPeriod(topHours.get(0).getHour());

        String insight = buildInsight(topHours, peakPeriod, completed.size());

        return new BestHoursDto(allHours, topHours, peakPeriod, insight, completed.size());
    }

// ── Helpers ──────────────────────────────────────────────────────────────────

    // Scale totalMinutes to an intensity level 0–4 relative to the user's personal max
    private int calculateIntensity(long totalMinutes, long maxMinutes) {
        if (totalMinutes == 0) return 0;
        double ratio = (double) totalMinutes / maxMinutes;
        if (ratio >= 0.80) return 4;   // peak
        if (ratio >= 0.55) return 3;   // high
        if (ratio >= 0.30) return 2;   // medium
        return 1;                       // low
    }

    // "9 AM", "2 PM", "12 PM", "12 AM"
    private String formatHour(int hour) {
        if (hour == 0)  return "12 AM";
        if (hour == 12) return "12 PM";
        return hour < 12
                ? hour + " AM"
                : (hour - 12) + " PM";
    }

    // Broad time-of-day period for the insight sentence
    private String classifyPeriod(int hour) {
        if (hour >= 5  && hour < 12) return "morning";
        if (hour >= 12 && hour < 17) return "afternoon";
        if (hour >= 17 && hour < 21) return "evening";
        return "night";
    }

    private String buildInsight(List<HourlyBucketDto> topHours,
                                String peakPeriod, int totalSessions) {
        if (topHours.isEmpty()) {
            return "No completed sessions yet. Start focusing to see your best hours.";
        }

        HourlyBucketDto best = topHours.get(0);
        String periodDesc = switch (peakPeriod) {
            case "morning"   -> "a morning person";
            case "afternoon" -> "most productive in the afternoon";
            case "evening"   -> "an evening focuser";
            case "night"     -> "a night owl";
            default          -> "productive throughout the day";
        };

        if (topHours.size() >= 2) {
            HourlyBucketDto second = topHours.get(1);
            return String.format(
                    "You're %s — your top focus slots are %s and %s, averaging %.0f and %.0f min per session.",
                    periodDesc,
                    best.getLabel(), second.getLabel(),
                    best.getAvgMinutes(), second.getAvgMinutes()
            );
        }

        return String.format(
                "You're %s — your peak focus hour is %s, averaging %.0f min per session across %d sessions.",
                periodDesc, best.getLabel(), best.getAvgMinutes(), totalSessions
        );
    }

    // Returned when the user has no completed sessions yet
    private BestHoursDto emptyBestHours() {
        List<HourlyBucketDto> empty = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            empty.add(new HourlyBucketDto(h, formatHour(h), 0, 0, 0.0, 0));
        }
        return new BestHoursDto(
                empty,
                List.of(),
                "none",
                "No completed sessions yet. Start focusing to see your best hours.",
                0
        );
    }
    }

