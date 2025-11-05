package com.chatter.backend.repository;

import com.chatter.backend.model.Notification;
import com.chatter.backend.model.User;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserAndReadOrderByCreatedAtDesc(User user, Boolean read);
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    long countByUserAndRead(User user, Boolean read);
}