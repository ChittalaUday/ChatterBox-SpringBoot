package com.chatter.backend.service;

import com.chatter.backend.model.Friendship;
import com.chatter.backend.model.User;
import com.chatter.backend.model.FriendshipStatus;
import com.chatter.backend.repository.FriendshipRepository;
import com.chatter.backend.repository.UserRepo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FriendService {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepo userRepository;
    
    @Autowired
    private NotificationService notificationService;

    public Friendship sendFriendRequest(User user, User friend) {
        // Check if friendship already exists
        Optional<Friendship> existingFriendship = friendshipRepository.findMutualFriendship(user, friend);
        
        if (existingFriendship.isPresent()) {
            Friendship friendship = existingFriendship.get();
            // If already friends, do nothing
            if (friendship.getStatus() == FriendshipStatus.ACCEPTED) {
                return friendship;
            }
            // If previously rejected or blocked, create new request
            friendship.setStatus(FriendshipStatus.PENDING);
            Friendship savedFriendship = friendshipRepository.save(friendship);
            
            // Create notification for the friend
            notificationService.createNotification(
                friend, 
                user.getName() + " sent you a friend request", 
                "FRIEND_REQUEST"
            );
            
            return savedFriendship;
        }
        
        // Create new friendship request
        Friendship friendship = new Friendship(user, friend, FriendshipStatus.PENDING);
        Friendship savedFriendship = friendshipRepository.save(friendship);
        
        // Create notification for the friend
        notificationService.createNotification(
            friend, 
            user.getName() + " sent you a friend request", 
            "FRIEND_REQUEST"
        );
        
        return savedFriendship;
    }

    public Friendship acceptFriendRequest(User user, User friend) {
        Optional<Friendship> existingFriendship = friendshipRepository.findMutualFriendship(user, friend);
        
        if (existingFriendship.isPresent()) {
            Friendship friendship = existingFriendship.get();
            friendship.setStatus(FriendshipStatus.ACCEPTED);
            Friendship savedFriendship = friendshipRepository.save(friendship);
            
            // Create notification for the user who sent the request
            notificationService.createNotification(
                friend, 
                user.getName() + " accepted your friend request", 
                "FRIEND_ACCEPTED"
            );
            
            return savedFriendship;
        }
        
        // If no existing request, create new accepted friendship
        Friendship friendship = new Friendship(user, friend, FriendshipStatus.ACCEPTED);
        Friendship savedFriendship = friendshipRepository.save(friendship);
        
        // Create notification for the user who sent the request
        notificationService.createNotification(
            friend, 
            user.getName() + " accepted your friend request", 
            "FRIEND_ACCEPTED"
        );
        
        return savedFriendship;
    }

    public Friendship rejectFriendRequest(User user, User friend) {
        Optional<Friendship> existingFriendship = friendshipRepository.findMutualFriendship(user, friend);
        
        if (existingFriendship.isPresent()) {
            Friendship friendship = existingFriendship.get();
            friendship.setStatus(FriendshipStatus.REJECTED);
            Friendship savedFriendship = friendshipRepository.save(friendship);
            
            // Create notification for the user who sent the request
            notificationService.createNotification(
                friend, 
                user.getName() + " rejected your friend request", 
                "FRIEND_REJECTED"
            );
            
            return savedFriendship;
        }
        
        return null;
    }

    public List<User> getFriends(User user) {
        List<Friendship> friendships = friendshipRepository.findAllByUserAndStatus(user, FriendshipStatus.ACCEPTED);
        
        return friendships.stream()
                .map(friendship -> {
                    if (friendship.getUser().getId() == user.getId()) {
                        return friendship.getFriend();
                    } else {
                        return friendship.getUser();
                    }
                })
                .collect(Collectors.toList());
    }

    public List<User> getPendingRequests(User user) {
        List<Friendship> friendships = friendshipRepository.findByFriendAndStatus(user, FriendshipStatus.PENDING);
        
        return friendships.stream()
                .map(Friendship::getUser)
                .collect(Collectors.toList());
    }

    public void removeFriend(User user, User friend) {
        Optional<Friendship> existingFriendship = friendshipRepository.findMutualFriendship(user, friend);
        
        if (existingFriendship.isPresent()) {
            friendshipRepository.delete(existingFriendship.get());
        }
    }
}