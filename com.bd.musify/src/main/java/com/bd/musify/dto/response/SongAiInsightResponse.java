package com.bd.musify.dto.response;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor  
@AllArgsConstructor

public class SongAiInsightResponse {

    private String analysis;
    private List<String> moods;
    private String genre;
    private Integer tempo;
    private String key;
    private Integer energy;
    private List<String> similarArtists;
    private String recommendedFor;


}
