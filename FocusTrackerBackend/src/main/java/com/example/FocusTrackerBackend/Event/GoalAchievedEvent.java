package com.example.FocusTrackerBackend.Event;

import com.example.FocusTrackerBackend.model.Goal;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDate;

public class GoalAchievedEvent extends ApplicationEvent {

    private final User user;
    private final Goal goal;
    private final LocalDate achievedOn;

    public GoalAchievedEvent(Object source, User user, Goal goal) {
        super(source);
        this.user = user;
        this.goal = goal;
        this.achievedOn = LocalDate.now();
    }

    public User getUser() { return user; }
    public Goal getGoal() { return goal; }
    public LocalDate getAchievedOn() { return achievedOn; }
}