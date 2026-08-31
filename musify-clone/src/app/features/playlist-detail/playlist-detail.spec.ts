import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistDetail } from './playlist-detail';

describe('PlaylistDetail', () => {
  let component: PlaylistDetail;
  let fixture: ComponentFixture<PlaylistDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlaylistDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaylistDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
