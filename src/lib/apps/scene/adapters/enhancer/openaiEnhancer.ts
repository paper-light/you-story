import { observeOpenAI } from '@langfuse/openai';
import { zodResponseFormat } from 'openai/helpers/zod.js';

import { grok, LLMS } from '$lib/shared/server';
import type { MemporyGetResult } from '$lib/apps/memory/core';

import {
	EnhanceOutputSchema,
	type EnhanceOutput,
	type Enhancer,
	type OpenAIMessage
} from '../../core';

import { ENHANCE_PROMPT } from './prompts';

const ENHANCER_MODEL = LLMS.GROK_4_FAST;

export class OpenAISceneEnhancer implements Enhancer {
	async enhance(history: OpenAIMessage[], mems: MemporyGetResult): Promise<EnhanceOutput> {
		const messages: OpenAIMessage[] = [{ role: 'system', content: ENHANCE_PROMPT }];

		if (mems.static.length > 0) {
			messages.push({ role: 'system', content: 'General information:\n' });
			const parts = [];
			for (const mem of mems.static) {
				parts.push(`- ${mem.content}`);
			}
			messages.push({ role: 'user', content: parts.join('\n') });
		}
		if (mems.event.length > 0) {
			messages.push({ role: 'system', content: 'Event memories:\n' });
			const parts = [];
			for (const mem of mems.event) {
				parts.push(`- ${mem.content}`);
			}
			messages.push({ role: 'user', content: parts.join('\n') });
		}
		if (mems.profile.length > 0) {
			messages.push({ role: 'system', content: 'Profile memories:\n' });
			const parts = [];
			for (const mem of mems.profile) {
				parts.push(`- ${mem.content}`);
			}
			messages.push({ role: 'user', content: parts.join('\n') });
		}

		const previousHistory = history.slice(0, -3);
		if (previousHistory.length > 0 && history.length > 3) {
			messages.push({ role: 'system', content: 'Conversation context:\n' });
			for (const msg of previousHistory) {
				messages.push(msg);
			}
		}
		const latestHistory = history.slice(-3);
		if (latestHistory.length > 0) {
			messages.push({ role: 'system', content: 'Intent target:\n' });
			for (const msg of latestHistory) {
				messages.push(msg);
			}
		}

		const grokLf = observeOpenAI(grok);

		const completion = await grokLf.chat.completions.create({
			model: ENHANCER_MODEL,
			messages,
			response_format: zodResponseFormat(EnhanceOutputSchema, 'query_enhancement')
		});

		return EnhanceOutputSchema.parse(JSON.parse(completion.choices[0].message.content || '{}'));
	}
}
