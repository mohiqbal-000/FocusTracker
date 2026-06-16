package com.example.FocusTrackerBackend.Dto;

import com.example.FocusTrackerBackend.model.PomodoroMode;

import java.time.LocalDateTime;

public class PomodoroSessionDto {

    private Long id;
    private PomodoroMode mode;
    private int workMinutes;
    private int breakMinutes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime breakStartTime;
    private LocalDateTime breakEndTime;
    private long focusDuration;       // minutes of actual focus
    private long breakDuration;       // minutes of break taken
    private boolean completed;
    private boolean breakStarted;
    private String note;
    private String status;            // "FOCUSING" | "ON_BREAK" | "COMPLETED"
    private int focusProgressPercent; // 0-100, how far through the work block
    private int breakProgressPercent; // 0-100, how far through the break

    public PomodoroSessionDto(Long id, PomodoroMode mode, int workMinutes, int breakMinutes,
                              LocalDateTime startTime, LocalDateTime endTime,
                              LocalDateTime breakStartTime, LocalDateTime breakEndTime,
                              long focusDuration, long breakDuration,
                              boolean completed, boolean breakStarted,
                              String note, String status,
                              int focusProgressPercent, int breakProgressPercent) {
        this.id = id;
        this.mode = mode;
        this.workMinutes = workMinutes;
        this.breakMinutes = breakMinutes;
        this.startTime = startTime;
        this.endTime = endTime;
        this.breakStartTime = breakStartTime;
        this.breakEndTime = breakEndTime;
        this.focusDuration = focusDuration;
        this.breakDuration = breakDuration;
        this.completed = completed;
        this.breakStarted = breakStarted;
        this.note = note;
        this.status = status;
        this.focusProgressPercent = focusProgressPercent;
        this.breakProgressPercent = breakProgressPercent;
    }

    // Getters
    public Long getId() { return id; }
    public PomodoroMode getMode() { return mode; }
    public int getWorkMinutes() { return workMinutes; }
    public int getBreakMinutes() { return breakMinutes; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public LocalDateTime getBreakStartTime() { return breakStartTime; }
    public LocalDateTime getBreakEndTime() { return breakEndTime; }
    public long getFocusDuration() { return focusDuration; }
    public long getBreakDuration() { return breakDuration; }
    public boolean isCompleted() { return completed; }
    public boolean isBreakStarted() { return breakStarted; }
    public String getNote() { return note; }
    public String getStatus() { return status; }
    public int getFocusProgressPercent() { return focusProgressPercent; }
    public int getBreakProgressPercent() { return breakProgressPercent; }
}