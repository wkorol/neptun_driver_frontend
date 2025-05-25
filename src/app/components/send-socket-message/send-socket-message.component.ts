import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import {WebSocketService} from "../../services/web-socket.service";

@Component({
  selector: 'app-send-socket-message',
  template: `<p>Zadziałało</p>`,
  standalone: true
})
export class SendSocketMessageComponent implements OnInit {
  constructor(private socketService: WebSocketService) {}

  ngOnInit(): void {
    this.socketService.isConnected$.pipe(first((v) => v)).subscribe(() => {
      this.socketService.send('Dopłata +10 PLN');
    });
  }
}
