// web-socket.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class WebSocketService {
    private socket: WebSocket | null = null;
    private readonly url = 'wss://websocket-server-taximeter-4fba0d38fbd1.herokuapp.com/';
    private isConnectedSubject = new BehaviorSubject<boolean>(false);
    isConnected$ = this.isConnectedSubject.asObservable();

    constructor() {
        this.connect();
    }

    private connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log('✅ WebSocket connected');
            this.isConnectedSubject.next(true);
        };

        this.socket.onclose = () => {
            console.log('🔌 WebSocket disconnected, retrying in 5 seconds');
            this.isConnectedSubject.next(false);
            setTimeout(() => this.connect(), 5000);
        };

        this.socket.onerror = (error) => {
            console.error('❌ WebSocket error', error);
        };

        this.socket.onmessage = (event) => {
            console.log('📥 Message received:', event.data);
        };
    }

    send(message: string) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(message);
            console.log('📤 Message sent:', message);
        } else {
            console.warn('❌ WebSocket not connected. Message not sent.');
        }
    }
}
