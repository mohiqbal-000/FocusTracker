package com.example.FocusTrackerBackend.model;


import jakarta.persistence.*;

import java.time.LocalDateTime;
@Entity
@Table(name = "focus_sessions")
public class FocusSessions {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long duration;
    private boolean completed;
    @ManyToOne
    @JoinColumn(name = "user_id",nullable = false)
    private User user;
    @Enumerated(EnumType.STRING)
    private PomodoroMode mode = PomodoroMode.POMODORO;
    private Integer customWorkMinutes;    // only used when mode = CUSTOM
    private Integer customBreakMinutes;

    private String note;                  // optional post-session note

    private boolean breakStarted = false;
    private LocalDateTime breakStartTime;
    private LocalDateTime breakEndTime;


    public FocusSessions() {
    }

    public PomodoroMode getMode() {
        return mode;
    }

    public void setMode(PomodoroMode mode) {
        this.mode = mode;
    }

    public Integer getCustomWorkMinutes() {
        return customWorkMinutes;
    }

    public void setCustomWorkMinutes(Integer customWorkMinutes) {
        this.customWorkMinutes = customWorkMinutes;
    }

    public Integer getCustomBreakMinutes() {
        return customBreakMinutes;
    }

    public void setCustomBreakMinutes(Integer customBreakMinutes) {
        this.customBreakMinutes = customBreakMinutes;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public boolean isBreakStarted() {
        return breakStarted;
    }

    public void setBreakStarted(boolean breakStarted) {
        this.breakStarted = breakStarted;
    }

    public LocalDateTime getBreakStartTime() {
        return breakStartTime;
    }

    public void setBreakStartTime(LocalDateTime breakStartTime) {
        this.breakStartTime = breakStartTime;
    }

    public LocalDateTime getBreakEndTime() {
        return breakEndTime;
    }

    public void setBreakEndTime(LocalDateTime breakEndTime) {
        this.breakEndTime = breakEndTime;
    }

    public long getId() {
        return id;
    }

    public FocusSessions(User user, LocalDateTime startTime, PomodoroMode mode,
                         Integer customWorkMinutes, Integer customBreakMinutes) {
        this.user = user;
        this.startTime = startTime;
        this.mode = mode;
        this.customWorkMinutes = customWorkMinutes;
        this.customBreakMinutes = customBreakMinutes;
        this.duration = 0;
        this.completed = false;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setId(long id) {
        this.id = id;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public long getDuration() {
        return duration;
    }

    public void setDuration(long duration) {
        this.duration = duration;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
