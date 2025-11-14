import { Collections, MessagesRoleOptions, MessagesStatusOptions, pb } from '$lib';

import { grok } from '$lib/shared/server';

export const GET = async ({ params, url }) => {
	const { chatId } = params;
	const query = url.searchParams.get('q') || '';

	const aiMsg = await pb.collection(Collections.Messages).create({
		chat: chatId,
		content: '',
		role: MessagesRoleOptions.ai,
		status: MessagesStatusOptions.streaming
	});

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			const sendEvent = (event: string, data: string) => {
				controller.enqueue(encoder.encode(`event: ${event}\n`));
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
			};

			let accumulatedText = '';

			try {
				const completion = await grok.chat.completions.create({
					model: 'grok-4-fast-non-reasoning',
					messages: [{ role: 'user', content: query }],
					stream: true
				});

				for await (const chunk of completion) {
					accumulatedText += chunk.choices[0].delta.content || '';
					sendEvent(
						'chunk',
						JSON.stringify({
							text: chunk.choices[0].delta.content || '',
							msgId: aiMsg.id
						})
					);
				}

				await pb.collection(Collections.Messages).update(aiMsg.id, {
					status: MessagesStatusOptions.final,
					content: accumulatedText
				});
				sendEvent('done', aiMsg.id);
			} catch (error) {
				sendEvent('error', JSON.stringify({ error: String(error) }));
			}
			controller.close();
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
