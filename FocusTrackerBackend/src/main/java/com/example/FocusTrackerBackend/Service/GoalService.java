package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Dto.GoalRequestDto;
import com.example.FocusTrackerBackend.Dto.GoalResponseDto;
import com.example.FocusTrackerBackend.Repository.FocusRepository;
import com.example.FocusTrackerBackend.Repository.GoalRepository;
import com.example.FocusTrackerBackend.Repository.UserRepository;
import com.example.FocusTrackerBackend.model.FocusSessions;
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
        goalRepo.save(goal);
        return new GoalResponseDto(
                goal.getId(),
                goal.getGoalType(),
                goal.getTargetValue(),
                goal.getProgressValue(),
                goal.isAchieved()
        );
    }

    public void updateGoalProgress(Long userId){

        List<Goal> goals = goalRepo.findByUser_id(userId);

        List<FocusSessions> sessions = focusRepo.findByUser_Id(userId);
        for(Goal goal: goals){
            long totalMinutes = sessions.stream()
                    .filter(s->!s.getStartTime().toLocalDate().isBefore(goal.getStartDate()) &&
                        !s.getStartTime().toLocalDate().isAfter(goal.getEndDate()))
                    .mapToLong(FocusSessions::getDuration)
                    .sum();
            goal.setProgressValue((int) totalMinutes);
            if(totalMinutes >= goal.getTargetValue()){
                goal.setAchieved(true);
            }
            goalRepo.save(goal);


        }

    }

    public List<GoalResponseDto> getGoals(Long userId) {
        updateGoalProgress(userId);

        return goalRepo.findByUser_id(userId).stream()
                .map(g-> new GoalResponseDto(
                        g.getId(),
                        g.getGoalType(),
                        g.getTargetValue(),
                        g.getProgressValue(),
                        g.isAchieved()
                ))
                .toList();

    }
}
