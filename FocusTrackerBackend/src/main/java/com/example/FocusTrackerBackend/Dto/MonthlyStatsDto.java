package com.example.FocusTrackerBackend.Dto;

public class MonthlyStatsDto {

    private long totalMinutes;
    private int totalSessions;


    public MonthlyStatsDto(long totalMinutes, int totalSessions) {
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
