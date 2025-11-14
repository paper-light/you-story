import { pb, type CharactersResponse, type CharactersRecord } from '$lib';
import pchelImage from '$lib/shared/assets/images/pchel.png';

class CharactersStore {
	_characters: CharactersResponse[] = $state([]);

	characters = $derived(this._characters);
	setCharacters(characters: CharactersResponse[]) {
		this._characters = characters;
	}

	getCharacterAvatar(character: CharactersResponse): string {
		return pb?.files.getURL(character, character.avatar) || pchelImage;
	}

	addCharacter(tempId: string, data: Omit<Partial<CharactersRecord>, 'avatar'>) {
		const character = {
			id: tempId,
			...data,
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		} as CharactersResponse;
		this._characters.unshift(character);
	}

	async create(
		data: Omit<Partial<CharactersRecord>, 'avatar'> & { avatar?: File }
	): Promise<CharactersResponse> {
		const formData = new FormData();
		if (data.name) formData.append('name', data.name);
		if (data.description) formData.append('description', data.description);
		if (data.age !== undefined) formData.append('age', String(data.age));
		if (data.avatar) formData.append('avatar', data.avatar);
		if (data.user) formData.append('user', data.user);

		const record = await pb!.collection('characters').create(formData);
		return record as CharactersResponse;
	}

	async update(
		id: string,
		data: Omit<Partial<CharactersRecord>, 'avatar'> & { avatar?: File }
	): Promise<CharactersResponse> {
		const formData = new FormData();
		if (data.name !== undefined) formData.append('name', data.name);
		if (data.description !== undefined) formData.append('description', data.description);
		if (data.age !== undefined) formData.append('age', String(data.age));
		if (data.avatar) formData.append('avatar', data.avatar);

		const record = await pb!.collection('characters').update(id, formData);
		return record as CharactersResponse;
	}

	async archive(id: string) {
		const record = await pb!.collection('characters').update(id, {
			archived: true
		});
		return record as CharactersResponse;
	}

	async subscribe() {
		return pb!.collection('characters').subscribe('*', (e) => {
			switch (e.action) {
				case 'create':
					this._characters = this._characters.filter((c) => !c.id.startsWith('temp-'));
					this._characters.unshift(e.record);
					break;
				case 'update':
					this._characters = this._characters.map((character) =>
						character.id === e.record.id ? e.record : character
					);
					break;
				case 'delete':
					this._characters = this._characters.filter((character) => character.id !== e.record.id);
					break;
			}
		});
	}

	unsubscribe() {
		pb!.collection('characters').unsubscribe();
	}
}

export const charactersStore = new CharactersStore();
