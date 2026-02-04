package com.example.FocusTrackerBackend.Dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class GoalRequestDto {
    private String goalType;
    private int targetValue;
    private LocalDate startDate;
    private LocalDate endDate;
}
