import { TestBed } from '@angular/core/testing';

import { ArcAgiDataService } from './arc-agi-data';

describe('ArcAgiDataService', () => {
  let service: ArcAgiDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArcAgiDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
