package com.example.FocusTrackerBackend.Controller;

import com.example.FocusTrackerBackend.Dto.GoalRequestDto;
import com.example.FocusTrackerBackend.Dto.GoalResponseDto;
import com.example.FocusTrackerBackend.Repository.GoalRepository;
import com.example.FocusTrackerBackend.Security.CustomUserDetails;
import com.example.FocusTrackerBackend.Service.GoalService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/Goals")
public class GoalContoller {

    private final GoalService service;

    public GoalContoller(GoalService service) {
        this.service = service;
    }

    @PostMapping
    public GoalResponseDto createGoal(Authentication authentication, @RequestBody GoalRequestDto dto){
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getId();
        return service.createGoal(userId, dto);
    }

    @GetMapping
    public List<GoalResponseDto> getGoals(Authentication authentication){
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getId();
        return service.getGoals(userId);
    }


}
