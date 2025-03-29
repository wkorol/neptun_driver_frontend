import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MamTaxiLoginComponent } from './mam-taxi-login.component';

describe('MamTaxiLoginComponent', () => {
  let component: MamTaxiLoginComponent;
  let fixture: ComponentFixture<MamTaxiLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MamTaxiLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MamTaxiLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
