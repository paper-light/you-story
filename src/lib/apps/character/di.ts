import { CharacterAppImpl } from './app';
import type { CharacterApp } from './core';

export const getCharacterApp = (): CharacterApp => {
	return new CharacterAppImpl();
};
