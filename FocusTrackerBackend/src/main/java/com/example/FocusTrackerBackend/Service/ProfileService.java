package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Dto.ProfileRequestDto;
import com.example.FocusTrackerBackend.Dto.ProfileResponseDto;
import com.example.FocusTrackerBackend.Repository.UserRepository;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;

@Service
public class ProfileService {

    private final UserRepository userRepo;

    public ProfileService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    // ── Get profile ───────────────────────────────────────────────────────────

    public ProfileResponseDto getProfile(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDto(user);
    }

    // ── Update profile ────────────────────────────────────────────────────────

    public ProfileResponseDto updateProfile(Long userId, ProfileRequestDto dto) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getDisplayName() != null && !dto.getDisplayName().isBlank()) {
            user.setDisplayName(dto.getDisplayName().trim());
        }

        if (dto.getTimezone() != null && !dto.getTimezone().isBlank()) {
            validateTimezone(dto.getTimezone());
            user.setTimezone(dto.getTimezone().trim());
        }

        if (dto.getAvatarUrl() != null) {
            // Allow empty string to clear the avatar
            user.setAvatarUrl(dto.getAvatarUrl().isBlank() ? null : dto.getAvatarUrl().trim());
        }

        return toDto(userRepo.save(user));
    }

    // ── Timezone validation ───────────────────────────────────────────────────

    public void validateTimezone(String timezone) {
        try {
            ZoneId.of(timezone);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Invalid timezone '" + timezone + "'. " +
                            "Use an IANA timezone ID e.g. 'Asia/Kolkata', 'America/New_York', 'Europe/London'."
            );
        }
    }

    // ── Helper: resolve user's current local date ─────────────────────────────
    // Used by FocusSessionsService to fix daily/streak calculations

    public ZoneId resolveZone(User user) {
        try {
            return ZoneId.of(user.getTimezone());
        } catch (Exception e) {
            return ZoneId.of("UTC");   // safe fallback
        }
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private ProfileResponseDto toDto(User user) {
        String offset = buildOffsetLabel(user.getTimezone());
        return new ProfileResponseDto(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getTimezone(),
                user.getAvatarUrl(),
                offset
        );
    }

    // Converts "Asia/Kolkata" → "UTC+05:30"
    private String buildOffsetLabel(String timezone) {
        try {
            ZoneOffset offset = ZoneId.of(timezone)
                    .getRules()
                    .getOffset(ZonedDateTime.now().toInstant());
            String formatted = offset.toString();                // "+05:30" or "Z"
            return "Z".equals(formatted) ? "UTC" : "UTC" + formatted;
        } catch (Exception e) {
            return "UTC";
        }
    }
}