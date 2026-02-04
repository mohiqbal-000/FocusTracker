package com.example.FocusTrackerBackend.Scheduler;

import com.example.FocusTrackerBackend.Repository.FocusRepository;
import com.example.FocusTrackerBackend.Repository.UserRepository;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReminderScheduler {
    @Autowired
    private UserRepository repo;
    @Autowired
    private FocusRepository focusrepo;

    @Scheduled(cron = "0 0 19 * * *")
    public void sendDailyRemainder(){

        List<User> users = repo.findAll();
        LocalDate today = LocalDate.now();

        for(User user : users){

            boolean hasSession = focusrepo.findByUser_Id(user.getId())
                    .stream()
                    .anyMatch(s-> s.getStartTime().toLocalDate().equals(today));
            if(!hasSession){
                System.out.println("Reminder -> User "+user.getEmail() + "has not studied today");
            }

        }


    }
}
