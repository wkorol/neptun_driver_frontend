import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomableImageComponent } from './zoomable-image.component';

describe('ZoomableImageComponent', () => {
  let component: ZoomableImageComponent;
  let fixture: ComponentFixture<ZoomableImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomableImageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZoomableImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
