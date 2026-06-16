package com.example.FocusTrackerBackend.Dto;

public class HourlyBucketDto {

    private int hour;               // 0–23
    private String label;           // "9 AM", "2 PM" etc.
    private long totalMinutes;      // total focus minutes in this hour slot
    private int sessionCount;       // number of sessions that started in this slot
    private double avgMinutes;      // average session length for this slot
    private int intensityLevel;     // 0–4, for heatmap coloring on the frontend

    public HourlyBucketDto(int hour, String label, long totalMinutes,
                           int sessionCount, double avgMinutes, int intensityLevel) {
        this.hour = hour;
        this.label = label;
        this.totalMinutes = totalMinutes;
        this.sessionCount = sessionCount;
        this.avgMinutes = avgMinutes;
        this.intensityLevel = intensityLevel;
    }

    public int getHour() { return hour; }
    public String getLabel() { return label; }
    public long getTotalMinutes() { return totalMinutes; }
    public int getSessionCount() { return sessionCount; }
    public double getAvgMinutes() { return avgMinutes; }
    public int getIntensityLevel() { return intensityLevel; }
}