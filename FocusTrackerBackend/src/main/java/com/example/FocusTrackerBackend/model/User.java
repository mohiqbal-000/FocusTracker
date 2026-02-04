package com.example.FocusTrackerBackend.model;

import jakarta.persistence.*;

@Entity
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String email;
    private String password;
    private  long focustime;

    public User(){

    }

    public User(long id, long focustime, String password, String email) {
        this.id = id;
        this.focustime = focustime;
        this.password = password;
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public long getId() {
        return id;
    }


    public void setId(long id) {
        this.id = id;
    }

    public long getFocustime() {
        return focustime;
    }

    public void setFocustime(long focustime) {
        this.focustime = focustime;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
