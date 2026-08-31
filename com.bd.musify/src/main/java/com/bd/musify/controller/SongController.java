package com.bd.musify.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bd.musify.dto.response.SongAiInsightResponse;
import com.bd.musify.service.SongService;

@RestController
@RequestMapping("/api/song")
public class SongController 
{
    @Autowired
    private SongService songService;

    @GetMapping("/getSongAiInsights/{songId}")
    public ResponseEntity<SongAiInsightResponse> getSongAiInsights(@PathVariable Long songId)

    {
        SongAiInsightResponse response=songService.getSongAiInsights(songId);
        return ResponseEntity.ok(response);
    }

}
