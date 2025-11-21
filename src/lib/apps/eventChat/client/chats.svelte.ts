import { Collections, pb, type ChatsResponse } from '$lib';

class ChatsStore {
	_chats: ChatsResponse[] = $state([]);

	chats = $derived(this._chats);

	setChats(chats: ChatsResponse[]) {
		this._chats = chats;
	}
	mergeChats(chats: ChatsResponse[]) {
		const newChats = chats.filter((c) => !this._chats.some((existing) => existing.id === c.id));
		this._chats = [...this._chats, ...newChats];
		this._chats.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
	}

	getEventChats(eventId: string) {
		return this._chats.filter((chat) => chat.storyEvent === eventId);
	}

	async subscribe() {
		return pb.collection(Collections.Chats).subscribe('*', (e) => {
			switch (e.action) {
				case 'create':
					this._chats = this._chats.filter((item) => !item.id.startsWith('temp-'));
					this._chats.unshift(e.record);
					break;
				case 'update':
					this._chats = this._chats.map((item) => (item.id === e.record.id ? e.record : item));
					break;
				case 'delete':
					this._chats = this._chats.filter((item) => item.id !== e.record.id);
					break;
			}
		});
	}

	unsubscribe() {
		pb.collection(Collections.Chats).unsubscribe();
	}
}

export const chatsStore = new ChatsStore();
