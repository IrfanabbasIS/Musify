package com.bd.musify.serviceImpl;

import java.security.SecureRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.bd.musify.dto.request.ForgotPasswordRequest;
import com.bd.musify.dto.request.LoginUserRequest;
import com.bd.musify.dto.request.RefreshTokenRequest;
import com.bd.musify.dto.request.RegisterUserRequest;
import com.bd.musify.dto.response.AppUserResponse;
import com.bd.musify.dto.response.MessageResponse;
import com.bd.musify.entity.AppUser;
import com.bd.musify.exception.EmailAlreadyExistsException;
import com.bd.musify.exception.InvalidCredentialsException;
import com.bd.musify.exception.InvalidTokenException;
import com.bd.musify.exception.ResourceNotFoundException;
import com.bd.musify.exception.TokenExpiredException;
import com.bd.musify.repository.AppUserRepository;
import com.bd.musify.service.AuthService;
import com.bd.musify.service.EmailService;
import com.bd.musify.util.JwtUtil;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Override
    public MessageResponse registerUser(RegisterUserRequest request) {

        if (appUserRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email Already exists");
        }
        String tempPassword = generateTemporaryPassword();
        AppUser appUser = new AppUser();
        appUser.setName(request.getName());
        appUser.setEmail(request.getEmail());
        appUser.setPassword(passwordEncoder.encode(tempPassword));
        appUser.setRole(request.getRole() != null ? request.getRole() : "USER");
        appUserRepository.save(appUser);
        emailService.sendWelcomeEmail(appUser.getEmail(), appUser.getName(), tempPassword);
        return new MessageResponse("Account created successfully. A temporarry password has been sent to your email");
    }

    @Override
    public AppUserResponse loginUser(LoginUserRequest request) {
        AppUser appUser = appUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), appUser.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        String accessToken = jwtUtil.generatedAccessToken(appUser.getId(), appUser.getName(), appUser.getEmail(),
                appUser.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(appUser.getId(), appUser.getEmail());
        appUser.setRefreshToken(refreshToken);
        appUserRepository.save(appUser);

        return AppUserResponse.fromEntity(appUser, accessToken, refreshToken);
    }

    @Override
    public AppUserResponse refreshAccessToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        String email = jwtUtil.extractEmail(refreshToken);
        if (!jwtUtil.isRefreshToken(refreshToken)) {
            throw new InvalidTokenException("Invalid token type");

        }
        AppUser appUser = appUserRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));
        if (!jwtUtil.validateToken(refreshToken, email)) {
            throw new TokenExpiredException("Refresh Token expired or invalid");
        }

        String newAccessToken = jwtUtil.generatedAccessToken(appUser.getId(), appUser.getName(), appUser.getEmail(),
                appUser.getRole());
        return AppUserResponse.fromEntity(appUser, newAccessToken, refreshToken);
    }

    @Override
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        AppUser appUser = appUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email:" + request
                        .getEmail()));
        String tempPassword = generateTemporaryPassword();
        appUser.setPassword(passwordEncoder.encode(tempPassword));
        appUserRepository.save(appUser);
        emailService.sendCredentials(appUser.getEmail(), appUser.getName(), tempPassword);
        return new MessageResponse("Temporary password has been sent to your register email");

    }

    private String generateTemporaryPassword() {
        String chars = "KDKJSDKJHKJHASKDDKasdbvkbovuwercWDKAC830948hxlj8309lla93849!@#$%^&*";
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        return password.toString();
    }

}
