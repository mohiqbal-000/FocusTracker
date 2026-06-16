package com.example.FocusTrackerBackend.Dto;

import jakarta.validation.constraints.Size;

public class ProfileRequestDto {

    @Size(max = 50, message = "Display name must be 50 characters or fewer")
    private String displayName;

    private String timezone;    // validated in service against ZoneId

    @Size(max = 500, message = "Avatar URL must be 500 characters or fewer")
    private String avatarUrl;

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}