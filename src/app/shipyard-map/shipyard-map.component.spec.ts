import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipyardMapComponent } from './shipyard-map.component';

describe('InteractiveMapComponent', () => {
  let component: ShipyardMapComponent;
  let fixture: ComponentFixture<ShipyardMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipyardMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipyardMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
