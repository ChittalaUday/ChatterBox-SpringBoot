package com.chatter.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.chatter.backend.util.JwtUtil;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketSecurityConfig.class);

    private final JwtUtil jwtUtil;

    public WebSocketSecurityConfig(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    logger.info("WebSocket CONNECT command received");
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    logger.info("Authorization header from WebSocket: {}", authHeader);
                    
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String jwt = authHeader.substring(7);
                        try {
                            String username = jwtUtil.extractUsername(jwt);
                            logger.info("Extracted username from JWT: {}", username);
                            
                            if (username != null && jwtUtil.validateToken(jwt)) {
                                String role = jwtUtil.extractUserRole(jwt);
                                logger.info("Extracted role from JWT: {}", role);
                                
                                // Create authorities list
                                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                                if (role != null && !role.isEmpty()) {
                                    // Add both ROLE_ prefix and plain role for flexibility
                                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                                    authorities.add(new SimpleGrantedAuthority(role));
                                } else {
                                    // Default to USER role if none specified
                                    authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                                    authorities.add(new SimpleGrantedAuthority("USER"));
                                }
                                
                                UsernamePasswordAuthenticationToken authToken = 
                                    new UsernamePasswordAuthenticationToken(username, null, authorities);
                                SecurityContextHolder.getContext().setAuthentication(authToken);
                                accessor.setUser(authToken);
                                logger.info("WebSocket authentication successful for user: {}", username);
                            } else {
                                logger.warn("Invalid JWT token");
                            }
                        } catch (Exception e) {
                            logger.error("Error processing JWT token: {}", e.getMessage());
                        }
                    } else {
                        logger.warn("No valid Authorization header found in WebSocket CONNECT");
                    }
                }
                
                return message;
            }
        });
    }
}