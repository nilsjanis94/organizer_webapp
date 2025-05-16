import { TestBed } from '@angular/core/testing';

import { TermineService } from './termine.service';

describe('TermineService', () => {
  let service: TermineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TermineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
