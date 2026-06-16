package com.example.FocusTrackerBackend.Dto;

import java.time.LocalDate;

public class DailyBucketDto {

    private LocalDate date;
    private String dayLabel;        // "Mon", "Tue" etc.
    private String fullLabel;       // "Mon Apr 14" — for chart tooltips
    private long totalMinutes;
    private int sessionCount;
    private double avgSessionMinutes;
    private boolean isToday;

    public DailyBucketDto(LocalDate date, String dayLabel, String fullLabel,
                          long totalMinutes, int sessionCount,
                          double avgSessionMinutes, boolean isToday) {
        this.date = date;
        this.dayLabel = dayLabel;
        this.fullLabel = fullLabel;
        this.totalMinutes = totalMinutes;
        this.sessionCount = sessionCount;
        this.avgSessionMinutes = avgSessionMinutes;
        this.isToday = isToday;
    }

    public LocalDate getDate() { return date; }
    public String getDayLabel() { return dayLabel; }
    public String getFullLabel() { return fullLabel; }
    public long getTotalMinutes() { return totalMinutes; }
    public int getSessionCount() { return sessionCount; }
    public double getAvgSessionMinutes() { return avgSessionMinutes; }
    public boolean isToday() { return isToday; }
}