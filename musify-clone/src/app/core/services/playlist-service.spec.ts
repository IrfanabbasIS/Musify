import { TestBed } from '@angular/core/testing';

import { PllaylistService } from './playlist-service';

describe('PllaylistService', () => {
  let service: PllaylistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PllaylistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
