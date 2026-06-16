package com.example.FocusTrackerBackend.Dto;

import java.util.List;

public class BestHoursDto {

    private List<HourlyBucketDto> allHours;   // all 24 slots, always present
    private List<HourlyBucketDto> topHours;   // top 3 by totalMinutes
    private String peakPeriod;                // "morning" | "afternoon" | "evening" | "night"
    private String insight;                   // human-readable summary sentence
    private int totalSessionsAnalysed;

    public BestHoursDto(List<HourlyBucketDto> allHours, List<HourlyBucketDto> topHours,
                        String peakPeriod, String insight, int totalSessionsAnalysed) {
        this.allHours = allHours;
        this.topHours = topHours;
        this.peakPeriod = peakPeriod;
        this.insight = insight;
        this.totalSessionsAnalysed = totalSessionsAnalysed;
    }

    public List<HourlyBucketDto> getAllHours() { return allHours; }
    public List<HourlyBucketDto> getTopHours() { return topHours; }
    public String getPeakPeriod() { return peakPeriod; }
    public String getInsight() { return insight; }
    public int getTotalSessionsAnalysed() { return totalSessionsAnalysed; }
}