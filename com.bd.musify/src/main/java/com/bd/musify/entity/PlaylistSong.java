package com.bd.musify.entity;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;

import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaylistSong {
    
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="playlist_id", nullable=false)
    private Playlist playlist;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="song_id", nullable=false)
    private Song song;

    @CreationTimestamp
    @Column(name="added_at", nullable=false, updatable=false)
    private LocalDateTime addedAt;

    @Column(nullable=false)
    private Integer position;

}
