package com.bd.musify.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.bd.musify.dto.request.PlaylistRequest;
import com.bd.musify.dto.response.MessageResponse;
import com.bd.musify.dto.response.PaginatedResponse;
import com.bd.musify.dto.response.PlaylistResponse;
import com.bd.musify.dto.response.PlaylistWithSongResponse;
import com.bd.musify.service.PlaylistService;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/playlist")
@Validated
public class PLaylistController 
{
    @Autowired
    private PlaylistService playlistService;


    @PostMapping("/createPlaylist")
    public ResponseEntity<PlaylistResponse> createPlaylist(
        @RequestParam(value = "name") @NotBlank(message = "Playlist name is required") @Size(max = 100, message = "Playlist name must not exceed 100 characters")
        String name,
        @RequestParam(value="description", required = false) @Size(max = 500, message = "Description must not exceed 500 characters")
        String description,
        @RequestParam(value = "isPublic", defaultValue = "false") boolean isPublic,
        @RequestParam(value = "imageFile", required = true) MultipartFile imageFile,
        Authentication authentication
    )
    {
        String email=authentication.getName();
        PlaylistRequest request=new PlaylistRequest(name , description, isPublic);
        PlaylistResponse response=playlistService.createPlaylist(request, imageFile, email);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @PatchMapping("/updatePlaylistPrivacy/{id}")
    public ResponseEntity<PlaylistResponse> updatePlaylistPrivacy(
        @PathVariable Long id,
        @RequestParam("isPublic") boolean isPublic,
        Authentication authentication
    )
    {
        String email=authentication.getName();
        PlaylistResponse response=playlistService.updatePlaylistPrivacy(id,isPublic, email);
        return ResponseEntity.ok(response);
    }

    @PostMapping( "/addSongToPlaylist/{playlistId}")
    public ResponseEntity<MessageResponse> addingSongToPlaylist(
        @PathVariable Long playlistId,
        @RequestParam("songId") Long songId,
        Authentication authentication
    )
    {
        String email=authentication.getName();
        MessageResponse response=playlistService.addSongToPlaylist(playlistId, songId,email);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/removeSongFromPlaylist/{playlistId}")
    public ResponseEntity<MessageResponse> removeSongFromPlaylist(
        @PathVariable Long playlistId,
        @RequestParam("songId") Long songId,
        Authentication authentication
    )
    {
        String email=authentication.getName();
        MessageResponse response=playlistService.removeSongFromPlaylist(playlistId, songId, email);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/reorderSongInPlaylist/{playlistId}")
    public ResponseEntity<MessageResponse> reorderSongInPlaylist(
        @PathVariable Long playlistId,
        @RequestParam ("songId") Long songId,
        @RequestParam("newPosition") Integer newPosition,
        Authentication authentication
    )
    {
        String email=authentication.getName();
        MessageResponse response=playlistService.reorderSongInPlaylist(playlistId, songId, newPosition, email);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/getAllPublicPlaylists")
    public ResponseEntity<?> getAllPublicPlaylists(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String search
    )
    {
        return ResponseEntity.ok(playlistService.getAllPublicPlaylists(page,size,search));
    }

    @GetMapping("/getMyPlaylists")
    public ResponseEntity<?> getMyPlaylists(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String search,
        Authentication authentication
    )
    {

        if(authentication==null)
        {
            return ResponseEntity.status(401).body("Authentication required");
        }
        String email=authentication.getName();
        PaginatedResponse<PlaylistResponse> result =playlistService.getMyPlaylists(email,page,size,search);
        return ResponseEntity.ok(result);

    }

    @GetMapping("/getPlaylistWithSongs/{playlistId}")
    public ResponseEntity<PlaylistWithSongResponse> getPlaylistSongs(
        @PathVariable long playlistId,
        Authentication authentication
    )
    {
        String email=authentication.getName();
        PlaylistWithSongResponse response=playlistService.getPlaylistWithSongs(playlistId, email);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/deletePlaylist/{playlistId}")
    public ResponseEntity<MessageResponse> deletePlaylist(
        @PathVariable Long playlistId,
        Authentication authentication
    )
    {
        String email=authentication.getName();
        MessageResponse response=playlistService.deletePlaylist(playlistId, email);
        return ResponseEntity.ok(response);
}

}
