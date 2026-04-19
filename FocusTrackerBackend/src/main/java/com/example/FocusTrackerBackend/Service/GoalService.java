package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Dto.GoalRequestDto;
import com.example.FocusTrackerBackend.Dto.GoalResponseDto;
import com.example.FocusTrackerBackend.Event.GoalAchievedEvent;
import com.example.FocusTrackerBackend.Repository.FocusRepository;
import com.example.FocusTrackerBackend.Repository.GoalRepository;
import com.example.FocusTrackerBackend.Repository.UserRepository;
import com.example.FocusTrackerBackend.model.FocusSessions;
import com.example.FocusTrackerBackend.model.Goal;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class GoalService {

    private final UserRepository userRepo;
    private final GoalRepository goalRepo;
    private final FocusRepository focusRepo;
    private final ApplicationEventPublisher eventPublisher;

    public GoalService(UserRepository userRepo, GoalRepository goalRepo,
                       FocusRepository focusRepo,
                       ApplicationEventPublisher eventPublisher) {
        this.userRepo = userRepo;
        this.goalRepo = goalRepo;
        this.focusRepo = focusRepo;
        this.eventPublisher = eventPublisher;
    }

    public GoalResponseDto createGoal(Long userId, GoalRequestDto dto) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Goal goal = new Goal();
        goal.setUser(user);
        goal.setGoalType(dto.getGoalType());
        goal.setTargetValue(dto.getTargetValue());
        goal.setStartDate(dto.getStartDate());
        goal.setEndDate(dto.getEndDate());
        goal.setProgressValue(0);

        Goal saved = goalRepo.save(goal);   // use returned entity for generated ID

        return new GoalResponseDto(
                saved.getId(),
                saved.getGoalType(),
                saved.getTargetValue(),
                saved.getProgressValue(),
                saved.isAchieved()
        );
    }

    public List<GoalResponseDto> updateGoalProgress(Long userId) {
        List<Goal> goals = goalRepo.findByUser_id(userId);
        List<FocusSessions> sessions = focusRepo.findByUser_Id(userId);

        for (Goal goal : goals) {
            // Skip already-achieved goals — avoids re-firing the event
            if (goal.isAchieved()) continue;

            // Skip goals that haven't started yet
            if (LocalDate.now().isBefore(goal.getStartDate())) continue;

            long totalMinutes = sessions.stream()
                    .filter(s -> !s.getStartTime().toLocalDate()
                            .isBefore(goal.getStartDate()) &&
                            !s.getStartTime().toLocalDate()
                                    .isAfter(goal.getEndDate()))
                    .mapToLong(FocusSessions::getDuration)
                    .sum();

            // Safe cast — clamp to avoid int overflow
            goal.setProgressValue((int) Math.min(totalMinutes, Integer.MAX_VALUE));

            if (totalMinutes >= goal.getTargetValue()) {
                goal.setAchieved(true);
            }
        }

        goalRepo.saveAll(goals);   // single batch save instead of N individual saves

        // Fire events after saving so goal IDs and state are fully persisted
        for (Goal goal : goals) {
            if (goal.isAchieved()) {
                eventPublisher.publishEvent(
                        new GoalAchievedEvent(this, goal.getUser(), goal)
                );
            }
        }

        return goals.stream()
                .map(g -> new GoalResponseDto(
                        g.getId(),
                        g.getGoalType(),
                        g.getTargetValue(),
                        g.getProgressValue(),
                        g.isAchieved()
                ))
                .toList();
    }

    public List<GoalResponseDto> getGoals(Long userId) {
        return updateGoalProgress(userId);   // single DB round trip, no duplicate call
    }
}