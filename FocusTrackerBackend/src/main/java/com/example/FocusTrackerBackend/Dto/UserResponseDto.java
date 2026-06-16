package com.example.FocusTrackerBackend.Dto;

public class UserResponseDto {
    private long id;
    private String email;

    public UserResponseDto(long id, String email) {
        this.id = id;
        this.email = email;
    }

    public long getId() { return id; }
    public String getEmail() { return email; }
}
