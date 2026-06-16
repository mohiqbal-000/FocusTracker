package com.example.FocusTrackerBackend.Controller;

import com.example.FocusTrackerBackend.Dto.DailyGoalRequestDto;
import com.example.FocusTrackerBackend.Dto.DailyGoalResponseDto;
import com.example.FocusTrackerBackend.Security.CustomUserDetails;
import com.example.FocusTrackerBackend.Service.DailyGoalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/daily-goal")
public class DailyGoalController {

    private final DailyGoalService dailyGoalService;

    public DailyGoalController(DailyGoalService dailyGoalService) {
        this.dailyGoalService = dailyGoalService;
    }

    @PutMapping
    public ResponseEntity<DailyGoalResponseDto> setGoal(
            @RequestBody @Valid DailyGoalRequestDto dto,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(dailyGoalService.setGoal(userId, dto));
    }

    @GetMapping
    public ResponseEntity<DailyGoalResponseDto> getGoal(Authentication authentication) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(dailyGoalService.getGoal(userId));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteGoal(Authentication authentication) {
        Long userId = extractUserId(authentication);
        dailyGoalService.deleteGoal(userId);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserId(Authentication authentication) {
        return ((CustomUserDetails) authentication.getPrincipal()).getId();
    }
}