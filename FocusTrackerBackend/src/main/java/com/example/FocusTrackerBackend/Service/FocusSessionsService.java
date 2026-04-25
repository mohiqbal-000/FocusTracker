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
            return new StreakDto(streak);
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
        public WeeklyTrendDto getWeeklyTrend(Long userId) {
    
            LocalDate today = LocalDate.now();
    
            // Load all completed sessions once — no repeated DB calls
            List<FocusSessions> allSessions = repo.findByUser_Id(userId)
                    .stream()
                    .filter(FocusSessions::isCompleted)
                    .toList();
    
            // ── This week: past 7 days including today ────────────────────────────
            LocalDate weekStart = today.minusDays(6);
    
            Map<LocalDate, List<FocusSessions>> thisWeekByDay = allSessions.stream()
                    .filter(s -> {
                        LocalDate d = s.getStartTime().toLocalDate();
                        return !d.isBefore(weekStart) && !d.isAfter(today);
                    })
                    .collect(Collectors.groupingBy(s -> s.getStartTime().toLocalDate()));
    
            // Build 7 daily buckets oldest → today
            List<DailyBucketDto> days = new ArrayList<>();
            for (int i = 6; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                List<FocusSessions> daySessions = thisWeekByDay.getOrDefault(date, List.of());
                days.add(buildBucket(date, daySessions, today));
            }
    
            long totalThisWeek = days.stream().mapToLong(DailyBucketDto::getTotalMinutes).sum();
            int totalSessionsThisWeek = days.stream().mapToInt(DailyBucketDto::getSessionCount).sum();
            int activeDays = (int) days.stream().filter(d -> d.getTotalMinutes() > 0).count();
    
            double dailyAvg = activeDays > 0
                    ? Math.round((totalThisWeek * 10.0) / activeDays) / 10.0
                    : 0.0;
    
            // Best day this week
            DailyBucketDto bestDay = days.stream()
                    .max(Comparator.comparingLong(DailyBucketDto::getTotalMinutes))
                    .orElse(days.get(6));
    
            // ── Last week: the 7 days before this week ────────────────────────────
            LocalDate lastWeekEnd   = weekStart.minusDays(1);
            LocalDate lastWeekStart = lastWeekEnd.minusDays(6);
    
            long totalLastWeek = allSessions.stream()
                    .filter(s -> {
                        LocalDate d = s.getStartTime().toLocalDate();
                        return !d.isBefore(lastWeekStart) && !d.isAfter(lastWeekEnd);
                    })
                    .mapToLong(FocusSessions::getDuration)
                    .sum();
    
            // ── Trend direction and percent ───────────────────────────────────────
            String trendDirection;
            int trendPercent;
            String trendLabel;
    
            if (totalLastWeek == 0 && totalThisWeek == 0) {
                trendDirection = "FLAT";
                trendPercent = 0;
                trendLabel = "No data yet";
            } else if (totalLastWeek == 0) {
                trendDirection = "UP";
                trendPercent = 100;
                trendLabel = "First week of data";
            } else {
                double change = ((double)(totalThisWeek - totalLastWeek) / totalLastWeek) * 100;
                trendPercent = (int) Math.abs(Math.round(change));
    
                if (change > 5) {
                    trendDirection = "UP";
                    trendLabel = "+" + trendPercent + "% vs last week";
                } else if (change < -5) {
                    trendDirection = "DOWN";
                    trendLabel = "-" + trendPercent + "% vs last week";
                } else {
                    trendDirection = "FLAT";
                    trendLabel = "About the same as last week";
                }
            }
    
            return new WeeklyTrendDto(
                    days,
                    totalThisWeek, totalLastWeek,
                    totalSessionsThisWeek,
                    trendDirection, trendPercent, trendLabel,
                    bestDay.getTotalMinutes(), bestDay.getFullLabel(),
                    dailyAvg, activeDays
            );
        }
    
    // ── Helpers ───────────────────────────────────────────────────────────────────
    
        private DailyBucketDto buildBucket(LocalDate date,
                                           List<FocusSessions> sessions,
                                           LocalDate today) {
            long totalMinutes = sessions.stream()
                    .mapToLong(FocusSessions::getDuration)
                    .sum();
            int count = sessions.size();
            double avg = count > 0
                    ? Math.round((totalMinutes * 10.0) / count) / 10.0
                    : 0.0;
    
            String dayLabel = date.getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, Locale.ENGLISH);   // "Mon", "Tue"
            String fullLabel = dayLabel + " " + date.format(
                    java.time.format.DateTimeFormatter.ofPattern("MMM d")); // "Mon Apr 14"
    
            return new DailyBucketDto(
                    date, dayLabel, fullLabel,
                    totalMinutes, count, avg,
                    date.equals(today)
            );
        }
        public PersonalRecordsDto getPersonalRecords(Long userId) {

            // Single DB load — everything calculated from this list
            List<FocusSessions> completed = repo.findByUser_Id(userId)
                    .stream()
                    .filter(FocusSessions::isCompleted)
                    .toList();

            if (completed.isEmpty()) {
                return emptyRecords();
            }

            // ── All-time totals ───────────────────────────────────────────────────────
            long allTimeMinutes  = completed.stream()
                    .mapToLong(FocusSessions::getDuration)
                    .sum();
            int allTimeSessions  = completed.size();

            Set<LocalDate> activeDaySet = completed.stream()
                    .map(s -> s.getStartTime().toLocalDate())
                    .collect(Collectors.toSet());
            int allTimeActiveDays = activeDaySet.size();

            // ── Longest single session ────────────────────────────────────────────────
            FocusSessions longestSession = completed.stream()
                    .max(Comparator.comparingLong(FocusSessions::getDuration))
                    .orElseThrow();

            // ── Best day ──────────────────────────────────────────────────────────────
            Map<LocalDate, Long> minutesByDay = completed.stream()
                    .collect(Collectors.groupingBy(
                            s -> s.getStartTime().toLocalDate(),
                            Collectors.summingLong(FocusSessions::getDuration)
                    ));

            LocalDate bestDayDate = minutesByDay.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElseThrow();

            long bestDayMinutes = minutesByDay.get(bestDayDate);

            int bestDaySessionCount = (int) completed.stream()
                    .filter(s -> s.getStartTime().toLocalDate().equals(bestDayDate))
                    .count();

            // ── Best streak ever ──────────────────────────────────────────────────────
            List<LocalDate> sortedDays = activeDaySet.stream()
                    .sorted()
                    .toList();

            int bestStreak   = 1;
            int currentRun   = 1;
            int bestStart    = 0;
            int runStart     = 0;

            for (int i = 1; i < sortedDays.size(); i++) {
                boolean consecutive = sortedDays.get(i)
                        .equals(sortedDays.get(i - 1).plusDays(1));
                if (consecutive) {
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

            // ── Current streak ────────────────────────────────────────────────────────
            LocalDate today = LocalDate.now();
            int currentStreak = 0;
            while (activeDaySet.contains(today.minusDays(currentStreak))) {
                currentStreak++;
            }

            // ── Format dates ──────────────────────────────────────────────────────────
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
        }
    
