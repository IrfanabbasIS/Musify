package com.bd.musify.serviceImpl;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.bd.musify.dto.request.PlaylistRequest;
import com.bd.musify.dto.response.MessageResponse;
import com.bd.musify.dto.response.PaginatedResponse;
import com.bd.musify.dto.response.PlaylistResponse;
import com.bd.musify.dto.response.PlaylistWithSongResponse;
import com.bd.musify.entity.AppUser;
import com.bd.musify.entity.Playlist;
import com.bd.musify.entity.PlaylistSong;
import com.bd.musify.entity.Song;
import com.bd.musify.repository.AppUserRepository;
import com.bd.musify.repository.PlaylistRepository;
import com.bd.musify.repository.PlaylistSongRepository;
import com.bd.musify.repository.SongRepository;
import com.bd.musify.service.PlaylistService;
import com.bd.musify.util.FileHandlerUtil;

import com.bd.musify.service.CloudinaryService;

@Service
public class PlaylistServiceImpl implements PlaylistService {

    @Autowired
    private PlaylistRepository playlistRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private PlaylistSongRepository playlistSongRepository;

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private FileHandlerUtil fileHandlerUtil;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Value("${app.base.url}")
    private String baseUrl;

    @Override
    public PlaylistResponse createPlaylist(PlaylistRequest request, MultipartFile imagFile, String email) {
        AppUser appUser = getUserByEmail(email);
        Playlist playlist = new Playlist();
        playlist.setName(request.getName());
        playlist.setDescription(request.getDescription());
        playlist.setIsPublic(request.getIsPublic());
        playlist.setAppUser(appUser);

        // old method for uploading on local playlist image
        // if (imagFile != null && !imagFile.isEmpty()) {
        // String uniqueid = UUID.randomUUID().toString();
        // String imageExtension =
        // fileHandlerUtil.getFileExtension(imagFile.getOriginalFilename());
        // String imageFilename = uniqueid + imageExtension;
        // fileHandlerUtil.saveImageFileWithName(imagFile, imageFilename);
        // playlist.setImageUrl("/api/file/image/" + imageFilename);
        // }

        // cloudinary playlist image upload method

        if (imagFile != null && !imagFile.isEmpty()) {
            String uniqueid = UUID.randomUUID().toString();

            String imageExtension = fileHandlerUtil.getFileExtension(imagFile.getOriginalFilename());

            String publicId = uniqueid + imageExtension;

            String imageUrl = cloudinaryService.uploadImage(imagFile, publicId);

            playlist.setImageUrl(imageUrl);
        }
        Playlist savedPlayList = playlistRepository.save(playlist);

        return PlaylistResponse.fromEntity(savedPlayList, baseUrl);
    }

