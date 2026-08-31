package com.bd.musify.util;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access.expiration}")
    private Long accessTokenExoiration;

    @Value("${jwt.refresh.expiration}")
    private Long refreshTokenExpiration;

    private SecretKey getSigningKey()
    {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

    }

    public String generatedAccessToken(Long id , String name,  String email, String role)
    {
        Map<String, Object> claims =new HashMap<>();
        claims.put("id", id);
        claims.put("name", name);
        claims.put("email", email);
        claims.put("role", role);
        claims.put("type", "ACCESS");
        return createToken(claims, email, accessTokenExoiration);

    }

    public String generateRefreshToken(Long id, String email)
    {
        Map<String, Object> claims=new HashMap<>();
        claims.put("id", id);
        claims.put("email", email);
        claims.put("type", "REFRESH");
        return createToken(claims, email, refreshTokenExpiration);
    }



    private String createToken(Map<String,Object> claims, String email, Long accessTokenExoiration2) {
        Date now =new Date();
        Date expiryDate=new Date(now.getTime() + accessTokenExoiration);

       return Jwts.builder()
            .claims(claims)                  // ✅ NEW (not setClaims)
            .subject(email)                  // ✅ NEW (not setSubject)
            .issuedAt(now)                   // ✅ NEW
            .expiration(expiryDate)          // ✅ NEW
            .signWith(getSigningKey())       // ✅ same
            .compact(); 
    }

    public Long extractId(String token)
    {
        return exctractClaim(token,  claims -> claims.get("id", Long.class));
    }

    public String extractNames(String token)
    {
        return exctractClaim(token,  claims -> claims.get("name", String.class));
    }

    public String extractEmail(String token)
    {
        return exctractClaim(token,  claims -> claims.get("email", String.class));
    }

    public String extractRole(String token)
    {
        return exctractClaim(token,  claims -> claims.get("role", String.class));
    }

    public String extractTokenType(String token)
    {
        return exctractClaim(token,  claims -> claims.get("type", String.class));
    }

    public Date extractExpiration(String token)
    {
        return exctractClaim(token,  Claims::getExpiration);
    }

    private <T>  T exctractClaim(String token, Function<Claims, T> claimsResolver) 
    {
        final  Claims claims=extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token)
    {
        return Jwts.parser()
        .verifyWith(getSigningKey())
        .build()
        .parseSignedClaims(token)
        .getPayload();
    }

    public Boolean isTokenExpired(String token)
    {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token, String email)
    {
        final String extractedEmail=extractEmail(token);
        return(extractedEmail.equals(email) && !isTokenExpired(token));
    }

    public Boolean isAccessToken(String token)
    {
        return "ACCESS".equals((extractTokenType(token)));
    }

    public Boolean isRefreshToken(String token)
    {
        
        return "REFRESH".equals(extractTokenType(token));
    }
}
