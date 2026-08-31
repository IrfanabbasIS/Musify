package com.bd.musify.service;

import org.jspecify.annotations.Nullable;
import org.springframework.web.multipart.MultipartFile;

import com.bd.musify.dto.request.PlaylistRequest;
import com.bd.musify.dto.response.MessageResponse;
import com.bd.musify.dto.response.PaginatedResponse;
import com.bd.musify.dto.response.PlaylistResponse;
import com.bd.musify.dto.response.PlaylistWithSongResponse;

public interface PlaylistService {

    PlaylistResponse createPlaylist(PlaylistRequest request, MultipartFile imagFile, String email);

    PlaylistResponse updatePlaylistPrivacy(Long id,boolean isPublic, String email);

    MessageResponse addSongToPlaylist(Long playlistId, Long songId, String email);

    MessageResponse removeSongFromPlaylist(Long playlistId, Long songId, String email);

    MessageResponse reorderSongInPlaylist(Long playlistId, Long songId, Integer newPosition, String email);

    
    PaginatedResponse<PlaylistResponse> getAllPublicPlaylists(int page, int size, String search);

    PaginatedResponse<PlaylistResponse> getMyPlaylists(String email, int page, int size, String search);

    PlaylistWithSongResponse getPlaylistWithSongs(long playlistId, String email);

    MessageResponse deletePlaylist(Long playlistId, String email);

}
