package com.bd.musify.serviceImpl;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.bd.musify.dto.request.SongRequest;
import com.bd.musify.dto.response.MessageResponse;
import com.bd.musify.dto.response.PaginatedResponse;
import com.bd.musify.dto.response.SongAiInsightResponse;
import com.bd.musify.dto.response.SongResponse;
import com.bd.musify.entity.AppUser;

import com.bd.musify.entity.Song;
import com.bd.musify.repository.AppUserRepository;
import com.bd.musify.repository.PlaylistSongRepository;
import com.bd.musify.repository.SongRepository;
import com.bd.musify.service.GenericGeminiService;
import com.bd.musify.service.SongService;
import com.bd.musify.util.FileHandlerUtil;

@Service
public class SongServiceImpl implements SongService{
    @Autowired
    private SongRepository songRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired

    private PlaylistSongRepository playlistSongRepository;

    @Autowired
    private FileHandlerUtil fileHandlerUtil;

    @Autowired
    private GenericGeminiService geminiService;

    @Value("${app.base.url}")
    private String baseUrl;


    @Override
    public SongResponse addSong(SongRequest request, MultipartFile songFile, MultipartFile imagFile, String email)
    {
        AppUser appUser=getUserByEmail(email);
        String uniqueid=UUID.randomUUID().toString();
        Song song=new Song();
        song.setAppUser(appUser);
        updateSongMetadata(song, request);

        String songurl=processSongFile(songFile, uniqueid);
        song.setSongUrl(songurl);

        String imageUrl=processImageFile(imagFile, uniqueid);
        song.setImageUrl(imageUrl);

        Song savedSong=songRepository.save(song);
        return SongResponse.fromEntity(savedSong, baseUrl);
    }

     @Override
     public  Object getAllSongs(Long userId, int page, int size, String search) 
     {
        Pageable pageable=PageRequest.of(page, size);
        Page<Song> songPage;
        boolean hasSearch=search!=null && !search.trim().isEmpty();
        boolean hasUserid=userId!=null;
        if(hasUserid && hasSearch)
        {
            songPage=songRepository.findByAppUserIdAndTitleContainingIgnoreCaseOrAppUserIdAndArtistContainingIgnoreCase(
            userId, search.trim(), userId, search.trim(), null);
        }else if(hasSearch)
        {
            songPage=songRepository.findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCase( search.trim(),  search.trim(), pageable);
        }else if(hasUserid)
        {
            songPage=songRepository.findByAppUserId(userId, pageable);
        }else
        {
            songPage=songRepository.findAll(pageable);
        }

        List<SongResponse> songResponse= songPage.getContent().stream()
        .map(songc-> SongResponse.fromEntity(songc, baseUrl))
        .collect(Collectors.toList()); 
        return new PaginatedResponse<>(
            songResponse,
            songPage.getNumber(),
            songPage.getSize(),
            songPage.getTotalElements(),
            songPage.getTotalPages(),
            songPage.isLast(),
            songPage.isFirst()

        );

     }

      @Override
     public SongResponse updateSong(Long id, SongRequest request, MultipartFile songFile, MultipartFile imagFile,
            String email) 
    {
        Song song=validateSongAcssess(id, email);
        updateSongMetadata(song, request);
        if(songFile!=null && !songFile.isEmpty())
        {
            deleteOldSongFile(song.getSongUrl());
            String uniqueid=UUID.randomUUID().toString();
            String songUrl=processSongFile(songFile, uniqueid);
            song.setSongUrl(songUrl);
        }

        if(imagFile !=null && !imagFile.isEmpty())
        {
            deleteOldImageFile(song.getImageUrl());
            String uniqueid=UUID.randomUUID().toString();
            String imageUrl=processImageFile(imagFile, uniqueid);
            song.setImageUrl(imageUrl);
        }

        Song updatedSong=songRepository.save(song);
        return SongResponse.fromEntity(updatedSong, baseUrl);
        

       
     }

