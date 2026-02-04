// WebSocket client pour les notifications temps réel
export class NotificationWebSocket {
    private ws: WebSocket | null = null;
    private trackingCode: string;
    private onMessageCallback: (notification: any) => void;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    constructor(trackingCode: string, onMessage: (notification: any) => void) {
        this.trackingCode = trackingCode;
        this.onMessageCallback = onMessage;
    }

    connect() {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
        const endpoint = `${wsUrl}/ws/notifications/${this.trackingCode}`;

        try {
            this.ws = new WebSocket(endpoint);

            this.ws.onopen = () => {
                console.log(`✅ WebSocket connected for ${this.trackingCode}`);
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const notification = JSON.parse(event.data);
                    this.onMessageCallback(notification);
                } catch (error) {
                    console.error('Failed to parse notification:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.attemptReconnect();
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
            setTimeout(() => this.connect(), delay);
        } else {
            console.error('Max reconnect attempts reached');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}
