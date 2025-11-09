package com.example.FocusTrackerBackend.Controller;


import com.example.FocusTrackerBackend.Security.CustomUserDetails;
import com.example.FocusTrackerBackend.Security.JwtService;
import com.example.FocusTrackerBackend.Service.FocusSessionsService;
import com.example.FocusTrackerBackend.model.FocusSessions;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
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
    public FocusSessions startSession(Authentication authentication){
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getId(); // directly get userId

        return focusSessionsService.startSession(userId);

    }
    @PutMapping("/stop/{sessionId}")
    public FocusSessions stopSession(@PathVariable Long sessionId,Authentication authentication){

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getId();

        return focusSessionsService.stopSession(sessionId,userId);
    }
    @GetMapping("/history")
    public List<FocusSessions> getHistory(Authentication authentication) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long userId = userDetails.getId();
        return focusSessionsService.getHistory(userId);
    }


}
