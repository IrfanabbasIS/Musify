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
public class Song {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String title;

    @Column(nullable=false)
    private String artist;

    @Column(nullable=false, name="song_url")
    private String songUrl;

    @Column(name="image_url")
    private String imageUrl;

    @CreationTimestamp
    @Column(nullable=false, name="created_at", updatable=false)
    private LocalDateTime createdAt;



    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="appuser_id", nullable=false)
    private AppUser appUser;



}
