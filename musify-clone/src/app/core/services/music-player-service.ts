import { inject, Injectable, OnDestroy } from '@angular/core';
import { AuthHttpService } from './auth-http-service';
import { BehaviorSubject } from 'rxjs';
import { Song } from '../models/song.model';

export type ReapeatMode = 'off' | 'all' | 'one';

@Injectable({
  providedIn: 'root',
})
export class MusicPlayerService implements OnDestroy {
  private authHttpService = inject(AuthHttpService);
  private audio: HTMLAudioElement;
  private currentSongSubject = new BehaviorSubject<Song | null>(null);
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  private currentTimeSubject = new BehaviorSubject<number>(0);
  private durationSubject = new BehaviorSubject<number>(0);
  private volumeSubject = new BehaviorSubject<number>(1);
  private currentBlobUrl: string | null = null;

  private queueSubject = new BehaviorSubject<Song[]>([]);
  private CurrentIndexSubject = new BehaviorSubject<number>(-1);

  private isShuffleSubject = new BehaviorSubject<boolean>(false);
  private repeatModeSubject = new BehaviorSubject<ReapeatMode>('off');
  private originalQueue: Song[] = [];

  private isExpandedSubject = new BehaviorSubject<boolean>(false);

  public currentSong$ = this.currentSongSubject.asObservable();
  public isPlaying$ = this.isPlayingSubject.asObservable();
  public currentTime$ = this.currentTimeSubject.asObservable();

  public duration$ = this.durationSubject.asObservable();
  public volume$ = this.volumeSubject.asObservable();
  public queue$ = this.queueSubject.asObservable();
  public currentIndex$ = this.CurrentIndexSubject.asObservable();
  public isShuffle$ = this.isShuffleSubject.asObservable();
  public repeatMode$ = this.repeatModeSubject.asObservable();
  public isExpanded$ = this.isExpandedSubject.asObservable();

  constructor() {
    this.audio = new Audio();
    this.audio.volume = 1;
    this.audio.preload = 'metadata';

    this.audio.addEventListener('timeupdate', () => {
      this.currentTimeSubject.next(this.audio.currentTime);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.durationSubject.next(this.audio.duration);
    });

    this.audio.addEventListener('ended', () => {
      this.isPlayingSubject.next(false);
      this.handleSongEnd();
    });

    this.audio.addEventListener('play', () => {
      this.isPlayingSubject.next(true);
    });

    this.audio.addEventListener('pause', () => {
      this.isPlayingSubject.next(false);
    });
  }

  async playSong(song: Song, updateQueue: boolean = true): Promise<void> {
    const isSameSong = this.currentSongSubject.value?.id === song.id;

    if (isSameSong && !this.audio.paused) {
      this.pause();
    } else if (isSameSong && this.audio.paused) {
      this.play();
    } else {
      this.currentSongSubject.next(song);

      if (updateQueue) {
        const queue = this.queueSubject.value;
        const indexInQueue = queue.findIndex((s) => s.id === song.id);

        if (indexInQueue >= 0) {
          this.CurrentIndexSubject.next(indexInQueue);
        } else {
          this.queueSubject.next([song]);
          this.CurrentIndexSubject.next(0);
        }
      }

      try {
        await this.loadAudioFromUrl(song.songUrl);
        console.log('Audio loaded:', song.title);
        this.play();
      } catch (error) {
        console.error('FAILED TO LOAD SONG:', song);
        console.error('songUrl:', song.songUrl);
        console.error('ERROR:', error);
        this.currentSongSubject.next(null);
        this.isPlayingSubject.next(false);
      }
    }
  }

  //old local url method
  // private async loadAudioFromUrl(url: string): Promise<void> {
  //   if (this.currentBlobUrl) {
  //     URL.revokeObjectURL(this.currentBlobUrl);
  //     this.currentBlobUrl = null;
  //   }

  //   const blob = await this.authHttpService.fetcBlob(url);
  //   const blobUrl = URL.createObjectURL(blob);

  //   this.currentBlobUrl = blobUrl;
  //   this.audio.src = blobUrl;
  //   return new Promise((resolve, reject) => {
  //     const onCanPlay = () => {
  //       this.audio.removeEventListener('canplay', onCanPlay);
  //       this.audio.removeEventListener('error', onError);
  //       resolve();
  //     };

  //     const onError = () => {
  //       this.audio.removeEventListener('canplay', onCanPlay);
  //       this.audio.removeEventListener('error', onError);
  //       reject(new Error('Failed to load audio'));
  //     };

  //     this.audio.addEventListener('canplay', onCanPlay);
  //     this.audio.addEventListener('error', onError);
  //     this.audio.load();
  //   });
  // }

  //new cloudinary compatible method
  private async loadAudioFromUrl(url: string): Promise<void> {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    let blob: Blob;

    if (url.startsWith('http') && !url.includes('/api/file/')) {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      blob = await response.blob();
    } else {
      blob = await this.authHttpService.fetcBlob(url);
    }

    const blobUrl = URL.createObjectURL(blob);

    this.currentBlobUrl = blobUrl;
    this.audio.src = blobUrl;

    return new Promise((resolve, reject) => {
      const onCanPlay = () => {
        this.audio.removeEventListener('canplay', onCanPlay);
        this.audio.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        this.audio.removeEventListener('canplay', onCanPlay);
        this.audio.removeEventListener('error', onError);
        reject(new Error('Failed to load audio'));
      };

      this.audio.addEventListener('canplay', onCanPlay);
      this.audio.addEventListener('error', onError);
      this.audio.load();
    });
  }

