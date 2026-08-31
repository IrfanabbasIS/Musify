package com.bd.musify.repository;

import com.bd.musify.entity.AppUser;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Long>  {
    Boolean existsByEmail(String email);


    Optional<AppUser> findByEmail(String email);


   Optional<AppUser> findByRefreshToken(String refreshToken);

}
