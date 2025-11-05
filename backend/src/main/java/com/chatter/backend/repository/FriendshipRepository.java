package com.chatter.backend.repository;

import com.chatter.backend.model.Friendship;
import com.chatter.backend.model.User;
import com.chatter.backend.model.FriendshipStatus;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    
    List<Friendship> findByUserAndStatus(User user, FriendshipStatus status);
    
    List<Friendship> findByFriendAndStatus(User friend, FriendshipStatus status);
    
    Optional<Friendship> findByUserAndFriend(User user, User friend);
    
    @Query("SELECT f FROM Friendship f WHERE (f.user = :user AND f.friend = :friend) OR (f.user = :friend AND f.friend = :user)")
    Optional<Friendship> findMutualFriendship(@Param("user") User user, @Param("friend") User friend);
    
    @Query("SELECT f FROM Friendship f WHERE (f.user = :user AND f.status = :status) OR (f.friend = :user AND f.status = :status)")
    List<Friendship> findAllByUserAndStatus(@Param("user") User user, @Param("status") FriendshipStatus status);
}