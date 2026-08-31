package com.bd.musify.service;


import com.bd.musify.dto.request.AppUserRequest;
import com.bd.musify.dto.response.AppUserResponse;
import com.bd.musify.dto.response.PaginatedResponse;


public interface AppUserService  {

    AppUserResponse getUserProfile(String email);

    AppUserResponse updateUserProfile(AppUserRequest request, String email);

    
    PaginatedResponse<AppUserResponse> getAllUsers(int page, int size);

    AppUserResponse updateUserProfile(Long userId,
            String role,
            String email);

}
