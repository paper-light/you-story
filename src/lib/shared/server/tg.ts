import { ENV, PB_EMAIL, PB_PASSWORD } from '$env/static/private';
import { chatApp } from '$lib/apps/eventChat/app';
import { pb, type ChatsResponse, type UserExpand, type UsersResponse } from '../pb';
import { nanoid } from '../utils';

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';
const WEBHOOK_URL = 'https://ys.cogitosoftware.nl';

export async function handleUpdate(characterId: string, update: any) {
	const char = await pb.collection('characters').getOne(characterId);

	const msg = update.message;
	if (!msg || !msg.text) return;

	const chatId = msg.chat.id;
	const userId = msg.from.id;
	const text = msg.text.trim();

	if (text.startsWith('/start')) {
		try {
			await pb.collection('users').getFirstListItem(`name = "${userId}"`);
			await sendMessage(chatId, 'Бот уже подключен. 👋', char.tgBotToken);
		} catch {
			const password = nanoid(10);
			await pb.collection('users').create({
				name: userId,
				character: characterId,
				email: `${userId}@telegram.org`,
				password,
				passwordConfirm: password
			});
			await sendMessage(chatId, 'Бот подключен. 👋', char.tgBotToken);
		}
		return;
	}

	const user: UsersResponse<UserExpand> = await pb
		.collection('users')
		.getFirstListItem(`name = "${userId}"`, {
			expand: 'characters_via_user',
			sort: 'characters_via_user.created'
		});
	const pov = user.expand?.characters_via_user?.[0];
	if (!pov) {
		await sendMessage(chatId, 'У вас нет персонажа! 😢', char.tgBotToken);
		return;
	}

	let chat: ChatsResponse;
	try {
		chat = await pb
			.collection('chats')
			.getFirstListItem(`povCharacter = "${pov.id}" && friend = "${char.id}"`);
	} catch {
		chat = await pb.collection('chats').create({
			povCharacter: pov.id,
			friend: char.id
		});
	}

	setTimeout(async () => {
		await fetch(`${TELEGRAM_API_URL}${char.tgBotToken}/sendChatAction`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ chat_id: chatId, action: 'typing' })
		});
	}, 8000);

	const answer = await chatApp.run({
		user,
		chatId: chat.id,
		query: text
	});

	await sendMessage(chatId, answer, char.tgBotToken);
}

async function sendMessage(chatId: number, text: string, token: string) {
	await fetch(`${TELEGRAM_API_URL}${token}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: chatId, text })
	}).catch(console.error);
}

export async function setWebhook(characterId: string) {
	const char = await pb.collection('characters').getOne(characterId);
	if (!char) throw new Error('Character not found');
	const token = char.tgBotToken;
	if (!token) throw new Error('Character has no Telegram bot token');

	const url = `${WEBHOOK_URL}/api/tg/webhook/${characterId}`;

	const res = await fetch(`${TELEGRAM_API_URL}${token}/setWebhook`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url })
	});

	const data = await res.json();
	if (!data.ok) {
		console.error('setWebhook failed:', data);
		throw new Error('Cannot set webhook');
	}

	console.log('Webhook set to:', url);
}

export async function startPolling(characterId: string) {
	console.log(`Starting Telegram polling for character ${characterId}...`);
	let offset = 0;

	const char = await pb.collection('characters').getOne(characterId);
	if (!char) throw new Error('Character not found');
	const token = char.tgBotToken;
	if (!token) throw new Error('Character has no Telegram bot token');

	const apiUrl = `${TELEGRAM_API_URL}${token}/getUpdates`;

	(async () => {
		while (true) {
			try {
				const res = await fetch(apiUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						offset,
						timeout: 30 // long polling
					})
				});

				const data = await res.json();
				if (!data.ok) {
					console.error('getUpdates error:', data);
					await new Promise((r) => setTimeout(r, 2000));
					continue;
				}

				for (const update of data.result || []) {
					offset = update.update_id + 1;
					await handleUpdate(characterId, update);
				}
			} catch (e) {
				console.error('Polling error:', e);
				await new Promise((r) => setTimeout(r, 2000));
			}
		}
	})().catch((err) => {
		console.error(`Polling crashed for character ${characterId}:`, err);
	});
}

async function initializeTelegramBots() {
	await pb.collection('_superusers').authWithPassword(PB_EMAIL, PB_PASSWORD);

	try {
		const chars = await pb.collection('characters').getFullList({ filter: 'tgBotToken != ""' });

		if (ENV === 'local') {
			console.log(`Starting polling for ${chars.length} Telegram bot(s)...`);
			for (const char of chars) {
				startPolling(char.id);
			}
		} else if (ENV === 'production') {
			console.log(`Setting webhooks for ${chars.length} Telegram bot(s)...`);
			for (const char of chars) {
				await setWebhook(char.id).catch((err) => {
					console.error(`Failed to set webhook for character ${char.id}:`, err);
				});
			}
		}
	} catch (err) {
		console.error('Failed to initialize Telegram bots:', err);
	}
}

initializeTelegramBots();
