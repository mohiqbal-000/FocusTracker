package com.example.FocusTrackerBackend.Controller;

import com.example.FocusTrackerBackend.Dto.ProfileRequestDto;
import com.example.FocusTrackerBackend.Dto.ProfileResponseDto;
import com.example.FocusTrackerBackend.Security.CustomUserDetails;
import com.example.FocusTrackerBackend.Service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponseDto> getProfile(Authentication authentication) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PutMapping
    public ResponseEntity<ProfileResponseDto> updateProfile(
            @RequestBody @Valid ProfileRequestDto dto,
            Authentication authentication) {
        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(profileService.updateProfile(userId, dto));
    }

    private Long extractUserId(Authentication authentication) {
        return ((CustomUserDetails) authentication.getPrincipal()).getId();
    }
    
}