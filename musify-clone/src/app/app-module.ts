import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Login } from './features/auth/login/login';
import { Home } from './features/home/home';
import { AuthImagePipe } from './core/pipes/auth-image-pipe';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { Layout } from './shared/layout/layout';
import { UploadSong } from './features/upload-song/upload-song';
import { ConfirmationDialog } from './shared/confirmation-dialog/confirmation-dialog';
import { EditSongDialog } from './shared/edit-song-dialog/edit-song-dialog';
import { MyUploads } from './features/my-uploads/my-uploads';
import { MusicPlayer } from './shared/music-player/music-player';
import { ExpandedPlayer } from './shared/expanded-player/expanded-player';
import { CreatePlaylist } from './features/create-playlist/create-playlist';
import { PlaylistSelectorDialog } from './shared/playlist-selector-dialog/playlist-selector-dialog';
import { PlaylistDetail } from './features/playlist-detail/playlist-detail';
import { Search } from './features/search/search';
import { Profile } from './features/profile/profile';
import { EditProfileDialog } from './shared/edit-profile-dialog/edit-profile-dialog';
import { AllUsers } from './features/all-users/all-users';

@NgModule({
  declarations: [
    App,
    Login,
    Home,
    AuthImagePipe,
    Layout,
    UploadSong,
    ConfirmationDialog,
    EditSongDialog,
    MyUploads,
    MusicPlayer,
    ExpandedPlayer,
    CreatePlaylist,
    PlaylistSelectorDialog,
    PlaylistDetail,
    Search,
    Profile,
    EditProfileDialog,
    AllUsers,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,

    //materal modules
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatSliderModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatSelectModule,
    MatCheckboxModule,
    DragDropModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
