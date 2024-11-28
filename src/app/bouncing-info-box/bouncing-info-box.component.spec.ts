import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BouncingInfoBoxComponent } from './bouncing-info-box.component';

describe('BouncingInfoBoxComponent', () => {
  let component: BouncingInfoBoxComponent;
  let fixture: ComponentFixture<BouncingInfoBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BouncingInfoBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BouncingInfoBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
