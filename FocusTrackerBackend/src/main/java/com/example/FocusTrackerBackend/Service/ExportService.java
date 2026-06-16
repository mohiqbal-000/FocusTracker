package com.example.FocusTrackerBackend.Service;


import com.example.FocusTrackerBackend.Repository.FocusRepository;
import com.example.FocusTrackerBackend.Repository.GoalRepository;
import com.example.FocusTrackerBackend.model.FocusSessions;
import com.example.FocusTrackerBackend.model.Goal;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ExportService {

    private final GoalRepository goalRepository;
    private final FocusRepository sessionsRepository;

    public ExportService(GoalRepository goalRepository,FocusRepository sessionsRepository){
        this.goalRepository = goalRepository;
        this.sessionsRepository =sessionsRepository;

    }
    public List<Goal> getUserGoals(Long userId){
        return goalRepository.findByUser_id(userId);


    }
    public List<FocusSessions> getUserFocusSessions(Long userId,
                                                   LocalDate from,
                                                    LocalDate to) {

        if (from != null && to != null) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.atTime(23, 59, 59);

        return sessionsRepository.findByUser_IdAndStartTimeBetween(userId, start, end);
        }
        return sessionsRepository.findByUser_Id(userId);
    }




}