     @Override
    public MessageResponse deleteSong(Long id, String email)
    {
        Song song=validateSongAcssess(id, email);
        playlistSongRepository.deleteBySongId(id);
        deleteSongFiles(song);
        songRepository.delete(song);
        return new MessageResponse("Song deleted sccessfully");
    }
     @Override
    public SongAiInsightResponse getSongAiInsights(Long songId) 
    {
        Song song=songRepository.findById(songId)
        .orElseThrow( ()-> new RuntimeException("Song not found"));
        
        String prompt=buildSongAnalysisPrompt(song);
        return geminiService.generateContent(prompt, SongAiInsightResponse.class);
    }

    private String buildSongAnalysisPrompt(Song song) 
    {
        return String.format(
            """
                Analyze the song '%s' by '%s' and provide detailed insights in JSON format.

                Return a JSON object with the following structure:
                {
                    "analysis": "A detailed 2-3 sentence analysis of the track's musical characteristics, production quality, and emotional impact",
                    "moods": ["List", "of", "4-6", "mood", "keywords"],
                    "genre": "Primary genre classification",
                    "tempo": 120,
                    "key": "Musical key (e.g., C Major, D Minor)",
                    "energy": 7,
                    "similarArtists": ["List", "of", "4-6", "similar", "artists"],
                    "recommendedFor": "A 1-2 sentence recommendation about when and where to listen to this song"
                }

                Important:
                - The 'tempo' should be an estimated BPM (beats per minute) between 60-200
                - The 'energy' should be a rating from 1-10
                - Base your analysis on the artist's typical style and the song title
                - Be creative but realistic
                - Return ONLY the JSON object, no additional text
                """, song.getTitle(), song.getArtist()
        );
    }


    


    

    

    

    private void updateSongMetadata(Song song, SongRequest request) 
    {
        song.setTitle(request.getTitle());
        song.setArtist(request.getArtist());

    }


    private AppUser getUserByEmail(String email)
    {
        return appUserRepository.findByEmail(email)
        .orElseThrow(()-> new RuntimeException("User not found"));
    }

    private String processSongFile(MultipartFile songFile, String uniqueid) 
    {
        String songExtension=fileHandlerUtil.getFileExtension(songFile.getOriginalFilename());
        String songFilename=uniqueid+songExtension;
        fileHandlerUtil.saveSongFileWithName(songFile, songFilename);
        return "/api/file/song/" + songFilename;
        
    }

     private String processImageFile(MultipartFile imagFile, String uniqueid) 
    {
        if(imagFile==null || imagFile.isEmpty())
        {
            return null;
        }

        String imageExtension=fileHandlerUtil.getFileExtension(imagFile.getOriginalFilename());
        String imageFileName=uniqueid+imageExtension;
        fileHandlerUtil.saveImageFileWithName(imagFile, imageFileName);
        return "/api/file/image/" +imageFileName;
    }

     @Override
     public SongResponse getSongById(Long id) 
     {
        Song song=songRepository.findById(id)
        .orElseThrow(()-> new RuntimeException("Song not found"));
        return SongResponse.fromEntity(song, baseUrl);
     }

    

     private Song validateSongAcssess(Long id, String email) 
     {
        Song song=songRepository.findById(id)
        .orElseThrow(()-> new RuntimeException("Song not found"));
    
    AppUser appUser=getUserByEmail(email);

    boolean isOwner=song.getAppUser().getId().equals(appUser.getId());
    boolean isAdmin="ADMIN".equals(appUser.getRole());
    if(!isOwner && !isAdmin)
    {
        throw new RuntimeException("You don't have permission to modify this song");

    }
    return song;
     }


     private void deleteOldSongFile(String songUrl) 
    {
        if(songUrl!=null)
        {
            String oldSongFilename=fileHandlerUtil.extractFileName(songUrl);
            if(oldSongFilename!=null)
            {
                fileHandlerUtil.deleteSongFile(oldSongFilename);
            }
        }
    }


    private void deleteOldImageFile(String imageUrl) {
        if(imageUrl !=null)
        {
            String oldImageFileName=fileHandlerUtil.extractFileName(imageUrl);
            if(oldImageFileName !=null )
            {
                fileHandlerUtil.deleteImageFile(oldImageFileName);
            }
        }
    }

    private void deleteSongFiles(Song song) 
    {
        deleteOldSongFile(song.getSongUrl());
        deleteOldImageFile(song.getImageUrl());
    }

   

    




    

    
} 