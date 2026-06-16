package com.example.FocusTrackerBackend.Dto;

import java.util.List;

public class WeeklyTrendDto {

    private List<DailyBucketDto> days;       // 7 entries, oldest → today

    private long totalMinutesThisWeek;
    private long totalMinutesLastWeek;       // previous 7 days, for comparison

    private int totalSessionsThisWeek;

    private String trendDirection;           // "UP" | "DOWN" | "FLAT"
    private int trendPercent;                // e.g. 23 means +23% vs last week
    private String trendLabel;              // "+23% vs last week"

    private long bestDayMinutes;
    private String bestDayLabel;             // "Wednesday"

    private double dailyAverage;             // average minutes/day this week
    private int activeDays;                  // days with at least one session

    public WeeklyTrendDto(List<DailyBucketDto> days,
                          long totalMinutesThisWeek, long totalMinutesLastWeek,
                          int totalSessionsThisWeek,
                          String trendDirection, int trendPercent, String trendLabel,
                          long bestDayMinutes, String bestDayLabel,
                          double dailyAverage, int activeDays) {
        this.days = days;
        this.totalMinutesThisWeek = totalMinutesThisWeek;
        this.totalMinutesLastWeek = totalMinutesLastWeek;
        this.totalSessionsThisWeek = totalSessionsThisWeek;
        this.trendDirection = trendDirection;
        this.trendPercent = trendPercent;
        this.trendLabel = trendLabel;
        this.bestDayMinutes = bestDayMinutes;
        this.bestDayLabel = bestDayLabel;
        this.dailyAverage = dailyAverage;
        this.activeDays = activeDays;
    }

    public List<DailyBucketDto> getDays() { return days; }
    public long getTotalMinutesThisWeek() { return totalMinutesThisWeek; }
    public long getTotalMinutesLastWeek() { return totalMinutesLastWeek; }
    public int getTotalSessionsThisWeek() { return totalSessionsThisWeek; }
    public String getTrendDirection() { return trendDirection; }
    public int getTrendPercent() { return trendPercent; }
    public String getTrendLabel() { return trendLabel; }
    public long getBestDayMinutes() { return bestDayMinutes; }
    public String getBestDayLabel() { return bestDayLabel; }
    public double getDailyAverage() { return dailyAverage; }
    public int getActiveDays() { return activeDays; }
}