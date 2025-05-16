import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuchungsFormularComponent } from './buchungs-formular.component';

describe('BuchungsFormularComponent', () => {
  let component: BuchungsFormularComponent;
  let fixture: ComponentFixture<BuchungsFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuchungsFormularComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuchungsFormularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
