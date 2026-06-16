package com.example.FocusTrackerBackend.Dto;

public class ProfileResponseDto {

    private long id;
    private String email;
    private String displayName;
    private String timezone;
    private String avatarUrl;
    private String timezoneOffset;  // e.g. "UTC+05:30" — useful for display

    public ProfileResponseDto(long id, String email, String displayName,
                              String timezone, String avatarUrl, String timezoneOffset) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.timezone = timezone;
        this.avatarUrl = avatarUrl;
        this.timezoneOffset = timezoneOffset;
    }

    public long getId() { return id; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
    public String getTimezone() { return timezone; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getTimezoneOffset() { return timezoneOffset; }
}