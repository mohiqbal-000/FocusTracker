package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Dto.DailyGoalRequestDto;
import com.example.FocusTrackerBackend.Dto.DailyGoalResponseDto;
import com.example.FocusTrackerBackend.Repository.DailyGoalRepository;
import com.example.FocusTrackerBackend.Repository.UserRepository;
import com.example.FocusTrackerBackend.model.DailyGoal;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DailyGoalService {

    private final DailyGoalRepository dailyGoalRepo;
    private final UserRepository userRepo;

    public DailyGoalService(DailyGoalRepository dailyGoalRepo, UserRepository userRepo) {
        this.dailyGoalRepo = dailyGoalRepo;
        this.userRepo = userRepo;
    }

    // ── Set or update the daily goal ─────────────────────────────────────────

    public DailyGoalResponseDto setGoal(Long userId, DailyGoalRequestDto dto) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update existing goal or create a new one
        DailyGoal goal = dailyGoalRepo.findByUser_Id(userId)
                .orElse(new DailyGoal());

        goal.setUser(user);
        goal.setTargetMinutes(dto.getTargetMinutes());
        goal.setNotifyOnComplete(dto.isNotifyOnComplete());

        DailyGoal saved = dailyGoalRepo.save(goal);
        return toDto(saved);
    }

    // ── Get current goal setting ──────────────────────────────────────────────

    public DailyGoalResponseDto getGoal(Long userId) {
        DailyGoal goal = dailyGoalRepo.findByUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("No daily goal set"));
        return toDto(goal);
    }

    // ── Delete the daily goal ─────────────────────────────────────────────────

    public void deleteGoal(Long userId) {
        DailyGoal goal = dailyGoalRepo.findByUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("No daily goal to delete"));
        dailyGoalRepo.delete(goal);
    }

    // ── Resolve goal for progress calculation (used by FocusSessionsService) ─

    public Optional<DailyGoal> findGoal(Long userId) {
        return dailyGoalRepo.findByUser_Id(userId);
    }

    private DailyGoalResponseDto toDto(DailyGoal goal) {
        return new DailyGoalResponseDto(
                goal.getTargetMinutes(),
                goal.isNotifyOnComplete()
        );
    }
}