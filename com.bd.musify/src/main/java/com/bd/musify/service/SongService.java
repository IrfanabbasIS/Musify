package com.bd.musify.service;

import org.springframework.web.multipart.MultipartFile;

import com.bd.musify.dto.request.SongRequest;
import com.bd.musify.dto.response.MessageResponse;
import com.bd.musify.dto.response.SongAiInsightResponse;
import com.bd.musify.dto.response.SongResponse;

public interface SongService {

    SongResponse addSong(SongRequest request, MultipartFile songFile, MultipartFile imagFile, String email);

   
    Object getAllSongs(Long userId, int page, int size, String search);


    SongResponse getSongById(Long id);


    SongResponse updateSong(Long id, SongRequest songRequest, MultipartFile songFile, MultipartFile imagFile,
            String email);


    MessageResponse deleteSong(Long id, String email);


    SongAiInsightResponse getSongAiInsights(Long songId);

    
} 