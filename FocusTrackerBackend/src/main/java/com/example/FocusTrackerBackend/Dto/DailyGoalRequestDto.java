package com.example.FocusTrackerBackend.Dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class DailyGoalRequestDto {

    @Min(value = 1, message = "Target must be at least 1 minute")
    @Max(value = 1440, message = "Target cannot exceed 1440 minutes (24 hours)")
    private int targetMinutes;

    private boolean notifyOnComplete = false;

    public int getTargetMinutes() { return targetMinutes; }
    public void setTargetMinutes(int targetMinutes) { this.targetMinutes = targetMinutes; }

    public boolean isNotifyOnComplete() { return notifyOnComplete; }
    public void setNotifyOnComplete(boolean notifyOnComplete) {
        this.notifyOnComplete = notifyOnComplete;
    }
}