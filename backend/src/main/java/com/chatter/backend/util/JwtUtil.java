package com.chatter.backend.util;

import java.security.Key;
import java.sql.Date;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    
    private final String SECRET_KEY = "MySuperSecreatKeyForJwtSigningforChatterBoxAppBackendOnlyforthisProjectisEnoughitsLong";
    private final long EXPIRATION_TIME = 86400000; // 1 day in milliseconds

    private Key getSigininKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateToken(String mail, String role, int userId) {
        logger.info("Generating token for email: {}, role: {}, userId: {}", mail, role, userId);
        String token = Jwts.builder()
                .setSubject(mail)
                .claim("role", role)
                .claim("userId", userId)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigininKey(), SignatureAlgorithm.HS256)
                .compact();
        logger.info("Generated token: {}", token);
        return token;
    }

    public Boolean validateToken(String token) {
        try {
            logger.info("Validating token: {}", token);
            Jwts.parserBuilder()
                    .setSigningKey(getSigininKey())
                    .build()
                    .parseClaimsJws(token);
            logger.info("Token validation successful");
            return true;
        } catch (JwtException e) {
            logger.error("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public String extractUsername(String token) {
        logger.info("Extracting username from token: {}", token);
        String username = Jwts.parserBuilder()
                .setSigningKey(getSigininKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
        logger.info("Extracted username: {}", username);
        return username;
    }

    public String extractUserRole(String token) {
        logger.info("Extracting user role from token: {}", token);
        String role = Jwts.parserBuilder()
                .setSigningKey(getSigininKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
        logger.info("Extracted role: {}", role);
        return role;
    }

    public Integer extractUserId(String token) {
        logger.info("Extracting user ID from token: {}", token);
        Integer userId = Jwts.parserBuilder()
                .setSigningKey(getSigininKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("userId", Integer.class);
        logger.info("Extracted userId: {}", userId);
        return userId;
    }
}