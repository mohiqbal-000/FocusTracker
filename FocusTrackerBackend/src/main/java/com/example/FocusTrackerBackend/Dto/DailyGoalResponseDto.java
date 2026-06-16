package com.example.FocusTrackerBackend.Dto;

public class DailyGoalResponseDto {

    private int targetMinutes;
    private boolean notifyOnComplete;

    public DailyGoalResponseDto(int targetMinutes, boolean notifyOnComplete) {
        this.targetMinutes = targetMinutes;
        this.notifyOnComplete = notifyOnComplete;
    }

    public int getTargetMinutes() { return targetMinutes; }
    public boolean isNotifyOnComplete() { return notifyOnComplete; }
}