import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolMarinaMapComponent } from './sol-marina-map.component';

describe('SolMarinaMapComponent', () => {
  let component: SolMarinaMapComponent;
  let fixture: ComponentFixture<SolMarinaMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolMarinaMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolMarinaMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
