package com.example.FocusTrackerBackend.Dto;

public class PersonalRecordsDto {

    private long longestSessionMinutes;
    private String longestSessionDate;

    private long bestDayMinutes;
    private String bestDayDate;
    private int bestDaySessionCount;

    private int bestStreakDays;
    private String bestStreakStart;
    private String bestStreakEnd;

    private int currentStreakDays;

    private long allTimeMinutes;
    private int allTimeSessions;
    private int allTimeActiveDays;

    public PersonalRecordsDto(long longestSessionMinutes, String longestSessionDate,
                              long bestDayMinutes, String bestDayDate, int bestDaySessionCount,
                              int bestStreakDays, String bestStreakStart, String bestStreakEnd,
                              int currentStreakDays,
                              long allTimeMinutes, int allTimeSessions, int allTimeActiveDays) {
        this.longestSessionMinutes = longestSessionMinutes;
        this.longestSessionDate    = longestSessionDate;
        this.bestDayMinutes        = bestDayMinutes;
        this.bestDayDate           = bestDayDate;
        this.bestDaySessionCount   = bestDaySessionCount;
        this.bestStreakDays        = bestStreakDays;
        this.bestStreakStart       = bestStreakStart;
        this.bestStreakEnd         = bestStreakEnd;
        this.currentStreakDays     = currentStreakDays;
        this.allTimeMinutes        = allTimeMinutes;
        this.allTimeSessions       = allTimeSessions;
        this.allTimeActiveDays     = allTimeActiveDays;
    }

    public long getLongestSessionMinutes()  { return longestSessionMinutes; }
    public String getLongestSessionDate()   { return longestSessionDate; }
    public long getBestDayMinutes()         { return bestDayMinutes; }
    public String getBestDayDate()          { return bestDayDate; }
    public int getBestDaySessionCount()     { return bestDaySessionCount; }
    public int getBestStreakDays()          { return bestStreakDays; }
    public String getBestStreakStart()      { return bestStreakStart; }
    public String getBestStreakEnd()        { return bestStreakEnd; }
    public int getCurrentStreakDays()       { return currentStreakDays; }
    public long getAllTimeMinutes()          { return allTimeMinutes; }
    public int getAllTimeSessions()          { return allTimeSessions; }
    public int getAllTimeActiveDays()        { return allTimeActiveDays; }
}