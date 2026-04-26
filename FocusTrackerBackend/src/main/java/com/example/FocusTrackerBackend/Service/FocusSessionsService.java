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

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
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
    @Autowired
    private ProfileService profileService;

    // ── Start session ─────────────────────────────────────────────────────────

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

    // ── Stop session ──────────────────────────────────────────────────────────

    public FocusSessions stopSession(Long sessionId, Long userId) {
        FocusSessions session = repo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!Objects.equals(session.getUser().getId(), userId)) {
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

    // ── History ───────────────────────────────────────────────────────────────

    public List<FocusSessions> getHistory(Long userId, String tagName) {
        if (tagName != null && !tagName.isBlank()) {
            return repo.findByUser_IdAndTag_NameIgnoreCase(userId, tagName.trim());
        }
        return repo.findByUser_Id(userId);
    }

    public FocusSessions getSessionById(long sessionId, Long userId) {
        FocusSessions session = repo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if (!Objects.equals(session.getUser().getId(), userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        return session;
    }

    // ── Notes ─────────────────────────────────────────────────────────────────

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

    // ── Stats ─────────────────────────────────────────────────────────────────

    public DailyStatsDto getDailyStats(Long userId) {
        LocalDate today = todayForUser(userId);

        List<FocusSessions> sessions = repo.findByUser_Id(userId)
                .stream()
                .filter(s -> s.isCompleted() &&
                        s.getStartTime().toLocalDate().equals(today))
                .toList();

        int totalSessions = sessions.size();
        long totalMinutes = sessions.stream()
                .mapToLong(FocusSessions::getDuration)
                .sum();

        return dailyGoalService.findGoal(userId)
                .map(goal -> {
                    int target       = goal.getTargetMinutes();
                    int progress     = (int) Math.min(100, (totalMinutes * 100) / target);
                    long remaining   = Math.max(0, target - totalMinutes);
                    boolean achieved = totalMinutes >= target;
                    return new DailyStatsDto(
                            totalMinutes, totalSessions,
                            target, progress, remaining, achieved);
                })
                .orElse(new DailyStatsDto(totalMinutes, totalSessions));
    }

    public WeeklyStatsDto getWeeklyStats(Long userId) {
        LocalDateTime weekStart = LocalDateTime.now().minusDays(7);
        List<FocusSessions> sessions = repo.findByUser_Id(userId)
                .stream()
                .filter(s -> s.getStartTime().isAfter(weekStart))
                .toList();
        long totalMinutes = sessions.stream()
                .mapToLong(FocusSessions::getDuration)
                .sum();
        return new WeeklyStatsDto(totalMinutes, sessions.size());
    }

    public MonthlyStatsDto getMonthlyStats(Long userId) {
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1);
        List<FocusSessions> sessions = repo.findByUser_Id(userId)
                .stream()
                .filter(s -> s.getStartTime().isAfter(monthStart))
                .toList();
        long totalMinutes = sessions.stream()
                .mapToLong(FocusSessions::getDuration)
                .sum();
        return new MonthlyStatsDto(totalMinutes, sessions.size());
    }

    public StreakDto getStreak(Long userId) {
        LocalDate today = todayForUser(userId);

        Set<LocalDate> sessionDates = repo.findByUser_Id(userId)
                .stream()
                .map(s -> s.getStartTime().toLocalDate())
                .collect(Collectors.toSet());

        int streak = 0;
        while (sessionDates.contains(today.minusDays(streak))) {
            streak++;
        }
        return new StreakDto(streak);
    }

    // ── Personal records ──────────────────────────────────────────────────────

    public PersonalRecordsDto getPersonalRecords(Long userId) {
        // FIX 1: removed duplicate 'today' declaration that caused
        // "variable already defined" compile error
        LocalDate today = todayForUser(userId);

        List<FocusSessions> completed = repo.findByUser_Id(userId)
                .stream()
                .filter(FocusSessions::isCompleted)
                .toList();

        if (completed.isEmpty()) {
            return emptyRecords();
        }

        // All-time totals
        long allTimeMinutes  = completed.stream()
                .mapToLong(FocusSessions::getDuration).sum();
        int  allTimeSessions = completed.size();

        Set<LocalDate> activeDaySet = completed.stream()
                .map(s -> s.getStartTime().toLocalDate())
                .collect(Collectors.toSet());
        int allTimeActiveDays = activeDaySet.size();

        // Longest single session
        FocusSessions longestSession = completed.stream()
                .max(Comparator.comparingLong(FocusSessions::getDuration))
                .orElseThrow();

        // Best day
        Map<LocalDate, Long> minutesByDay = completed.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getStartTime().toLocalDate(),
                        Collectors.summingLong(FocusSessions::getDuration)
                ));

        LocalDate bestDayDate = minutesByDay.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElseThrow();

        long bestDayMinutes     = minutesByDay.get(bestDayDate);
        int  bestDaySessionCount = (int) completed.stream()
                .filter(s -> s.getStartTime().toLocalDate().equals(bestDayDate))
                .count();

        // Best streak ever
        List<LocalDate> sortedDays = activeDaySet.stream().sorted().toList();

        int bestStreak = 1;
        int currentRun = 1;
        int bestStart  = 0;
        int runStart   = 0;

        for (int i = 1; i < sortedDays.size(); i++) {
            if (sortedDays.get(i).equals(sortedDays.get(i - 1).plusDays(1))) {
                currentRun++;
                if (currentRun > bestStreak) {
                    bestStreak = currentRun;
                    bestStart  = runStart;
                }
            } else {
                currentRun = 1;
                runStart   = i;
            }
        }

        LocalDate bestStreakStartDate = sortedDays.get(bestStart);
        LocalDate bestStreakEndDate   = bestStreakStartDate.plusDays(bestStreak - 1);

        // Current streak — uses timezone-aware 'today' declared above
        // FIX 1 continued: no second 'LocalDate today' here — reuses the one above
        int currentStreak = 0;
        while (activeDaySet.contains(today.minusDays(currentStreak))) {
            currentStreak++;
        }

        DateTimeFormatter fullFmt  = DateTimeFormatter.ofPattern("EEE MMM d");
        DateTimeFormatter shortFmt = DateTimeFormatter.ofPattern("MMM d");

        return new PersonalRecordsDto(
                longestSession.getDuration(),
                longestSession.getStartTime().toLocalDate().format(fullFmt),
                bestDayMinutes,
                bestDayDate.format(fullFmt),
                bestDaySessionCount,
                bestStreak,
                bestStreakStartDate.format(shortFmt),
                bestStreakEndDate.format(shortFmt),
                currentStreak,
                allTimeMinutes,
                allTimeSessions,
                allTimeActiveDays
        );
    }

    private PersonalRecordsDto emptyRecords() {
        return new PersonalRecordsDto(
                0, "—",
                0, "—", 0,
                0, "—", "—",
                0,
                0, 0, 0
        );
    }

    // ── Best hours ────────────────────────────────────────────────────────────

    public BestHoursDto getBestHours(Long userId) {
        List<FocusSessions> completed = repo.findByUser_Id(userId)
                .stream()
                .filter(FocusSessions::isCompleted)
                .toList();

        if (completed.isEmpty()) return emptyBestHours();

        Map<Integer, List<FocusSessions>> byHour = completed.stream()
                .collect(Collectors.groupingBy(s -> s.getStartTime().getHour()));

        long maxMinutes = byHour.values().stream()
                .mapToLong(s -> s.stream().mapToLong(FocusSessions::getDuration).sum())
                .max().orElse(1);

        List<HourlyBucketDto> allHours = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            List<FocusSessions> sessions = byHour.getOrDefault(h, List.of());
            long total = sessions.stream().mapToLong(FocusSessions::getDuration).sum();
            int count  = sessions.size();
            double avg = count > 0
                    ? Math.round((total * 10.0) / count) / 10.0
                    : 0.0;
            allHours.add(new HourlyBucketDto(
                    h, formatHour(h), total, count, avg,
                    calculateIntensity(total, maxMinutes)));
        }

        List<HourlyBucketDto> topHours = allHours.stream()
                .filter(b -> b.getTotalMinutes() > 0)
                .sorted(Comparator.comparingLong(HourlyBucketDto::getTotalMinutes).reversed())
                .limit(3)
                .toList();

        String peakPeriod = topHours.isEmpty()
                ? "none" : classifyPeriod(topHours.get(0).getHour());
        String insight    = buildInsight(topHours, peakPeriod, completed.size());

        return new BestHoursDto(allHours, topHours, peakPeriod, insight, completed.size());
    }

    private int calculateIntensity(long totalMinutes, long maxMinutes) {
        if (totalMinutes == 0) return 0;
        double ratio = (double) totalMinutes / maxMinutes;
        if (ratio >= 0.80) return 4;
        if (ratio >= 0.55) return 3;
        if (ratio >= 0.30) return 2;
        return 1;
    }

    private String formatHour(int hour) {
        if (hour == 0)  return "12 AM";
        if (hour == 12) return "12 PM";
        return hour < 12 ? hour + " AM" : (hour - 12) + " PM";
    }

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
                    "You're %s — your top focus slots are %s and %s, " +
                            "averaging %.0f and %.0f min per session.",
                    periodDesc,
                    // FIX 2: changed .getLabel() → .getLabel() — make sure
                    // HourlyBucketDto has getLabel() not getDayLabel()
                    best.getLabel(), second.getLabel(),
                    best.getAvgMinutes(), second.getAvgMinutes()
            );
        }

        return String.format(
                "You're %s — your peak focus hour is %s, " +
                        "averaging %.0f min per session across %d sessions.",
                periodDesc, best.getLabel(), best.getAvgMinutes(), totalSessions
        );
    }

    private BestHoursDto emptyBestHours() {
        List<HourlyBucketDto> empty = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            empty.add(new HourlyBucketDto(h, formatHour(h), 0, 0, 0.0, 0));
        }
        return new BestHoursDto(empty, List.of(), "none",
                "No completed sessions yet. Start focusing to see your best hours.", 0);
    }

    // ── Weekly trend ──────────────────────────────────────────────────────────

    public WeeklyTrendDto getWeeklyTrend(Long userId) {
        // FIX 3: was LocalDate.now() — now uses the user's timezone
        LocalDate today = todayForUser(userId);

        List<FocusSessions> allSessions = repo.findByUser_Id(userId)
                .stream()
                .filter(FocusSessions::isCompleted)
                .toList();

        LocalDate weekStart = today.minusDays(6);

        Map<LocalDate, List<FocusSessions>> thisWeekByDay = allSessions.stream()
                .filter(s -> {
                    LocalDate d = s.getStartTime().toLocalDate();
                    return !d.isBefore(weekStart) && !d.isAfter(today);
                })
                .collect(Collectors.groupingBy(s -> s.getStartTime().toLocalDate()));

        List<DailyBucketDto> days = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            days.add(buildBucket(date,
                    thisWeekByDay.getOrDefault(date, List.of()), today));
        }

        long   totalThisWeek        = days.stream().mapToLong(DailyBucketDto::getTotalMinutes).sum();
        int    totalSessionsThisWeek = days.stream().mapToInt(DailyBucketDto::getSessionCount).sum();
        int    activeDays            = (int) days.stream()
                .filter(d -> d.getTotalMinutes() > 0).count();
        double dailyAvg              = activeDays > 0
                ? Math.round((totalThisWeek * 10.0) / activeDays) / 10.0
                : 0.0;

        DailyBucketDto bestDay = days.stream()
                .max(Comparator.comparingLong(DailyBucketDto::getTotalMinutes))
                .orElse(days.get(6));

        LocalDate lastWeekEnd   = weekStart.minusDays(1);
        LocalDate lastWeekStart = lastWeekEnd.minusDays(6);

        long totalLastWeek = allSessions.stream()
                .filter(s -> {
                    LocalDate d = s.getStartTime().toLocalDate();
                    return !d.isBefore(lastWeekStart) && !d.isAfter(lastWeekEnd);
                })
                .mapToLong(FocusSessions::getDuration)
                .sum();

        String trendDirection;
        int    trendPercent;
        String trendLabel;

        if (totalLastWeek == 0 && totalThisWeek == 0) {
            trendDirection = "FLAT"; trendPercent = 0; trendLabel = "No data yet";
        } else if (totalLastWeek == 0) {
            trendDirection = "UP"; trendPercent = 100; trendLabel = "First week of data";
        } else {
            double change = ((double)(totalThisWeek - totalLastWeek) / totalLastWeek) * 100;
            trendPercent  = (int) Math.abs(Math.round(change));
            if (change > 5) {
                trendDirection = "UP";
                trendLabel     = "+" + trendPercent + "% vs last week";
            } else if (change < -5) {
                trendDirection = "DOWN";
                trendLabel     = "-" + trendPercent + "% vs last week";
            } else {
                trendDirection = "FLAT";
                trendLabel     = "About the same as last week";
            }
        }

        return new WeeklyTrendDto(
                days, totalThisWeek, totalLastWeek,
                totalSessionsThisWeek,
                trendDirection, trendPercent, trendLabel,
                bestDay.getTotalMinutes(), bestDay.getFullLabel(),
                dailyAvg, activeDays
        );
    }

    private DailyBucketDto buildBucket(LocalDate date,
                                       List<FocusSessions> sessions,
                                       LocalDate today) {
        long   total     = sessions.stream().mapToLong(FocusSessions::getDuration).sum();
        int    count     = sessions.size();
        double avg       = count > 0
                ? Math.round((total * 10.0) / count) / 10.0
                : 0.0;
        String dayLabel  = date.getDayOfWeek()
                .getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
        String fullLabel = dayLabel + " " +
                date.format(DateTimeFormatter.ofPattern("MMM d"));
        return new DailyBucketDto(
                date, dayLabel, fullLabel, total, count, avg, date.equals(today));
    }

    // ── Timezone helper ───────────────────────────────────────────────────────

    private LocalDate todayForUser(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ZoneId zone = profileService.resolveZone(user);
        return ZonedDateTime.now(zone).toLocalDate();
    }
}