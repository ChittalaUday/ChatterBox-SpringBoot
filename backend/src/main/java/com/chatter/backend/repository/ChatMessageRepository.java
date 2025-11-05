package com.chatter.backend.repository;

import com.chatter.backend.model.ChatMessage;
import com.chatter.backend.model.User;

import java.util.List;
import java.util.Map;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT cm FROM ChatMessage cm WHERE " +
           "((cm.sender = :user1 AND cm.receiver = :user2) OR " +
           "(cm.sender = :user2 AND cm.receiver = :user1)) AND " +
           "cm.isDeleted = false " +
           "ORDER BY cm.timestamp ASC")
    List<ChatMessage> findConversationBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    List<ChatMessage> findByReceiverAndIsReadFalse(User receiver);
    
    List<ChatMessage> findBySenderAndReceiverOrderByTimestampAsc(User sender, User receiver);
    
    @Query("SELECT cm.sender.id as senderId, COUNT(cm) as unreadCount FROM ChatMessage cm WHERE cm.receiver = :receiver AND cm.isRead = false AND cm.isDeleted = false GROUP BY cm.sender.id")
    List<Object[]> countUnreadMessagesBySender(@Param("receiver") User receiver);
}