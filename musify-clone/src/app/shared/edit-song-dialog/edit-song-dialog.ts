import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SongDialogData } from '../../core/models/dialog.model';

@Component({
  selector: 'app-edit-song-dialog',
  standalone: false,
  templateUrl: './edit-song-dialog.html',
  styleUrl: './edit-song-dialog.css',
})
export class EditSongDialog implements OnDestroy {
  songForm: FormGroup;

  songFile: File | null = null;
  imageFile: File | null = null;

  imagePreviewUrl: string | null = null;
  audioPreviewUrl: string | null = null;

  songFileError = '';
  imageFileError = '';

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<EditSongDialog>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: SongDialogData,
  ) {
    this.songForm = this.formBuilder.group({
      title: [
        data.song.title,
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      ],
      artist: [
        data.song.artist,
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      ],
    });
  }

  ngOnDestroy(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    if (this.audioPreviewUrl) {
      URL.revokeObjectURL(this.audioPreviewUrl);
    }
  }

  onSongFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('audio/')) {
        this.songFileError = 'Please select a valid audio file';
        this.songFile = null;
        this.audioPreviewUrl = null;
        return;
      }

      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        this.songFileError = 'Audio file size should not exceed 50MB';
        this.songFile = null;
        this.audioPreviewUrl = null;
        return;
      }

      if (this.audioPreviewUrl) {
        URL.revokeObjectURL(this.audioPreviewUrl);
      }

      this.songFile = file;
      this.audioPreviewUrl = URL.createObjectURL(file);
      this.songFileError = '';
    }
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.imageFileError = 'Please select a valid image file';
        this.imageFile = null;
        this.imagePreviewUrl = null;
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.imageFileError = 'Image file size should not exceed 50MB';
        this.imageFile = null;
        this.imagePreviewUrl = null;
        return;
      }

      if (this.imagePreviewUrl) {
        URL.revokeObjectURL(this.imagePreviewUrl);
      }

      this.imageFile = file;
      this.imagePreviewUrl = URL.createObjectURL(file);
      this.imageFileError = '';
    }
  }

  clearSongFile(): void {
    if (this.audioPreviewUrl) {
      URL.revokeObjectURL(this.audioPreviewUrl);
    }

    this.songFile = null;
    this.audioPreviewUrl = null;
    this.songFileError = '';

    const fileInput=document.getElementById('songFile') as HTMLInputElement;
    if(fileInput)
    {
      fileInput.value='';
    }
  }

  clearImageFile(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    this.imageFile = null;
    this.imagePreviewUrl = null;
    this.imageFileError = '';

    const fileInput=document.getElementById('imageFile') as HTMLInputElement;
    if(fileInput)
    {
      fileInput.value='';
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    const { title, artist } = this.songForm.value;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('artist', artist.trim());
    if (this.songFile) {
      formData.append('songFile', this.songFile);
    }

    if (this.imageFile) {
      formData.append('imageFile', this.imageFile);
    }

    this.dialogRef.close(formData);
  }

  get isFormValid(): boolean {
    return this.songForm.valid && !this.songFileError && !this.imageFileError;
  }
}
