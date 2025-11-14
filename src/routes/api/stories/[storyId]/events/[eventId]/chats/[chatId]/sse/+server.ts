import { Collections, MessagesRoleOptions, MessagesStatusOptions, pb } from '$lib';

export const GET = async ({ params, url }) => {
	const { storyId, eventId, chatId } = params;
	console.log(storyId, eventId, chatId);
	const query = url.searchParams.get('q') || '';

	const aiMsg = await pb.collection(Collections.Messages).create({
		chat: chatId,
		content: query,
		role: MessagesRoleOptions.ai,
		status: MessagesStatusOptions.streaming
	});

	// Create a readable stream for SSE
	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			const sendEvent = (event: string, data: string) => {
				controller.enqueue(encoder.encode(`event: ${event}\n`));
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
			};

			try {
				// Simulate streaming response - send chunks of text
				const words = query.split(' ') || ['Hello', 'from', 'SSE', 'test'];
				let accumulatedText = '';

				for (let i = 0; i < words.length; i++) {
					const word = words[i];
					accumulatedText += (i > 0 ? ' ' : '') + word;

					const chunk = {
						text: (i > 0 ? ' ' : '') + word,
						msg_id: `temp-${Date.now()}`,
						i: i
					};

					sendEvent('chunk', JSON.stringify(chunk));

					// Simulate delay between chunks
					await new Promise((resolve) => setTimeout(resolve, 100));
				}

				// Send done event
				await pb.collection(Collections.Messages).update(aiMsg.id, {
					status: MessagesStatusOptions.final,
					content: accumulatedText
				});
				sendEvent('done', aiMsg.id);
			} catch (error) {
				sendEvent('error', JSON.stringify({ error: String(error) }));
			} finally {
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
