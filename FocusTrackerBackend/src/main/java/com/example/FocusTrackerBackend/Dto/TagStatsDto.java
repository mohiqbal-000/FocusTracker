package com.example.FocusTrackerBackend.Dto;

public class TagStatsDto {
    private String tagName;
    private String tagColor;
    private int totalSessions;
    private long totalMinutes;
    private double percentOfTotal;  // share of all focus time

    public TagStatsDto(String tagName, String tagColor,
                       int totalSessions, long totalMinutes, double percentOfTotal) {
        this.tagName = tagName;
        this.tagColor = tagColor;
        this.totalSessions = totalSessions;
        this.totalMinutes = totalMinutes;
        this.percentOfTotal = percentOfTotal;
    }

    public String getTagName() { return tagName; }
    public String getTagColor() { return tagColor; }
    public int getTotalSessions() { return totalSessions; }
    public long getTotalMinutes() { return totalMinutes; }
    public double getPercentOfTotal() { return percentOfTotal; }
}