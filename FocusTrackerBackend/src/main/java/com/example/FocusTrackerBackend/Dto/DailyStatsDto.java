package com.example.FocusTrackerBackend.Dto;

public class DailyStatsDto {
    private long totalMinutes;
    private int totalSessions;

    public DailyStatsDto(long totalMinutes, int totalSessions) {
        this.totalMinutes = totalMinutes;
        this.totalSessions = totalSessions;
    }

    public long getTotalMinutes() {
        return totalMinutes;
    }


    public int getTotalSessions() {
        return totalSessions;
    }

}
