import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { PlaylistWithSongs, SongInPlaylist } from '../../core/models/playlist.omdels';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaylistService } from '../../core/services/playlist-service';
import { MusicPlayerService } from '../../core/services/music-player-service';
import { AuthService } from '../../core/services/auth-service';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification-service';
import { Song } from '../../core/models/song.model';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-playlist-detail',
  standalone: false,
  templateUrl: './playlist-detail.html',
  styleUrl: './playlist-detail.css',
})
export class PlaylistDetail implements OnInit, OnDestroy {
  playlist: PlaylistWithSongs | null = null;
  loading = true;
  errorMessage = '';
  playlistId: number = 0;
  currentPlayingSongId: number | null = null;
  isOwner = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private playlistService: PlaylistService,
    private musicPlayerService: MusicPlayerService,
    private authService: AuthService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.playlistId = +params['id'];
      if (this.playlistId) {
        this.loadPlaylist();
        //this.cdr.detectChanges();
      }
    });

    this.musicPlayerService.currentSong$.pipe(takeUntil(this.destroy$)).subscribe((song) => {
      this.currentPlayingSongId = song?.id || null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlaylist() {
    this.loading = false;
    this.errorMessage = '';

    this.playlistService.getPlaylistWithSongs(this.playlistId).subscribe({
      next: (playlist) => {
        this.playlist = playlist;
        this.cdr.detectChanges();

        const currentUser = this.authService.getCurrentUser();
        this.isOwner = currentUser ? currentUser.id === playlist.appUserId : false;
      },
      error: (error) => {
        this.errorMessage = error?.message || 'Failed to load playlist.Please try again.';
        this.loading = false;
      },
    });
  }

  playSong(songInPlaylist: SongInPlaylist) {
    const allSongs = this.mapPlaylistSongsToSongs();
    const clickedIndex = this.playlist!.songs.findIndex((s) => s.songId === songInPlaylist.songId);
    this.musicPlayerService.setQueue(allSongs, clickedIndex >= 0 ? clickedIndex : 0);
    this.cdr.detectChanges();
  }

  playAll() {
    if (this.playlist!.songs.length === 0) return;
    this.musicPlayerService.setQueue(this.mapPlaylistSongsToSongs(), 0);
    this.cdr.detectChanges();
    
  }

  private mapPlaylistSongsToSongs(): Song[] {
    return this.playlist!.songs.map(s => ({
      id: s.songId,
      title: s.title,
      artist: s.artist,
      songUrl: s.songurl,
      imageUrl: s.imageUrl,
      createdAt: '',
      appUserId: 0,
      appUserName: '',
    }));
  }

  moveSongUp(event: Event, songInPlaylist: SongInPlaylist, currentIndex: number) {
    event.stopPropagation();
    if (currentIndex === 0) return;

    const newPosition = currentIndex;

    this.playlistService
      .reorderSongInPlaylist(this.playlistId, songInPlaylist.songId, newPosition)
      .subscribe({
        next: (response) => {
          const songs = [...this.playlist!.songs];
          songs.splice(currentIndex, 1);
          songs.splice(currentIndex - 1, 0, songInPlaylist);
          this.playlist!.songs = songs;
          this.cdr.detectChanges();
          this.notificationService.success(response.message);
        },
        error: () => {
          this.notificationService.error('Failed to reorder song.Please try again.');
        },
      });
  }

  moveSongDown(event: Event, songInPlaylist: SongInPlaylist, currentIndex: number) {
    event.stopPropagation();
    if (currentIndex === this.playlist!.songs.length - 1) return;

    const newPosition = currentIndex + 2;

    this.playlistService
      .reorderSongInPlaylist(this.playlistId, songInPlaylist.songId, newPosition)
      .subscribe({
        next: (response) => {
          const songs = [...this.playlist!.songs];
          songs.splice(currentIndex, 1);
          songs.splice(currentIndex + 1, 0, songInPlaylist);
          this.playlist!.songs = songs;
          this.cdr.detectChanges();
          this.notificationService.success(response.message);
        },
        error: () => {
          this.notificationService.error('Failed to reorder song.Please try again.');
        },
      });
  }

  onSongDrop(event:CdkDragDrop<SongInPlaylist[]>)
  {
    if(!this.isOwner) return;
    const previousIndex=event.previousIndex;
    const currentIndex=event.currentIndex;

    if(previousIndex===currentIndex) return;

    const song=this.playlist!.songs[previousIndex];
    moveItemInArray(this.playlist!.songs, previousIndex, currentIndex);

    const newPosition=currentIndex + 1;
    this.playlistService.reorderSongInPlaylist(this.playlistId, song.songId, newPosition).subscribe({
      next:(response)=>{
        this.notificationService.success(response.message);
        this.cdr.detectChanges();
      }, error:()=>{
        moveItemInArray(this.playlist!.songs, currentIndex, previousIndex);
        this.notificationService.error('Failed to reorder song. Pllease try again.');
      }
    })
  }

  removeSongFromPlaylist(event:Event, songInPlaylist:SongInPlaylist)
  {
    event.stopPropagation();

    const dialogRef=this.dialog.open(ConfirmationDialog, {
      width:'450px',
      maxWidth:'90w',
      panelClass:'custom-dialog-container',
      data:{
        title:'Remove Song',
        message:`Remove "${songInPlaylist.title}" from this playlist?`,
        confirmText:'Remove',
        cancelText:'Cancel',
        confirmColor:'warn'
      }
    });
    dialogRef.afterClosed().subscribe(confirmed=>{
      if(!confirmed) return;

      this.playlistService.removeSongFromPlaylist(this.playlistId, songInPlaylist.songId).subscribe({
        next:(response)=>{

          const queue = this.musicPlayerService.getQueue();
  const updatedQueue = queue.filter(song => song.id !== songInPlaylist.songId);

  this.musicPlayerService.setQueue(
    updatedQueue,
    Math.min(
      this.musicPlayerService.getCurrentIndex(),
      updatedQueue.length - 1
    )
  );

          this.loadPlaylist();
          this.cdr.detectChanges();
          this.notificationService.success(response.message);
        },
        error:()=>{
          this.notificationService.error('Failed to remove song from playlist.Please try again');
        }
      })
    })
  }

  deletePlaylist()
  {
    const dialogRef=this.dialog.open(ConfirmationDialog, {
      width:'450px',
      maxWidth:'90w',
      panelClass:'custom-dialog-container',
      data:{
        title:'Delete Playlist',
        message:'Are you sure you want to delete "${this.playlist!.name}"? this action cannot be undone',
        confirmText:'Delete',
        cancelText:'Cancel',
        confirmColor:'warn'
      }
    });
    dialogRef.afterClosed().subscribe(confirmed=>{
      if(!confirmed) return;

      this.playlistService.deletePlaylist(this.playlistId).subscribe({
        next:(response)=>{
          
          this.cdr.detectChanges();
          this.notificationService.success(response.message);
          this.router.navigate(['/home']);
        },
        error:(error)=>{
          this.notificationService.error(error.error?.message || 'Failed to delete playlist.Please try again.');
        }
      })
    })
  }

  togglePrivacy(){
    const newPrivacy=!this.playlist!.isPublic;

    this.playlistService.updatePlaylistPrivacy(this.playlistId, newPrivacy).subscribe({
      next:(updatedPlaylist)=>{
        this.playlist!.isPublic=updatedPlaylist.isPublic;
        this.notificationService.success(`Playlist is now ${updatedPlaylist.isPublic ? 'public' : 'private'}`);
        
      },
      error:(error)=>{
        this.notificationService.error('Failed to update privacy.Please try again.')
      }
    })
  }

  goBack(){
    this.router.navigate(['/home']);
  }

  isCurrentlyPlaying(songId: number)
  {
    return this.currentPlayingSongId===songId;
  }
}
