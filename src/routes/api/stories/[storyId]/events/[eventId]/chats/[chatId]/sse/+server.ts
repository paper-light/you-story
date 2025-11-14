import { eventChatApp } from '$lib/apps/eventChat/app';
import { error } from '@sveltejs/kit';

export const GET = async ({ params, url, locals }) => {
	const { storyId, eventId, chatId } = params;
	const query = url.searchParams.get('q') || '';

	if (!locals.user) throw error(401, 'Unauthorized');

	const stream = await eventChatApp.sendUserMessage({
		user: locals.user,
		storyId,
		eventId,
		chatId,
		query
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
