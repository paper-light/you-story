import type { StoryEventsResponse, StoryEventExpand } from '$lib';

export class StoryEvent {
	constructor(
		public readonly data: StoryEventsResponse<StoryEventExpand>,
		public prompt: string
	) {}

	static fromResponse(res: StoryEventsResponse<StoryEventExpand>): StoryEvent {
		const storyEvent = new StoryEvent(res, '');
		storyEvent.buildPrompt();
		return storyEvent;
	}

	getCharacters() {
		return this.data.expand?.characters || [];
	}

	private buildPrompt() {
		const chars = this.getCharacters();

		this.prompt = `
Current Event: ${this.data.name}
Description: ${this.data.description}
Characters: ${chars
			.map((char) => {
				return `- id: ${char.id}, name: ${char.name}, Age: ${char.age}, Description: ${char.description}`;
			})
			.join('\n')}
`;
	}
}
