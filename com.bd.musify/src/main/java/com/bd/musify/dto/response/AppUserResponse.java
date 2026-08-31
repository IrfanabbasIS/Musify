package com.bd.musify.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.bd.musify.entity.AppUser;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppUserResponse {
    private Long id;
    private String name;
    private  String email;
    private String role;
    private String accessToken;
    private String refreshToken;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;


    public static AppUserResponse fromEntity(AppUser appUser, String accessToken, String refreshToken)
    {
        AppUserResponse response= new AppUserResponse();
        response.setId(appUser.getId());
        response.setName(appUser.getName());
        response.setEmail(appUser.getEmail());
        response.setRole(appUser.getRole());
        response.setAccessToken(accessToken);
        response.setRefreshToken(appUser.getRefreshToken());
        response.setCreateAt(appUser.getCreatedAt());
        response.setUpdateAt(appUser.getUpdatedAt());
        return response;
    }
}
