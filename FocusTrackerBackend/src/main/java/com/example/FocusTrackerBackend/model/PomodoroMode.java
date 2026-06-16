package com.example.FocusTrackerBackend.model;

public enum PomodoroMode {
    POMODORO(25, 5),
    LONG_BREAK(25, 15),
    CUSTOM(0, 0);          // durations set by user

    private final int workMinutes;
    private final int breakMinutes;

    PomodoroMode(int workMinutes, int breakMinutes) {
        this.workMinutes = workMinutes;
        this.breakMinutes = breakMinutes;
    }

    public int getWorkMinutes()  { return workMinutes; }
    public int getBreakMinutes() { return breakMinutes; }
}