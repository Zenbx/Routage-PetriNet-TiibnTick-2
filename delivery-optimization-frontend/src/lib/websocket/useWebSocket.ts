"use client";

import { useEffect, useState, useRef } from 'react';

export function useWebSocket(deliveryId: string) {
    const [data, setData] = useState<any>(null);
    const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('closed');
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!deliveryId) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, 'ws') || 'ws://localhost:8080';

        ws.current = new WebSocket(`${host}/ws/delivery/${deliveryId}`);

        ws.current.onopen = () => setStatus('open');
        ws.current.onclose = () => setStatus('closed');
        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                setData(message);
            } catch (e) {
                console.error("WS parse error", e);
            }
        };

        return () => {
            ws.current?.close();
        };
    }, [deliveryId]);

    return { data, status };
}
