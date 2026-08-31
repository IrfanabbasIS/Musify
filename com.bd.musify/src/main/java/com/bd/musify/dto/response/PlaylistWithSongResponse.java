package com.bd.musify.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import java.util.stream.Collectors;

import com.bd.musify.entity.Playlist;
import com.bd.musify.entity.PlaylistSong;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlaylistWithSongResponse {

    private Long id;
    private String name;
    private String description;
    private Boolean isPublic;
    private String imageUrl;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private Long appUserId;
    private String appUserName;
    private Integer songCount;
    private List<SongInPlayListResponse> songs;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SongInPlayListResponse {

        private Long songId;
        private String title;
        private String artist;
        private String songurl;
        private String imageUrl;
        private Integer position;
        private LocalDateTime addedAt;

    }

    public static PlaylistWithSongResponse fromEntity(Playlist playlist, List<PlaylistSong> playlistSongs,
            String baseUrl) {
        PlaylistWithSongResponse response = new PlaylistWithSongResponse();
        response.setId(playlist.getId());
        response.setName(playlist.getName());
        response.setDescription(playlist.getDescription());
        response.setIsPublic(playlist.getIsPublic());
        response.setImageUrl(playlist.getImageUrl() != null ? baseUrl + playlist.getImageUrl() : null);
        response.setCreateAt(playlist.getCreatedAt());
        response.setUpdateAt(playlist.getUpdatedAt());
        response.setAppUserId(playlist.getAppUser().getId());
        response.setAppUserName(playlist.getAppUser().getName());
        response.setSongCount(playlistSongs.size());

        List<SongInPlayListResponse> songs = playlistSongs.stream()
                .map(ps -> {
                    SongInPlayListResponse songResponse = new SongInPlayListResponse();
                    songResponse.setSongId(ps.getSong().getId());
                    songResponse.setTitle(ps.getSong().getTitle());
                    songResponse.setArtist(ps.getSong().getArtist());
                    songResponse
                            .setSongurl(ps.getSong().getSongUrl() != null ? baseUrl + ps.getSong().getSongUrl() : null);
                            songResponse.setImageUrl(
        ps.getSong().getImageUrl() != null
            ? baseUrl + ps.getSong().getImageUrl()
            : null
    );
                    songResponse.setPosition(ps.getPosition());
                    songResponse.setAddedAt(ps.getAddedAt());
                    return songResponse;

                })
                .collect(Collectors.toList());
        response.setSongs(songs);
        return response;

    }

}
