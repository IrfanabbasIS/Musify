package com.bd.musify.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaylistRequest {

    @NotBlank(message = "Name is required")
    @Size(max=100, message = "Playlisy name must not exceed 100 charcaters")
    private String name;

    @Size(max=500, message = "Description must not exceed 500 characters")
    private String description;

    private Boolean isPublic;


}
