package com.example.FocusTrackerBackend.Controller;

import com.example.FocusTrackerBackend.Dto.GoalRequestDto;
import com.example.FocusTrackerBackend.Dto.GoalResponseDto;
import com.example.FocusTrackerBackend.Repository.GoalRepository;
import com.example.FocusTrackerBackend.Service.GoalService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/Goals")
public class GoalContoller {

    private final GoalService service;

    public GoalContoller(GoalService service) {
        this.service = service;
    }

    @PostMapping("/{userId}")
    public GoalResponseDto createGoal(@PathVariable Long userId, @RequestBody GoalRequestDto dto){

        return service.createGoal(userId,dto);
    }
    public List<GoalResponseDto> getGoals(@PathVariable Long userId){
       return service.getGoals(userId);
}



}
