package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Repository.UserRepository;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserRepository repo;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public User register(User user){
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return repo.save(user);
    }



    public User login(String email, String password) {
        User existingUser = repo.findByEmail(email);
        if (existingUser != null && passwordEncoder.matches(password, existingUser.getPassword())) {
            return existingUser;
        }
        return null;
    }

    public User findByEmail(String email) {
        return repo.findByEmail(email);
    }
}
