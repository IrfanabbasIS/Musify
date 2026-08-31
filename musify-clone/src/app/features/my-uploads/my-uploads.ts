import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { Song } from '../../core/models/song.model';
import { SongService } from '../../core/services/song-service';
import { MusicPlayerService } from '../../core/services/music-player-service';
import { AuthService } from '../../core/services/auth-service';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../core/services/notification-service';
import { EditSongDialog } from '../../shared/edit-song-dialog/edit-song-dialog';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { PlaylistSelectorDialog } from '../../shared/playlist-selector-dialog/playlist-selector-dialog';

@Component({
  selector: 'app-my-uploads',
  standalone: false,
  templateUrl: './my-uploads.html',
  styleUrl: './my-uploads.css',
})
export class MyUploads implements OnInit, OnDestroy {
  songs: Song[] = [];
  loading = true;
  loadingMore = false;
  errorMessage = '';

  userId!: number;

  searchQuery = '';

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  hasMoreSongs = true;

  private _scrollTrigger!: ElementRef;
  private observer!: IntersectionObserver;

  @ViewChild('scrollTrigger') set scrollTrigger(el: ElementRef) {
    if (el) {
      this._scrollTrigger = el;
      this.setupInfiniteScroll();
    } else {
      this._scrollTrigger = null!;
    }
  }

  constructor(
    private songService: SongService,
    private musicPlayerService: MusicPlayerService,
    private authService: AuthService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUser()!.id;
    this.loadMySongs();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  setupInfiniteScroll() {
    if (this.observer) {
      this.observer.disconnect();
    }

    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.loadingMore && this.hasMoreSongs) {
          this.loadMoreSongs();
        }
      });
    }, options);

    if (this._scrollTrigger?.nativeElement) {
      this.observer.observe(this._scrollTrigger.nativeElement);
    }
  }

  loadMySongs() {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 0;
    this.songs = [];

    this.songService
      .getAllsongs(this.currentPage, this.pageSize, this.searchQuery, this.userId)
      .subscribe({
        next: (response) => {
          this.songs = response.content;
          this.totalElements = response.totalElements;
          this.hasMoreSongs = !response.last;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.log(error);
          this.errorMessage = 'Failed to load your uploads. Please try again later';
          this.loading = false;
        },
      });
  }

  loadMoreSongs() {
    if (this.loadingMore || !this.hasMoreSongs) return;

    this.loadingMore = true;
    this.errorMessage = '';
    this.currentPage++;

    this.songService
      .getAllsongs(this.currentPage, this.pageSize, this.searchQuery, this.userId)
      .subscribe({
        next: (response) => {
          this.songs = [...this.songs, ...response.content];
          this.hasMoreSongs = !response.last;
          this.loadingMore = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.log(error);
          this.loadingMore = false;
          this.currentPage--;
        },
      });
  }

  onSearch() {
    this.loadMySongs();
  }

  clearSearch() {
    this.searchQuery = '';
    
    this.loadMySongs();
  }

  playSong(song: Song) {
    this.musicPlayerService.playSong(song);
  }

  openAddToPlaylistDialog(event: Event, song: Song) {
    event.stopPropagation();
    this.dialog.open(PlaylistSelectorDialog, {
      width: '450px',
      maxWidth: '90w',
      panelClass: 'custom-dialog-container',
      data: { song },
    });
  }

  editSong(event: Event, song: Song) {
    event.stopPropagation();

    const dialogRef = this.dialog.open(EditSongDialog, {
      width: '90vw',
      maxWidth: '1200px',
      panelClass: ['custom-dialog-container', 'edit-song-dialog'],
      data: { song },
    });

    dialogRef.afterClosed().subscribe((FormData) => {
      if (!FormData) return;
      this.songService.updateSong(song.id, FormData).subscribe({
        next: (updatedSong) => {
          const index = this.songs.findIndex((s) => s.id === song.id);
          if (index !== -1) {
            this.songs[index] = updatedSong;
          }
          this.notificationService.success('Song updated successfully');
        },
        error: (error) => {
          console.log(error);
          const errorMessage = error?.error?.message || 'Failed to update song. Please try again,';
          this.notificationService.error(this.errorMessage);
        },
      });
    });
  }

  deleteSong(event: Event, song: Song) {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      width: '450px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog-container',
      data: {
        title: 'Delete Song',
        message: `Are you sure want to delete "${song.title}"?`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.songService.deleteSong(song.id).subscribe({
        next: (response) => {
          const index = this.songs.findIndex((s) => s.id === song.id);
          this.songs = this.songs.filter((s) => s.id !== song.id);
          this.notificationService.success(response.message);
        },
        error: (error) => {
          console.log(error);
          const errorMessage = error?.error?.message || 'Failed to delete song. Please try again,';
          this.notificationService.error(this.errorMessage);
        },
      });
    });
  }
}
