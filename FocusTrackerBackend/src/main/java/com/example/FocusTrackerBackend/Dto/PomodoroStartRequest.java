package com.example.FocusTrackerBackend.Dto;

import com.example.FocusTrackerBackend.model.PomodoroMode;

public class PomodoroStartRequest {

    private PomodoroMode mode = PomodoroMode.POMODORO;  // defaults to standard
    private Integer customWorkMinutes;                   // required if mode = CUSTOM
    private Integer customBreakMinutes;                  // required if mode = CUSTOM

    public PomodoroMode getMode() { return mode; }
    public void setMode(PomodoroMode mode) { this.mode = mode; }

    public Integer getCustomWorkMinutes() { return customWorkMinutes; }
    public void setCustomWorkMinutes(Integer m) { this.customWorkMinutes = m; }

    public Integer getCustomBreakMinutes() { return customBreakMinutes; }
    public void setCustomBreakMinutes(Integer m) { this.customBreakMinutes = m; }
}