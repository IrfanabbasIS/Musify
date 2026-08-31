package com.bd.musify.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bd.musify.entity.Song;

@Repository
public interface SongRepository extends JpaRepository<Song,Long> 
{
    Page<Song> findByAppUserIdAndTitleContainingIgnoreCaseOrAppUserIdAndArtistContainingIgnoreCase(Long userId1,
    String title, Long userId2, String artist, Pageable pageable);

    Page<Song> findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCase(String trim, String trim2,
            Pageable pageable);

    Page<Song> findByAppUserId(Long appUserId, Pageable pageable);

}
