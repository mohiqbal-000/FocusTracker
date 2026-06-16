package com.example.FocusTrackerBackend.Util;

import com.example.FocusTrackerBackend.model.FocusSessions;
import com.example.FocusTrackerBackend.model.Goal;

import java.io.PrintWriter;
import java.util.List;

public class CsvExportUtil {

    public static void writeGoalsToCsv(PrintWriter writer, List<Goal> goals){
        writer.println("Goal ID,Title,Description,Status,Progress,Created At");

        for(Goal goal: goals){
            writer.printf("%d,%s,%s,%s,%d,%s%n",
                    goal.getId(),
                    goal.getGoalType(),
                    goal.getTargetValue(),
                    goal.getProgressValue(),
                    goal.getStartDate(),
                    goal.getEndDate(),
                    goal.isAchieved()

            );
        }
    }
    public static void writeFocusSessionsToCsv(PrintWriter writer, List<FocusSessions> sessions){
        writer.println("Session ID,Goal ID,Start Time,End Time,Duration(min)");

        for(FocusSessions session:sessions){
            writer.printf("%d,%d,%s,%s,%d%n",
                    session.getId(),
                    session.getStartTime(),
                    session.getEndTime(),
                    session.getDuration()
            );
        }
    }
}
