package com.example.FocusTrackerBackend.Controller;

import com.example.FocusTrackerBackend.Security.JwtService;
import com.example.FocusTrackerBackend.Service.UserService;
import com.example.FocusTrackerBackend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    @Autowired
    private UserService userService;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private AuthenticationManager authenticationManager;


    @PostMapping("/register")
    public ResponseEntity<?> Register(@RequestBody User user) {
        try {
            User savedUser = userService.register(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error:" + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> Login(@RequestBody User user) {
        try{
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getEmail(),user.getPassword()));

        User loggedUser = userService.findByEmail(user.getEmail());
        String token = jwtService.generateToken(loggedUser.getEmail(),loggedUser.getId());
        Map<String,Object> response = new HashMap<>();
        response.put("token",token);
        response.put("user",loggedUser);
            return ResponseEntity.ok(response);
        } catch(AuthenticationException e){
            return ResponseEntity.status(401).body("Invalid Email and Password");
        }


    }
}
