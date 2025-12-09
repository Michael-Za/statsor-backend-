package com.captainpro.aiassistant.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT Service
 * 
 * Handles JWT token operations including:
 * - Token generation
 * - Token validation
 * - Claims extraction
 * - Token refresh
 */
@Service
@Slf4j
public class JwtService {

    @Value("${app.security.jwt.secret-key:mySecretKey123456789012345678901234567890}")
    private String secretKey;

    @Value("${app.security.jwt.expiration:86400000}") // 24 hours
    private long jwtExpiration;

    @Value("${app.security.jwt.refresh-expiration:604800000}") // 7 days
    private long refreshExpiration;

    /**
     * Extract username from JWT token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extract roles from JWT token
     */
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Claims claims = extractAllClaims(token);
        return (List<String>) claims.get("roles");
    }

    /**
     * Extract user ID from JWT token
     */
    public String extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        return (String) claims.get("userId");
    }

    /**
     * Extract expiration date from JWT token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extract specific claim from JWT token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Generate JWT token for user
     */
    public String generateToken(String username, String userId, List<String> roles) {
        return generateToken(Map.of(
            "userId", userId,
            "roles", roles
        ), username);
    }

    /**
     * Generate JWT token with extra claims
     */
    public String generateToken(Map<String, Object> extraClaims, String username) {
        return buildToken(extraClaims, username, jwtExpiration);
    }

    /**
     * Generate refresh token
     */
    public String generateRefreshToken(String username, String userId, List<String> roles) {
        return buildToken(Map.of(
            "userId", userId,
            "roles", roles,
            "tokenType", "refresh"
        ), username, refreshExpiration);
    }

    /**
     * Build JWT token
     */
    private String buildToken(Map<String, Object> extraClaims, String username, long expiration) {
        try {
            return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
                
        } catch (Exception e) {
            log.error("Failed to generate JWT token for user: {}", username, e);
            throw new RuntimeException("Failed to generate JWT token", e);
        }
    }

    /**
     * Validate JWT token
     */
    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate JWT token for specific user
     */
    public boolean isTokenValid(String token, String username) {
        try {
            final String tokenUsername = extractUsername(token);
            return (username.equals(tokenUsername)) && !isTokenExpired(token);
        } catch (Exception e) {
            log.debug("Token validation failed for user {}: {}", username, e.getMessage());
            return false;
        }
    }

    /**
     * Check if token is expired
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Extract all claims from JWT token
     */
    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
                
        } catch (Exception e) {
            log.debug("Failed to extract claims from token: {}", e.getMessage());
            throw new RuntimeException("Invalid JWT token", e);
        }
    }

    /**
     * Get signing key for JWT
     */
    private SecretKey getSignInKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Refresh JWT token
     */
    public String refreshToken(String refreshToken) {
        try {
            if (!isTokenValid(refreshToken)) {
                throw new RuntimeException("Invalid refresh token");
            }

            String username = extractUsername(refreshToken);
            String userId = extractUserId(refreshToken);
            List<String> roles = extractRoles(refreshToken);

            // Check if it's actually a refresh token
            Claims claims = extractAllClaims(refreshToken);
            String tokenType = (String) claims.get("tokenType");
            
            if (!"refresh".equals(tokenType)) {
                throw new RuntimeException("Token is not a refresh token");
            }

            return generateToken(username, userId, roles);
            
        } catch (Exception e) {
            log.error("Failed to refresh token: {}", e.getMessage());
            throw new RuntimeException("Failed to refresh token", e);
        }
    }

    /**
     * Get token expiration time in milliseconds
     */
    public long getExpirationTime() {
        return jwtExpiration;
    }

    /**
     * Get refresh token expiration time in milliseconds
     */
    public long getRefreshExpirationTime() {
        return refreshExpiration;
    }

    /**
     * Extract token type (access or refresh)
     */
    public String extractTokenType(String token) {
        Claims claims = extractAllClaims(token);
        return (String) claims.getOrDefault("tokenType", "access");
    }

    /**
     * Check if token is a refresh token
     */
    public boolean isRefreshToken(String token) {
        return "refresh".equals(extractTokenType(token));
    }

    /**
     * Get remaining time until token expires (in milliseconds)
     */
    public long getRemainingTime(String token) {
        Date expiration = extractExpiration(token);
        return expiration.getTime() - System.currentTimeMillis();
    }

    /**
     * Check if token will expire soon (within next 5 minutes)
     */
    public boolean willExpireSoon(String token) {
        long remainingTime = getRemainingTime(token);
        return remainingTime < 300000; // 5 minutes in milliseconds
    }
}