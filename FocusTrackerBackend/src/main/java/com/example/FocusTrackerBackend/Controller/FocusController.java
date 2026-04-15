    package com.example.FocusTrackerBackend.Controller;
    
    
    import com.example.FocusTrackerBackend.Dto.*;
    import com.example.FocusTrackerBackend.Security.CustomUserDetails;
    import com.example.FocusTrackerBackend.Security.JwtService;
    import com.example.FocusTrackerBackend.Service.FocusSessionsService;
    import com.example.FocusTrackerBackend.model.FocusSessions;
    import jakarta.servlet.http.HttpServletRequest;
    import jakarta.servlet.http.HttpServletResponse;
    import jakarta.validation.Valid;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.security.core.Authentication;
    import org.springframework.security.core.userdetails.UserDetails;
    import org.springframework.web.bind.annotation.*;
    
    import java.util.List;
    
    @RestController
    @CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
    @RequestMapping("/api/focus")
    public class  FocusController {
        @Autowired
        private FocusSessionsService focusSessionsService;
        @Autowired
        private JwtService jwtService;
        @PostMapping("/start")
        public FocusSessions startSession(
                @RequestParam(required = false) String tag,
                Authentication authentication) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            return focusSessionsService.startSession(userDetails.getId(), tag);
        }
        @PutMapping("/stop/{sessionId}")
        public FocusSessions stopSession(@PathVariable Long sessionId,Authentication authentication){
    
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long userId = userDetails.getId();
    
            return focusSessionsService.stopSession(sessionId,userId);
        }

        // Updated /history
        @GetMapping("/history")
        public List<FocusSessions> getHistory(
                @RequestParam(required = false) String tag,
                Authentication authentication) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            return focusSessionsService.getHistory(userDetails.getId(), tag);
        }


        @GetMapping("/{id}")
        public  FocusSessions getSessionById(@PathVariable long id,Authentication authentication){
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long userId=userDetails.getId();
            return  focusSessionsService.getSessionById(id,userId);
    
        }
        @GetMapping("/stats/daily")
        public DailyStatsDto getDaily(Authentication authentication){
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long userId= userDetails.getId();
            return focusSessionsService.getDailyStats(userId);
        }
        @GetMapping("/stats/weekly")
        public WeeklyStatsDto getWeekly(Authentication authentication){
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long userId = userDetails.getId();
            return focusSessionsService.getWeeklyStats(userId);
        }
        @GetMapping("/stats/montly")
        public MonthlyStatsDto getMontly(Authentication authentication){
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long userId = userDetails.getId();
            return  focusSessionsService.getMonthlyStats(userId);
        }
        @GetMapping("/stats/streak")
        public StreakDto getStreak(Authentication authentication){
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long userId = userDetails.getId();
        return  focusSessionsService.getStreak(userId);
        }

        @PutMapping("/{sessionId}/note")
        public FocusSessions addNote(
                @PathVariable Long sessionId,
                @RequestBody @Valid NoteRequestDto request,
                Authentication authentication) {

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long userId = userDetails.getId();
            return focusSessionsService.addNote(sessionId, userId, request.getNote());
        }

        @DeleteMapping("/{sessionId}/note")
        public FocusSessions deleteNote(
                @PathVariable Long sessionId,
                Authentication authentication) {

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long userId = userDetails.getId();
            return focusSessionsService.deleteNote(sessionId, userId);
        }
    
    
    }
