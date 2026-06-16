package com.example.FocusTrackerBackend.Controller;

import com.example.FocusTrackerBackend.Security.CustomUserDetails;
import com.example.FocusTrackerBackend.Service.ExportService;
import com.example.FocusTrackerBackend.Util.CsvExportUtil;
import com.example.FocusTrackerBackend.model.FocusSessions;
import com.example.FocusTrackerBackend.model.Goal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/export/")
public class ExportController {
    private final ExportService exportService;

   public ExportController(ExportService exportService){
       this.exportService = exportService;

   }
   @GetMapping("/goals")
   public void exportGoals(HttpServletResponse response, Authentication authentication) throws IOException {
       CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
       Long userId = userDetails.getId();


           response.setContentType("text/csv");
           response.setHeader("Content-Disposition",
                   "attachment; filename=goals.csv");

           List<Goal> goals = exportService.getUserGoals(userId);
           PrintWriter writer = response.getWriter();
           CsvExportUtil.writeGoalsToCsv(writer, goals);
           writer.flush();
       }
       @GetMapping("/focus-sessions")
       public void exportFocusSessions(HttpServletResponse response,Authentication authentication,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to

       ) throws IOException {
           CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
           Long userId = userDetails.getId();
           response.setContentType("text/csv");
           response.setHeader("Content-Disposition",
                   "attachment; filename=focus_sessions.csv");
        List<FocusSessions> sessions = exportService.getUserFocusSessions(userId,from,to);
           PrintWriter writer = response.getWriter();
           CsvExportUtil.writeFocusSessionsToCsv(writer, sessions);
           writer.flush();


       }

   }
