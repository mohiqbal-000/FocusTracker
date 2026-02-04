package com.example.FocusTrackerBackend.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GoalResponseDto {
    private Long id;
    private String goalType;
    private int targetValue;
    private int progressValue;
    private boolean achieved;

}
