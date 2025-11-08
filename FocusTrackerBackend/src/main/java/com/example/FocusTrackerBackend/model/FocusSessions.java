package com.example.FocusTrackerBackend.model;


import jakarta.persistence.*;

import java.time.LocalDateTime;
@Entity
@Table(name = "focus_sessions")
public class FocusSessions {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private long userId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long duration;
    private boolean completed;

    public FocusSessions() {
    }

    public long getUserId() {
        return userId;
    }


    public void setUserId(long userId) {
        this.userId = userId;
    }

    public long getId() {
        return id;
    }

    public FocusSessions( long userId, LocalDateTime startTime) {
        this.userId = userId;
        this.startTime = startTime;
        this.duration = 0;
        this.completed = false;
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
