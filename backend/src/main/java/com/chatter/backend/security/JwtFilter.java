package com.chatter.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.chatter.backend.util.JwtUtil;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        logger.info("Processing request: {} {}", request.getMethod(), request.getRequestURI());
        
        final String authHeader = request.getHeader("Authorization");
        logger.info("Authorization header: {}", authHeader);

        String username = null;
        String jwt = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            logger.info("Extracted JWT token: {}", jwt);
            try {
                username = jwtUtil.extractUsername(jwt);
                logger.info("Extracted username from token: {}", username);
            } catch (Exception e) {
                logger.error("Invalid token: {}", e.getMessage());
                filterChain.doFilter(request, response);
                return;
            }
        } else {
            logger.info("No valid Bearer token found in Authorization header");
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            logger.info("Username found and no existing authentication, validating token");
            if (jwtUtil.validateToken(jwt)) {
                logger.info("Token validation successful");
                String role = jwtUtil.extractUserRole(jwt);
                logger.info("Extracted role from token: {}", role);

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
                logger.info("Created authorities: {}", authorities);

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        username, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                logger.info("Authentication set in SecurityContext");
            } else {
                logger.warn("Token validation failed");
            }
        } else {
            logger.info("Either username is null or authentication already exists");
        }

        logger.info("Continuing with filter chain");
        filterChain.doFilter(request, response);
    }
}