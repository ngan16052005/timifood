package com.timifood.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtUtil {

    private static final String SECRET = "Th1sIs4V3ryL0ngS3cr3tK3yF0rT1m1F00dJWT_2026";
    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());
    
    private static final long EXPIRATION_TIME = 86400000;

    // --- TẠO TOKEN ---
    public String generateToken(UUID userId, String phone, Integer userType) {
        return Jwts.builder()
                .setSubject(phone)
                .claim("id", userId.toString())
                .claim("userType", userType)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // --- GIẢI MÃ TOKEN ---
    public String extractPhone(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public String extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("id", String.class);
    }
    
    public Integer extractUserType(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("userType", Integer.class);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    // --- KIỂM TRA TOKEN ---
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}
