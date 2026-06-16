package com.example.FocusTrackerBackend.Event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class GoalAchievedListener {

    private static final Logger log = LoggerFactory.getLogger(GoalAchievedListener.class);

    // ── Log the achievement ───────────────────────────────────────────────────
    // Synchronous — always runs, lightweight, no failure risk
    @EventListener
    public void onGoalAchieved(GoalAchievedEvent event) {
        log.info("Goal achieved — userId={} goalId={} type={} target={}min on {}",
                event.getUser().getId(),
                event.getGoal().getId(),
                event.getGoal().getGoalType(),
                event.getGoal().getTargetValue(),
                event.getAchievedOn()
        );
    }

    // ── Send a congratulations email ──────────────────────────────────────────
    // Async — email sending can be slow; don't block the HTTP response
    @Async
    @EventListener
    public void sendCongratulationsEmail(GoalAchievedEvent event) {
        // Wire in your EmailService here when ready
        // emailService.sendGoalAchieved(event.getUser().getEmail(), event.getGoal());
        log.info("Would send congratulations email to {}", event.getUser().getEmail());
    }

    // ── Check and award badges ────────────────────────────────────────────────
    // Async — badge evaluation can involve extra DB lookups
    @Async
    @EventListener
    public void checkBadges(GoalAchievedEvent event) {
        // Wire in your BadgeService here when ready
        // badgeService.evaluateGoalBadges(event.getUser().getId(), event.getGoal());
        log.info("Would evaluate badges for userId={}", event.getUser().getId());
    }

    // ── Send a push notification ──────────────────────────────────────────────
    @Async
    @EventListener
    public void sendPushNotification(GoalAchievedEvent event) {
        // Wire in your PushNotificationService here when ready
        // pushService.notify(event.getUser().getId(), "Goal reached!", ...);
        log.info("Would send push notification to userId={}", event.getUser().getId());
    }
}