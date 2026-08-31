package com.bd.musify.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.bd.musify.entity.PlaylistSong;

@Repository
public interface PlaylistSongRepository  extends JpaRepository<PlaylistSong, Long>{

    @Transactional
    @Modifying
    void deleteBySongId(Long songId);

    boolean existsByPlaylistIdAndSongId(Long playlistId, Long songId);

    List<PlaylistSong> findByPlaylistIdOrderByPositionAsc(Long playlistId);

    Optional<PlaylistSong> findByPlaylistIdAndSongId(Long playlistId, Long songId);

    @Modifying
    @Transactional
    void deleteByPlaylistId(Long playlistId);

}
