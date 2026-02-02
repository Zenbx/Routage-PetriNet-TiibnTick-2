import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Hook WebSocket natif pour WebFlux (sans SockJS/STOMP)
 * Le backend broadcast des messages JSON directement
 */
export function useWebSocket<T>(topic: string) {
    const [data, setData] = useState<T | null>(null);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        // Convertir HTTP URL en WS URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws';

        console.log(`[WS] Connecting to: ${wsUrl}`);

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log(`[WS] Connected to ${wsUrl}`);
                setConnected(true);

                // Envoyer un message de subscription (si le backend le supporte)
                // Le backend WebFlux actuel broadcast automatiquement à /topic/fleet
                // Donc pas besoin de subscribe explicite pour l'instant
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log(`[WS] Message received:`, message);
                    setData(message);
                } catch (error) {
                    console.error('[WS] Failed to parse message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('[WS] Error:', error);
                setConnected(false);
            };

            ws.onclose = () => {
                console.log('[WS] Disconnected');
                setConnected(false);

                // Reconnexion automatique après 5 secondes
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('[WS] Attempting to reconnect...');
                    connect();
                }, 5000);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('[WS] Failed to create WebSocket:', error);
            setConnected(false);
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { data, connected };
}
