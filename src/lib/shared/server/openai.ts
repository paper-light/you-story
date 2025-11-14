import OpenAI from 'openai';

import { OPENAI_API_KEY, GROK_API_KEY } from '$env/static/private';

export const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

export const grok = new OpenAI({
	baseURL: 'https://api.x.ai/v1',
	apiKey: GROK_API_KEY
});
