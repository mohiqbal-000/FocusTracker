package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Dto.GoalResponseDto;
import com.example.FocusTrackerBackend.Repository.FocusRepository;
import com.example.FocusTrackerBackend.Repository.GoalRepository;
import com.example.FocusTrackerBackend.Repository.UserRepository;
import com.example.FocusTrackerBackend.model.Goal;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GoalService {

    private final UserRepository userRepo;
    private final GoalRepository goalRepo;
    private final FocusRepository focusRepo;

    public GoalService(UserRepository userRepo, GoalRepository goalRepo, FocusRepository focusRepo) {
        this.userRepo = userRepo;
        this.goalRepo = goalRepo;
        this.focusRepo = focusRepo;
    }

    public GoalResponseDto createGoal(Long userId, GoalResponseDto dto) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Goal goal = new Goal();
        goal.setUser(user);
        goal.setGoalType

    }

    public List<GoalResponseDto> getGoals(Long userId) {
    }
}
