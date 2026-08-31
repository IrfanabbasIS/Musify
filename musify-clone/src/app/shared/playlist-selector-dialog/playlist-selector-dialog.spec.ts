import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistSelectorDialog } from './playlist-selector-dialog';

describe('PlaylistSelectorDialog', () => {
  let component: PlaylistSelectorDialog;
  let fixture: ComponentFixture<PlaylistSelectorDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlaylistSelectorDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaylistSelectorDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
