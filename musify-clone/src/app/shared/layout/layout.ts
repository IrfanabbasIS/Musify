import { ChangeDetectorRef, Component, DestroyRef, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Playlist } from '../../core/models/playlist.omdels';
import { Route, Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../core/services/auth-service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { PlaylistService } from '../../core/services/playlist-service';
import { MusicPlayerService } from '../../core/services/music-player-service';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  animations: [
  trigger('expandCollapse', [
    state('collapsed', style({
      height: '0px',
      opacity: '0',
      overflow: 'hidden'
    })),
    state('expanded', style({
      height: '*',
      opacity: '1',
      overflow: 'visible'
    })),
    transition('collapsed <=> expanded', [
      animate('300ms cubic-bezier(0.4,0.0,0.2,1)')
    ])
  ])
]
})



export class Layout implements OnInit, OnDestroy {

  isExpanded = signal(false);

  toggle() {
    this.isExpanded.update(v => !v);
  }


  userName = 'User';
  private _playLists: Playlist[] = [];
  isAdmin = false;
  isUserMenuExpanded = false;

  playlistSearchQuery = '';
  currentPage = 0;
  pageSize = 1;
  hasMorePlaylists = true;
  loadingMorePlaylists = false;

  get playlists(): Playlist[] {
    return Array.isArray(this._playLists) ? this._playLists : [];

  }

  set playlists(value: Playlist[]) {
    this._playLists = Array.isArray(value) ? value : [];
  }

  private _scrollTriggerPlaylists!: ElementRef;
  private playlistObserver!: IntersectionObserver;

  @ViewChild('scrollTriggerPlaylists') set scrollTriggerPlaylists(el: ElementRef) {
    if (el) {
      this._scrollTriggerPlaylists = el;
      this.setupPlaylistsInfiniteScroll();
    }
    else {
      this._scrollTriggerPlaylists = null!;
    }
  }

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthService,
    private playlistService: PlaylistService,
    private musicPlayerService: MusicPlayerService,
    private cdr:ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.name;
        this.isAdmin = user.role === 'ADMIN';
      }
    });


    this.loadPlaylists();
    this.playlistService.playlistUpdated$.subscribe(() => {
      this.loadPlaylists();
    });

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

    const options={
      root:null,
      rootMargin:'100px',
      threshold:0.1
    };

    this.playlistObserver=new IntersectionObserver((entries)=>
    {
      entries.forEach(entry =>{
        if(entry.isIntersecting && !this.loadingMorePlaylists && this.hasMorePlaylists )
        {
          this.loadMorePlaylists();
        }
      });
    }, options);

    if(this._scrollTriggerPlaylists?.nativeElement)
    {
      this.playlistObserver.observe(this._scrollTriggerPlaylists.nativeElement);
    }
  }

  loadPlaylists() {
    this.currentPage=0;
    this.playlists=[];
    this.loadingMorePlaylists=true;

    this.playlistService.getMyPlaylist(this.currentPage, this.pageSize, this.playlistSearchQuery).subscribe({
      next:(response)=>{
        this.playlists =response.content;
        this.hasMorePlaylists=!response.last;
        this.loadingMorePlaylists=false;
        this.cdr.detectChanges();

      },

      error:()=>{
        this.playlists=[];
        this.loadingMorePlaylists=false;
      }
    })
   }

  loadMorePlaylists(){
    if(this.loadingMorePlaylists || !this.hasMorePlaylists) return;
    
    this.loadingMorePlaylists=true;
    this.currentPage++;

     this.playlistService.getMyPlaylist(this.currentPage, this.pageSize, this.playlistSearchQuery).subscribe({
      next:(response)=>{
        this.playlists =[...this.playlists,...response.content];
        this.hasMorePlaylists=!response.last;
        this.loadingMorePlaylists=false;
        this.cdr.detectChanges();

      },

      error:()=>{
        this.loadingMorePlaylists=false;
        this.currentPage--;
      }
    })

  }

  onSearchPlaylists(){
    this.loadPlaylists();
  }

  clearPlaylistSearch()
  {
    this.playlistSearchQuery='';
    this.loadPlaylists();
  }

  goBack()
  {
    this.location.back();
  }

  goForward()
  {
    this.location.forward();
  }

  toggleUserMenu(){
    this.isUserMenuExpanded=!this.isUserMenuExpanded;
  }

  logout()
  {
    this.musicPlayerService.stop();
    this.authService.logout();
  }
}