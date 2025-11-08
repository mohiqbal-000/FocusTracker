package com.example.FocusTrackerBackend.Controller;


import com.example.FocusTrackerBackend.Security.JwtService;
import com.example.FocusTrackerBackend.Service.FocusSessionsService;
import com.example.FocusTrackerBackend.model.FocusSessions;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/focus")
public class FocusController {
    @Autowired
    private FocusSessionsService focusSessionsService;
    @Autowired
    private JwtService jwtService;
    @PostMapping("/start")
    public FocusSessions startSession(HttpServletRequest request){
        String authHeader = request.getHeader("Authorization");
        if(authHeader == null || !authHeader.startsWith("Bearer")) {

            throw new RuntimeException("Missing or invalid Authorization header");

        }
        String token = authHeader.substring(7);
        Long userId = jwtService.extractUserId(token);

        return focusSessionsService.startSession(userId);

    }
    @PutMapping("/stop/{sessionId}")
    public FocusSessions stopSession(@PathVariable Long sessionId){
        return focusSessionsService.stopSession(sessionId);
    }
    @GetMapping("/history")
    public List<FocusSessions> getHistory(@RequestParam Long userId) {
     return focusSessionsService.getHistory(userId);
    }


}