    @Override
    public MessageResponse addSongToPlaylist(Long playlistId, Long songId, String email) {
        Playlist playlist = validatePlaylistAccess(playlistId, email);

        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new RuntimeException("Song not found"));
        if (playlistSongRepository.existsByPlaylistIdAndSongId(playlistId, songId)) {
            throw new RuntimeException("Song alreadyexists in playlist ");
        }
        List<PlaylistSong> existingSongs = playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlistId);
        int nextPosition = existingSongs.isEmpty() ? 1 : existingSongs.get(existingSongs.size() - 1).getPosition() + 1;
        PlaylistSong playlistSong = new PlaylistSong();
        playlistSong.setPlaylist(playlist);
        playlistSong.setSong(song);
        playlistSong.setPosition(nextPosition);
        playlistSongRepository.save(playlistSong);

        return new MessageResponse("Song added to playlist successfully");
    }

    @Override
    public MessageResponse removeSongFromPlaylist(Long playlistId, Long songId, String email) {
        validatePlaylistAccess(playlistId, email);
        PlaylistSong playlistSong = playlistSongRepository.findByPlaylistIdAndSongId(playlistId, songId)
                .orElseThrow(() -> new RuntimeException("Song not found in playlist"));

        int removedPosition = playlistSong.getPosition();
        playlistSongRepository.delete(playlistSong);

        List<PlaylistSong> songAfterRemoved = playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlistId);
        for (PlaylistSong song : songAfterRemoved) {
            if (song.getPosition() > removedPosition) {
                song.setPosition(song.getPosition() - 1);
                playlistSongRepository.save(song);
            }
        }

        return new MessageResponse("Song removed from playlist successfully");

    }

    @Override
    public MessageResponse reorderSongInPlaylist(Long playlistId, Long songId, Integer newPosition, String email) {
        validatePlaylistAccess(playlistId, email);
        PlaylistSong playlistSong = playlistSongRepository.findByPlaylistIdAndSongId(playlistId, songId)
                .orElseThrow(() -> new RuntimeException("Song not found in playlist"));

        List<PlaylistSong> allSongs = playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlistId);
        if (newPosition < 1 || newPosition > allSongs.size()) {
            throw new RuntimeException("Invalid position. Must be between 1 and" + allSongs.size());
        }

        int currentPosition = playlistSong.getPosition();
        if (currentPosition == newPosition) {
            return new MessageResponse("Song is already at position" + allSongs.size());
        }

        if (newPosition > currentPosition) {
            for (PlaylistSong song : allSongs) {
                if (song.getPosition() > currentPosition && song.getPosition() <= newPosition) {
                    song.setPosition(song.getPosition() - 1);
                    playlistSongRepository.save(song);
                }
            }
        } else {
            for (PlaylistSong song : allSongs) {
                if (song.getPosition() >= newPosition && song.getPosition() < currentPosition) {
                    song.setPosition(song.getPosition() + 1);
                    playlistSongRepository.save(song);
                }
            }
        }
        playlistSong.setPosition(newPosition);
        playlistSongRepository.save(playlistSong);

        List<PlaylistSong> finalSongs = playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlistId);
        int normalizedPosition = 1;
        for (PlaylistSong song : finalSongs) {
            if (song.getPosition() != normalizedPosition) {
                song.setPosition(normalizedPosition);
                playlistSongRepository.save(song);
            }
            normalizedPosition++;
        }
        return new MessageResponse("Song reordered successfully to position " + newPosition);
    }

    @Override
    public PaginatedResponse<PlaylistResponse> getAllPublicPlaylists(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Playlist> playlistPage;
        if (search != null && !search.isEmpty()) {
            playlistPage = playlistRepository.findPublicPlaylistwithSongsByNameOrDescription(search.trim(), pageable);

        } else {
            playlistPage = playlistRepository.findPublicPlaylistswithSongs(pageable);
        }

        List<PlaylistResponse> playlistResponses = playlistPage.getContent().stream()
                .map(playlist -> PlaylistResponse.fromEntity(playlist, baseUrl))
                .collect(Collectors.toList());
        return new PaginatedResponse<>(
                playlistResponses,
                playlistPage.getNumber(),
                playlistPage.getSize(),
                playlistPage.getTotalElements(),
                playlistPage.getTotalPages(),
                playlistPage.isLast(),
                playlistPage.isFirst());
    }

    @Override
    public PaginatedResponse<PlaylistResponse> getMyPlaylists(String email, int page, int size, String search) {
        AppUser appUser = getUserByEmail(email);
        Pageable pageable = PageRequest.of(page, size);
        Page<Playlist> playlistPage;
        if (search != null && search.trim().isEmpty()) {
            playlistPage = playlistRepository
                    .findByAppUserIdAndNameContainingIgnoreCaseOrAppUserIdAndDescriptionContainingIgnoreCase(
                            appUser.getId(), search.trim(), appUser.getId(), search.trim(), pageable);
        } else {
            playlistPage = playlistRepository.findByAppUserId(appUser.getId(), pageable);
        }
        List<PlaylistResponse> playlistResponses = playlistPage.getContent().stream()
                .map(playlist -> PlaylistResponse.fromEntity(playlist, baseUrl))
                .collect(Collectors.toList());
        return new PaginatedResponse<>(
                playlistResponses,
                playlistPage.getNumber(),
                playlistPage.getSize(),
                playlistPage.getTotalElements(),
                playlistPage.getTotalPages(),
                playlistPage.isLast(),
                playlistPage.isFirst());

    }

    @Override
    public PlaylistWithSongResponse getPlaylistWithSongs(long playlistId, String email) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));

        if (!playlist.getIsPublic()) {
            if (email == null) {
                throw new RuntimeException("This Playlist is private");
            }
            AppUser appUser = getUserByEmail(email);
            boolean isOwner = playlist.getAppUser().getId().equals(appUser.getId());
            boolean isAdmin = "ADMIN".equals(appUser.getRole());
            if (!isOwner && !isAdmin) {
                throw new RuntimeException("This playlist is private");
            }
        }

        List<PlaylistSong> playlistSongs = playlistSongRepository.findByPlaylistIdOrderByPositionAsc(playlistId);
        return PlaylistWithSongResponse.fromEntity(playlist, playlistSongs, baseUrl);
    }

    private AppUser getUserByEmail(String email) {
        return appUserRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public PlaylistResponse updatePlaylistPrivacy(Long id, boolean isPublic, String email) {
        Playlist playlist = validatePlaylistAccess(id, email);
        playlist.setIsPublic(isPublic);
        Playlist updatedPlaylist = playlistRepository.save(playlist);
        return PlaylistResponse.fromEntity(updatedPlaylist, baseUrl);

    }

    private Playlist validatePlaylistAccess(Long id, String email) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));
        AppUser appUser = getUserByEmail(email);
        boolean isOwner = playlist.getAppUser().getId().equals(appUser.getId());
        boolean isAdmin = "ADMIN".equals(appUser.getRole());
        if (!isOwner && !isAdmin) {
            throw new RuntimeException("You dont have permission to modify this playlist");
        }
        return playlist;
    }

    @Override
    public MessageResponse deletePlaylist(Long playlistId, String email) {
        Playlist playlist = validatePlaylistAccess(playlistId, email);
        playlistSongRepository.deleteByPlaylistId(playlistId);
        playlistRepository.delete(playlist);
        return new MessageResponse("Playlist deleted successfully");
    }

}
