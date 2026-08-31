import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePlaylist } from './create-playlist';

describe('CreatePlaylist', () => {
  let component: CreatePlaylist;
  let fixture: ComponentFixture<CreatePlaylist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreatePlaylist],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePlaylist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
