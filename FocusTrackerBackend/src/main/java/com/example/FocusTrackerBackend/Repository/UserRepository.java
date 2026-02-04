package com.example.FocusTrackerBackend.Repository;

import com.example.FocusTrackerBackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User,Long> {

    User findByEmail(String email);
}
