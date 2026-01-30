import { useEffect, useState, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

export function useWebSocket<T>(topic: string) {
    const [data, setData] = useState<T | null>(null);
    const [connected, setConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    const connect = useCallback(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';
        const socket = new SockJS(wsUrl);
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket: ' + topic);
                setConnected(true);
                client.subscribe(topic, (message: IMessage) => {
                    const parsedData = JSON.parse(message.body);
                    setData(parsedData);
                });
            },
            onDisconnect: () => {
                console.log('Disconnected from WebSocket');
                setConnected(false);
            },
            onStompError: (frame) => {
                console.error('STOMP error', frame.headers['message']);
            }
        });

        client.activate();
        clientRef.current = client;
    }, [topic]);

    useEffect(() => {
        connect();
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [connect]);

    return { data, connected };
}
