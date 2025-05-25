import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendSocketMessageComponent } from './send-socket-message.component';

describe('SendSocketMessageComponent', () => {
  let component: SendSocketMessageComponent;
  let fixture: ComponentFixture<SendSocketMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendSocketMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendSocketMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
