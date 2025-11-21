import { pb, type CharactersResponse } from '$lib';
import pchelImage from '$lib/shared/assets/images/pchel.png';

import type { CreateCharacterData } from './charactersApi';

class CharactersStore {
	_characters: CharactersResponse[] = $state([]);

	characters = $derived(this._characters.filter((c) => !c.archived));
	archivedCharacters = $derived(this._characters.filter((c) => c.archived));

	setCharacters(characters: CharactersResponse[]) {
		this._characters = characters;
	}

	getCharacterAvatar(character: CharactersResponse): string {
		return pb?.files.getURL(character, character.avatar) || pchelImage;
	}

	addOptimisticCharacter(data: Omit<CreateCharacterData, 'avatar'>) {
		const tempId = `temp-${Date.now()}`;
		const character = {
			id: tempId,
			...data,
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		} as CharactersResponse;
		this._characters.unshift(character);
	}

	async subscribe() {
		return pb!.collection('characters').subscribe('*', (e) => {
			switch (e.action) {
				case 'create':
					this._characters = this._characters.filter(
						(c) => !c.id.startsWith('temp-') && c.id !== e.record.id
					);
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
