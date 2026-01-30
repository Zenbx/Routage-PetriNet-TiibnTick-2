import { fetchApi } from './client';

export const routingApi = {
    calculateShortestPath: (data: any) => fetchApi('/api/v1/routing/shortest-path', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};
