import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import {WebSocketService} from "../../services/web-socket.service";
import {HttpClient} from "@angular/common/http";
import { apiConfig } from '../../config/api.config';

@Component({
  selector: 'app-send-socket-message',
  template: `<p>Zadziałało</p>`,
  standalone: true
})
export class SendSocketMessageComponent implements OnInit {

    private readonly apiUrl = `${apiConfig.baseUrl}/api/price-update`; // Zmień na swój URL Symfony

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        // Automatycznie wyślij dopłatę przy inicjalizacji (jak WebSocket w oryginalnym kodzie)
        this.http.post(this.apiUrl, {}).subscribe({
            next: (response) => {
                console.log('✅ Dopłata +10 PLN wysłana pomyślnie:', response);
            },
            error: (error) => {
                console.error('❌ Błąd podczas wysyłania dopłaty:', error);
            }
        });
    }
}
