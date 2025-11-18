import { VoyageAIClient } from 'voyageai';
import { VOYAGE_API_KEY } from '$env/static/private';

export const voyage = new VoyageAIClient({ apiKey: VOYAGE_API_KEY });
