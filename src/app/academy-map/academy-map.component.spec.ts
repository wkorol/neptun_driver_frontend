import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademyMapComponent } from './academy-map.component';

describe('AcademyMapComponent', () => {
  let component: AcademyMapComponent;
  let fixture: ComponentFixture<AcademyMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademyMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademyMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
