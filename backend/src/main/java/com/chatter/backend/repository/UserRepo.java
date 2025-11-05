package com.chatter.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.chatter.backend.model.User;
import java.util.List;

public interface UserRepo extends JpaRepository<User, Integer> {
    User findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByMobile(String mobile);
    
    List<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String name, String email);
}