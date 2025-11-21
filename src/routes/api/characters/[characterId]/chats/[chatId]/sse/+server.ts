import { error, type RequestHandler } from '@sveltejs/kit';

import { withTracing, streamWithFlush } from '$lib/shared/server';

const handler: RequestHandler = async ({ params, url, locals }) => {
	const { characterId, chatId } = params;
	const query = url.searchParams.get('q') || '';

	if (!locals.user) throw error(401, 'Unauthorized');
	if (!characterId || !chatId) throw error(400, 'Missing required parameters');

	const chatApp = locals.di.chat;

	const stream = await chatApp.generate({
		user: locals.user,
		chatId,
		query
	});

	return new Response(streamWithFlush(stream), {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

export const GET = withTracing(handler, {
	traceName: 'storyteller-sse',
	updateTrace: ({ params, locals }) => ({
		userId: locals.user?.id,
		sessionId: params.chatId,
		metadata: {
			storyId: params.storyId,
			eventId: params.eventId,
			chatId: params.chatId
		}
	})
});
