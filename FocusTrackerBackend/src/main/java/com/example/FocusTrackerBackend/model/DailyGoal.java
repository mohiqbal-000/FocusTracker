package com.example.FocusTrackerBackend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "daily_goals")
public class DailyGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;                  // one goal setting per user

    private int targetMinutes;          // e.g. 120

    private boolean notifyOnComplete;   // optional — for future push notification

    public DailyGoal() {}

    public DailyGoal(User user, int targetMinutes, boolean notifyOnComplete) {
        this.user = user;
        this.targetMinutes = targetMinutes;
        this.notifyOnComplete = notifyOnComplete;
    }

    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public int getTargetMinutes() { return targetMinutes; }
    public void setTargetMinutes(int targetMinutes) { this.targetMinutes = targetMinutes; }

    public boolean isNotifyOnComplete() { return notifyOnComplete; }
    public void setNotifyOnComplete(boolean notifyOnComplete) {
        this.notifyOnComplete = notifyOnComplete;
    }
}