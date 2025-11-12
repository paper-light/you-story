import { pb, type EventChatsResponse } from '$lib';

class EventChatsStore {
	_eventChats: EventChatsResponse[] = $state([]);

	eventChats = $derived(this._eventChats);

	setEventChats(eventChats: EventChatsResponse[]) {
		this._eventChats = eventChats;
	}

	addEventChat(eventChat: EventChatsResponse) {
		const existing = this._eventChats.filter((item) => item.id !== eventChat.id);
		this._eventChats = [eventChat, ...existing];
	}

	async subscribe() {
		return pb.collection('eventChats').subscribe('*', (e) => {
			switch (e.action) {
				case 'create':
					this._eventChats = this._eventChats.filter((item) => !item.id.startsWith('temp-'));
					this._eventChats.unshift(e.record);
					break;
				case 'update':
					this._eventChats = this._eventChats.map((item) =>
						item.id === e.record.id ? e.record : item
					);
					break;
				case 'delete':
					this._eventChats = this._eventChats.filter((item) => item.id !== e.record.id);
					break;
			}
		});
	}

	unsubscribe() {
		pb.collection('eventChats').unsubscribe();
	}
}

export const eventChatsStore = new EventChatsStore();
