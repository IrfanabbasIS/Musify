import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Playlist } from '../../core/models/playlist.omdels';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SongDialogData } from '../../core/models/dialog.model';
import { PlaylistService } from '../../core/services/playlist-service';
import { NotificationService } from '../../core/services/notification-service';

@Component({
  selector: 'app-playlist-selector-dialog',
  standalone: false,
  templateUrl: './playlist-selector-dialog.html',
  styleUrl: './playlist-selector-dialog.css',
})
export class PlaylistSelectorDialog implements OnInit, OnDestroy {
  playlists: Playlist[] = [];
  loading = true;
  loadingMorePlaylists = false;
  adding = false;
  errorMessage = '';
  selectedPlaylistId: number | null = null;

  currentPage = 0;
  pageSize = 10;
  hasMorePlaylists = true;

  private _scrollTriggerPlaylists!: ElementRef;
  private playlistObserver!: IntersectionObserver;

  @ViewChild('scrollTriggerPlaylists') set scrollTriggerPlaylists(el: ElementRef) {
    if (el) {
      this._scrollTriggerPlaylists = el;
      this.setupPlaylistsInfiniteScroll();
    } else {
      this._scrollTriggerPlaylists = null!;
    }
  }

  constructor(
    private dialogRef: MatDialogRef<PlaylistSelectorDialog>,
    @Inject(MAT_DIALOG_DATA) public data: SongDialogData,
    private playlistService: PlaylistService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadPlaylists();
  }

  ngOnDestroy(): void {
    if (this.playlistObserver) {
      this.playlistObserver.disconnect();
    }
  }

  setupPlaylistsInfiniteScroll() {
    if (this.playlistObserver) {
      this.playlistObserver.disconnect();
    }

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    this.playlistObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.loadingMorePlaylists && this.hasMorePlaylists) {
          this.loadMorePlaylists();
        }
      });
    }, options);

    if (this._scrollTriggerPlaylists?.nativeElement) {
      this.playlistObserver.observe(this._scrollTriggerPlaylists.nativeElement);
    }
  }

  loadPlaylists() {
    this.currentPage = 0;
    this.playlists = [];
    this.loading = true;
    this.errorMessage = '';

    this.playlistService.getMyPlaylist(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.playlists = response.content;
        this.hasMorePlaylists = !response.last;
        this.loading = false;
        this.cdr.detectChanges();
      },

      error: () => {
        this.errorMessage = 'Failed to load playlists. Please try again.';
        this.notificationService.error('Failed to load playlists.Pease try again.');
        this.playlists = [];
        this.loading = false;
      },
    });
  }

  loadMorePlaylists() {
    if (this.loadingMorePlaylists || !this.hasMorePlaylists) return;

    this.loadingMorePlaylists = true;
    this.currentPage++;

    this.playlistService.getMyPlaylist(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.playlists = [...this.playlists, ...response.content];
        this.hasMorePlaylists = !response.last;
        this.loadingMorePlaylists = false;
        this.cdr.detectChanges();
      },

      error: () => {
        this.loadingMorePlaylists = false;
        this.currentPage--;
      },
    });
  }

  addToPlaylist(playlist: Playlist) {
    if (this.adding) return;

    this.adding = true;
    this.errorMessage = '';
    this.selectedPlaylistId = playlist.id;
    this.playlistService.addSongToPlaylist(playlist.id, this.data.song.id).subscribe({
      next: (response) => {
        this.adding = false;
        const message = response.message || `Added to "${playlist.name}"`;
        this.notificationService.success(message);
        this.dialogRef.close({ success: true, playlistName: playlist.name });
        this.cdr.detectChanges();
      },
      error: (error) => {
        const errorMessage =
          error.error?.message ||
          `Failed to add to "${playlist.name}". The song may already bbe in the playlist.`;
        this.errorMessage = errorMessage;
        this.notificationService.error(errorMessage);
        this.adding = false;
        this.selectedPlaylistId = null;
        this.cdr.detectChanges();
      },
    });
  }

  onClose(){
    this.dialogRef.close();
  }
}
