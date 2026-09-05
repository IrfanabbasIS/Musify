package com.bd.musify.dto.response;

import java.time.LocalDateTime;

import com.bd.musify.entity.Playlist;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlaylistResponse {

    private Long id;
    private String name;
    private String description;
    private Boolean isPublic;
    private String imageUrl;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private Long appUserId;
    private String appUserName;
    

    public static PlaylistResponse fromEntity(Playlist playlist, String baseUrl)
    {
        PlaylistResponse response=new PlaylistResponse();
        response.setId(playlist.getId());
         response.setName(playlist.getName());
          response.setDescription(playlist.getDescription());
           response.setIsPublic(playlist.getIsPublic());
            response.setImageUrl(playlist.getImageUrl());
             response.setCreateAt(playlist.getCreatedAt());
              response.setUpdateAt(playlist.getUpdatedAt ());
               response.setAppUserId(playlist.getAppUser().getId());
               response.setAppUserName(playlist.getAppUser().getName());
               return response;

    }

}
