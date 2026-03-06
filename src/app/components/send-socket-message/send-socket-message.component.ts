import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import {HttpClient} from "@angular/common/http";
import { apiConfig } from '../../config/api.config';

@Component({
  selector: 'app-send-socket-message',
  template: `<p>Zadziałało</p>`,
  standalone: true
})
export class SendSocketMessageComponent implements OnInit {

    private readonly apiUrl = `${apiConfig.baseUrl}/api/price-update`; // Zmień na swój URL Symfony
    private readonly duplicateWindowMs = 5000;
    private readonly lastRequestStorageKey = 'taximeter_plus10_last_post_at';
    private isSending = false;

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        this.sendExtraCharge();
    }

    private sendExtraCharge(): void {
        if (this.isSending) {
            return;
        }

        const now = Date.now();
        const lastRequestAtRaw = localStorage.getItem(this.lastRequestStorageKey);
        const lastRequestAt = Number(lastRequestAtRaw);
        const isWithinDuplicateWindow = Number.isFinite(lastRequestAt) && (now - lastRequestAt) < this.duplicateWindowMs;

        if (isWithinDuplicateWindow) {
            console.warn('⚠️ Pominięto duplikat dopłaty +10 (krótkie ponowne wejście na endpoint).');
            return;
        }

        this.isSending = true;

        // Automatycznie wyślij dopłatę przy inicjalizacji (jak WebSocket w oryginalnym kodzie)
        this.http.post(this.apiUrl, {}).pipe(first()).subscribe({
            next: (response) => {
                localStorage.setItem(this.lastRequestStorageKey, String(now));
                this.isSending = false;
                console.log('✅ Dopłata +10 PLN wysłana pomyślnie:', response);
            },
            error: (error) => {
                this.isSending = false;
                console.error('❌ Błąd podczas wysyłania dopłaty:', error);
            }
        });
    }
}
