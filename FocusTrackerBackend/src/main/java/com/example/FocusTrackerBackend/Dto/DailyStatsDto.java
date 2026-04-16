package com.example.FocusTrackerBackend.Dto;

public class DailyStatsDto {
    private long totalMinutes;
    private int totalSessions;

    private Integer targetMinutes;
    private Integer progressPercent;      // 0–100, capped at 100
    private long remainingMinutes;        // minutes left to hit the goal; 0 if exceeded
    private boolean goalSet;
    private boolean goalAchieved;

    // Constructor used when no goal exists
    public DailyStatsDto(long totalMinutes, int totalSessions) {
        this.totalMinutes = totalMinutes;
        this.totalSessions = totalSessions;
        this.goalSet = false;
        this.goalAchieved = false;
    }
    // Constructor used when a goal exists
    public DailyStatsDto(long totalMinutes, int totalSessions,
                         int targetMinutes, int progressPercent,
                         long remainingMinutes, boolean goalAchieved) {
        this.totalMinutes = totalMinutes;
        this.totalSessions = totalSessions;
        this.targetMinutes = targetMinutes;
        this.progressPercent = progressPercent;
        this.remainingMinutes = remainingMinutes;
        this.goalSet = true;
        this.goalAchieved = goalAchieved;
    }

    public long getTotalMinutes() {
        return totalMinutes;
    }
    public int getTotalSessions() {
        return totalSessions;
    }
    public Integer getTargetMinutes() { return targetMinutes; }
    public Integer getProgressPercent() { return progressPercent; }
    public long getRemainingMinutes() { return remainingMinutes; }
    public boolean isGoalSet() { return goalSet; }
    public boolean isGoalAchieved() { return goalAchieved; }
}
