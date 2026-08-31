import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadSong } from './upload-song';

describe('UploadSong', () => {
  let component: UploadSong;
  let fixture: ComponentFixture<UploadSong>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadSong],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadSong);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
