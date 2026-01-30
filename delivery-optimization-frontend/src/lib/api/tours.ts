import { fetchApi } from './client';

export const toursApi = {
    optimize: (data: any) => fetchApi('/api/v1/tours/optimize', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};