  play(): void {
    if (this.audio.src) {
      this.audio.play().catch((error) => {
        console.error('Error playing audio:', error);
      });
    }
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.currentSongSubject.next(null);
    this.isPlayingSubject.next(false);
    this.currentTimeSubject.next(0);
    this.durationSubject.next(0);
    this.queueSubject.next([]);
    this.CurrentIndexSubject.next(-1);
    this.isShuffleSubject.next(false);
    this.repeatModeSubject.next('off');

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    this.audio.src = '';
  }

  togglePlayPause() {
    if (this.audio.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  seekTo(time: number) {
    this.audio.currentTime = time;
  }

  setVolume(volume: number) {
    this.audio.volume = volume;
    this.volumeSubject.next(volume);
  }

  getCurrentSong(): Song | null {
    return this.currentSongSubject.value;
  }

  isPlaying(): boolean {
    return this.isPlayingSubject.value;
  }

  setQueue(songs: Song[], startIndex: number = 0): void {
    this.queueSubject.next(songs);
    this.CurrentIndexSubject.next(startIndex);

    if (songs.length > 0 && startIndex >= 0 && startIndex < songs.length) {
      this.playSong(songs[startIndex], false);
    }
  }

  handleSongEnd() {
    const repeatMode = this.repeatModeSubject.value;
    if (repeatMode === 'one') {
      this.seekTo(0);
      this.play();
    } else if (repeatMode === 'all') {
      const queue = this.queueSubject.value;
      const currentIndex = this.CurrentIndexSubject.value;

      if (currentIndex < queue.length - 1) {
        this.playNext();
      } else {
        this.CurrentIndexSubject.next(0);
        this.playSong(queue[0], false);
      }
    } else {
      this.playNext();
    }
  }

  playNext() {
    const queue = this.queueSubject.value;
    const currentIndex = this.CurrentIndexSubject.value;

    if (queue.length > 0 && currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      this.CurrentIndexSubject.next(nextIndex);
      this.playSong(queue[nextIndex], false);
    }
  }

  playPrevious() {
    const queue = this.queueSubject.value;
    const currentIndex = this.CurrentIndexSubject.value;

    if (queue.length > 0 && currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      this.CurrentIndexSubject.next(previousIndex);
      this.playSong(queue[previousIndex], false);
    }
  }

  hasNext(): boolean {
    const queue = this.queueSubject.value;
    const currentIndex = this.CurrentIndexSubject.value;
    const repeatMode = this.repeatModeSubject.value;

    if (repeatMode === 'all' && queue.length > 0) {
      return true;
    }
    return queue.length > 0 && currentIndex < queue.length - 1;
  }

  hasPrevious(): boolean {
    const queue = this.queueSubject.value;
    const currentIndex = this.CurrentIndexSubject.value;
    return queue.length > 0 && currentIndex > 0;
  }

  getQueue(): Song[] {
    return this.queueSubject.value;
  }

  getCurrentIndex(): number {
    return this.CurrentIndexSubject.value;
  }

  toggleShuffle() {
    const currentShuffle = this.isShuffleSubject.value;
    const newShuffle = !currentShuffle;
    this.isShuffleSubject.next(newShuffle);

    const queue = this.queueSubject.value;
    const currentSong = this.currentSongSubject.value;

    if (newShuffle) {
      this.originalQueue = [...queue];
      const shuffled = this.shuffleArray([...queue], currentSong);
      this.queueSubject.next(shuffled);
      this.CurrentIndexSubject.next(0);
    } else {
      if (this.originalQueue.length > 0) {
        const currentSongIndex = this.originalQueue.findIndex((s) => s.id === currentSong?.id);
        this.queueSubject.next([...this.originalQueue]);
        this.CurrentIndexSubject.next(currentSongIndex >= 0 ? currentSongIndex : 0);
        this.originalQueue = [];
      }
    }
  }

  private shuffleArray(array: Song[], currentSong: Song | null): Song[] {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    if (currentSong) {
      const currentIndex = shuffled.findIndex((s) => s.id === currentSong.id);
      if (currentIndex >= 0) {
        const [song] = shuffled.splice(currentIndex, 1);
        shuffled.unshift(song);
      }
    }
    return shuffled;
  }

  isShuffle(): boolean {
    return this.isShuffleSubject.value;
  }

  toggleRepeat() {
    const currentMode = this.repeatModeSubject.value;
    let newMode: ReapeatMode;
    if (currentMode === 'off') {
      newMode = 'all';
    } else if (currentMode === 'all') {
      newMode = 'one';
    } else {
      newMode = 'off';
    }
    this.repeatModeSubject.next(newMode);
  }

  getRepeatMode(): ReapeatMode {
    return this.repeatModeSubject.value;
  }

  toggleExpanded(): void {
    const currentExpanded = this.isExpandedSubject.value;
    this.isExpandedSubject.next(!currentExpanded);
  }

  setExpanded(expanded: boolean) {
    this.isExpandedSubject.next(expanded);
  }

  isExpanded(): boolean {
    return this.isExpandedSubject.value;
  }

  ngOnDestroy(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }
}
