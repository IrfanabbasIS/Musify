import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Home } from './features/home/home';
import { Layout } from './shared/layout/layout';
import { authGuard } from './core/guards/auth-guard';
import { UploadSong } from './features/upload-song/upload-song';
import { adminGuard } from './core/guards/admin-guard';
import { MyUploads } from './features/my-uploads/my-uploads';
import { CreatePlaylist } from './features/create-playlist/create-playlist';
import { PlaylistDetail } from './features/playlist-detail/playlist-detail';
import { Search } from './features/search/search';
import { Profile } from './features/profile/profile';
import { AllUsers } from './features/all-users/all-users';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: Home },
      { path: 'upload-song', component: UploadSong, canActivate: [adminGuard] },
      { path: 'my-uploads', component: MyUploads, canActivate: [adminGuard] },
      { path: 'create-playlist', component: CreatePlaylist },
      { path: 'playlist/:id', component: PlaylistDetail },
      { path: 'search', component: Search },
      { path: 'profile', component: Profile },
      { path: 'all-users', component: AllUsers, canActivate: [adminGuard] },
    ],
  },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
