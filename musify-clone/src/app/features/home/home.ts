import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Song } from '../../core/models/song.model';
import { Playlist } from '../../core/models/playlist.omdels';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { SongService } from '../../core/services/song-service';
import { PlaylistService } from '../../core/services/playlist-service';
import { MusicPlayerService } from '../../core/services/music-player-service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification-service';
import { PlaylistSelectorDialog } from '../../shared/playlist-selector-dialog/playlist-selector-dialog';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  songs: Song[] = [];
  playlists: Playlist[] = [];
  loading = true;
  errorMessage = '';
  currentPlayingSongId: number | null = null;

  private typingInterval: any | null = null;
  private destroy$ = new Subject<void>();

  searchQuery = '';
  playlistSearchQuery = '';

  loadingMore = false;
  currentPage = 0;
  pageSize = 10;
  hasMoreSongs = true;

  playlistsExpanded = true;
  loadingMorePlaylists = false;
  currentPlaylistPage = 0;
  playlistPageSize = 10;
  hasMorePlaylists = true;

  private _scrollTriggerPlaylists!: ElementRef;
  private playlistObserver!: IntersectionObserver;

  private _scrollTrigger!: ElementRef;
  private observer!: IntersectionObserver;

  @ViewChild('scrollTriggerPlaylists') set scrollTriggerPlaylists(el: ElementRef) {
    if (el) {
      this._scrollTriggerPlaylists = el;
      this.setupPlaylistsInfiniteScroll();
    } else {
      this._scrollTriggerPlaylists = null!;
    }
  }

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
    private playlistService: PlaylistService,
    private musicPlayerService: MusicPlayerService,
    private dialog: MatDialog,
    private router: Router,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();

    this.musicPlayerService.currentSong$.pipe(takeUntil(this.destroy$)).subscribe((song) => {
      this.currentPlayingSongId = song?.id || null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.playlistObserver) {
      this.playlistObserver.disconnect();
    }

    if (this.typingInterval) {
      clearTimeout(this.typingInterval);
    }
  }

  private startTypingEffect() {
    const text = 'Musify';
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;

    let charIndex = 0;
    let isDeleting = false;

    const type = () => {
      const currentText = text.substring(0, charIndex);
      typingElement.innerHTML = currentText + '<span class="typing-cursor"> | </span>';

      if (!isDeleting && charIndex < text.length) {
        charIndex++;
        this.typingInterval = setTimeout(type, 150);
      } else if (!isDeleting && charIndex === text.length) {
        this.typingInterval = setTimeout(() => {
          isDeleting = true;
          type();
        }, 2000);
      } else if (isDeleting && charIndex > 0) {
        charIndex--;
        this.typingInterval = setTimeout(type, 100);
      } else if (isDeleting && charIndex === 0) {
        this.typingInterval = setTimeout(() => {
          isDeleting = false;
          type();
        }, 500);
      }
    };

    type();
  }

  loadData() {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 0;
    this.currentPlaylistPage = 0;
    this.songs = [];
    this.playlists = [];

    Promise.all([
      firstValueFrom(
        this.songService.getAllsongs(this.currentPage, this.pageSize, this.searchQuery),
      ),
      firstValueFrom(
        this.playlistService.getAllPublicPlaylists(
          this.currentPlaylistPage,
          this.playlistPageSize,
          this.playlistSearchQuery,
        ),
      ),
    ])
      .then(([songsResponse, playlistsResponse]) => {
        this.songs = songsResponse.content;
        this.hasMoreSongs = !songsResponse.last;
        this.playlists = playlistsResponse.content;
        this.hasMorePlaylists = !playlistsResponse.last;
        this.loading = false;
        this.cdr.detectChanges();
        this.startTypingEffect();
      })
      .catch(() => {
        this.errorMessage = 'Failed to load content. Please try again later.';
        this.songs = [];
        this.playlists = [];
        this.loading = false;
      });
  }

  setupPlaylistsInfiniteScroll() {
    if (this.playlistObserver) {
      this.playlistObserver.disconnect();
    }

    const options = {
      root: null,
      rootMargin: '200px',
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

  loadMorePlaylists() {
    if (this.loadingMorePlaylists || !this.hasMorePlaylists) return;

    this.loadingMorePlaylists = true;
    this.currentPlaylistPage++;

    this.playlistService
      .getAllPublicPlaylists(
        this.currentPlaylistPage,
        this.playlistPageSize,
        this.playlistSearchQuery,
      )
      .subscribe({
        next: (response) => {
          this.playlists = [...this.playlists, ...response.content];
          this.hasMorePlaylists = !response.last;
          this.loadingMorePlaylists = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingMorePlaylists = false;
          this.currentPlaylistPage--;
          this.notificationService.error('Failed to load more playlists.Please try again.');
        },
      });
  }

  loadMoreSongs() {
    if (this.loadingMore || !this.hasMoreSongs) return;

    this.loadingMore = true;
    this.currentPage++;

    this.songService.getAllsongs(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response) => {
        this.songs = [...this.songs, ...response.content];
        this.hasMoreSongs = !response.last;
        this.loadingMore = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMore = false;
        this.currentPage--;
        this.notificationService.error('Failed to load more songs.Please try again.');
      },
    });
  }

  onSearchPlaylists() {
    this.loadingMorePlaylists = true;
    this.currentPlaylistPage = 0;
    this.playlists = [];

    this.playlistService
      .getAllPublicPlaylists(
        this.currentPlaylistPage,
        this.playlistPageSize,
        this.playlistSearchQuery,
      )
      .subscribe({
        next: (response) => {
          this.playlists = response.content;
          this.hasMorePlaylists = !response.last;
          this.loadingMorePlaylists = false;
        },
        error: () => {
          this.loadingMorePlaylists = false;
          this.playlists = [];
          this.notificationService.error('Failed to search playlists.Please try again.');
        },
      });
  }

  clearPlaylistSearch() {
    this.playlistSearchQuery = '';
    this.onSearchPlaylists();
  }

  onSearch() {
    this.loadingMore = true;
    this.currentPage = 0;
    this.songs = [];

    this.songService.getAllsongs(this.currentPage, this.pageSize, this.searchQuery).subscribe({
      next: (response) => {
        this.songs = response.content;
        this.hasMoreSongs = !response.last;
        this.loadingMore = false;
      },
      error: () => {
        this.loadingMore = false;
        this.songs = [];
        this.notificationService.error('Failed to search songs.Please try again.');
      },
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.onSearch();
  }

  playSong(song: Song) {
    const clikedIndex = this.songs.findIndex((s) => s.id === song.id);
    this.musicPlayerService.setQueue(this.songs, clikedIndex >= 0 ? clikedIndex : 0);
  }

  openPlaylist(playlist: Playlist) {
    this.router.navigate(['/playlist', playlist.id]);
  }

  playPlaylist(event: Event, playlist: Playlist) {
    event.stopPropagation();
    this.playlistService.getPlaylistWithSongs(playlist.id).subscribe({
      next: (playlistsWithSongs) => {
        if (playlistsWithSongs.songs && playlistsWithSongs.songs.length > 0) {
          const songs: Song[] = playlistsWithSongs.songs.map((s) => ({
            id: s.songId,
            title: s.title,
            artist: s.artist,
            songUrl: s.songurl,
            imageUrl: s.imageUrl,
            createdAt: '',
            appUserId: 0,
            appUserName: '',
          }));
          this.musicPlayerService.setQueue(songs, 0);
          this.router.navigate(['/playlist', playlist.id]);
        } else {
          this.notificationService.warning('This playloist is empty');
        }
      },
      error: (error) => {
        const errorMessage =
          error?.error?.message || 'Failed to load playlist song. Please try again.';
        this.notificationService.error(errorMessage);
      },
    });
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

  isCurrentlyPlaying(songId: number) {
    return this.currentPlayingSongId === songId;
  }

  togglePlaylists() {
    this.playlistsExpanded = !this.playlistsExpanded;
  }
}
