package com.bd.musify.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.bd.musify.entity.Song;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SongResponse {

    private Long id;
    private String title;
    private String artist;
    private String songUrl;
    private String imageUrl;
    private LocalDateTime createdAt;
    private Long appUserId;
    private String appUserName;

    public static SongResponse fromEntity(Song song, String baseUrl) {
        SongResponse response = new SongResponse();
        response.setId(song.getId());
        response.setTitle(song.getTitle());
        response.setArtist(song.getArtist());

        response.setSongUrl(song.getSongUrl());
        response.setImageUrl(song.getImageUrl());

        response.setCreatedAt(song.getCreatedAt());
        response.setAppUserId(song.getAppUser().getId());
        response.setAppUserName(song.getAppUser().getName());
        return response;

    }

    {

    }

}
