import { fetchApi } from './client';

export const graphApi = {
    getNodes: () => fetchApi('/api/v1/graph/nodes'),
    getArcs: () => fetchApi('/api/v1/graph/arcs'),
};

export const routingApi = {
    calculateShortestPath: (data: any) => fetchApi('/api/v1/routing/shortest-path', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};
