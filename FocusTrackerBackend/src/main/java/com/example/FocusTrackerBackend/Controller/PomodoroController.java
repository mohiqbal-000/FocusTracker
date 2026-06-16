package com.example.FocusTrackerBackend.Controller;

import com.example.FocusTrackerBackend.Dto.PomodoroSessionDto;
import com.example.FocusTrackerBackend.Dto.PomodoroStartRequest;
import com.example.FocusTrackerBackend.Security.CustomUserDetails;
import com.example.FocusTrackerBackend.Service.PomodoroService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/pomodoro")
public class PomodoroController {

    private final PomodoroService pomodoroService;

    public PomodoroController(PomodoroService pomodoroService) {
        this.pomodoroService = pomodoroService;
    }

    @PostMapping("/start")
    public ResponseEntity<PomodoroSessionDto> start(
            Authentication authentication,
            @RequestBody(required = false) PomodoroStartRequest request) {

        Long userId = extractUserId(authentication);

        // If no body sent, default to standard Pomodoro
        if (request == null) request = new PomodoroStartRequest();

        return ResponseEntity.ok(pomodoroService.startSession(userId, request));
    }

    @PutMapping("/stop/{sessionId}")
    public ResponseEntity<PomodoroSessionDto> stopFocus(
            @PathVariable Long sessionId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        String note = body != null ? body.get("note") : null;

        return ResponseEntity.ok(pomodoroService.stopFocus(sessionId, userId, note));
    }

    @PutMapping("/end-break/{sessionId}")
    public ResponseEntity<PomodoroSessionDto> endBreak(
            @PathVariable Long sessionId,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(pomodoroService.endBreak(sessionId, userId));
    }

    @PutMapping("/skip-break/{sessionId}")
    public ResponseEntity<PomodoroSessionDto> skipBreak(
            @PathVariable Long sessionId,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(pomodoroService.skipBreak(sessionId, userId));
    }

    @GetMapping("/status/{sessionId}")
    public ResponseEntity<PomodoroSessionDto> getStatus(
            @PathVariable Long sessionId,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        return ResponseEntity.ok(pomodoroService.getStatus(sessionId, userId));
    }

    private Long extractUserId(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userDetails.getId();
    }
}