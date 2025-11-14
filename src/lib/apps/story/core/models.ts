import type { StoriesResponse, StoryExpand } from '$lib';

export interface StoryBible {
	style: string[];
	worldFacts: string[];
}

export class Story {
	constructor(
		public readonly data: StoriesResponse<StoryBible, StoryExpand>,
		public prompt: string
	) {}

	getEvents() {
		return this.data.expand?.storyEvents_via_story || [];
	}

	static fromResponse(res: StoriesResponse<StoryBible, StoryExpand>): Story {
		const story = new Story(res, '');
		return story;
	}

	buildPrompt(lastEventOrder: number) {
		const prevEvents = this.getEvents().filter((event) => event.order < lastEventOrder);
		const eventPrompt = prevEvents
			.map((event) => `Event: ${event.name}\nDescription: ${event.description}\n\n`)
			.join('\n');

		this.prompt = `
Story: ${this.data.name}
Description: ${this.data.description}
Bible: ${JSON.stringify(this.data.bible)}

Events:
${eventPrompt || '<No previous events>'}
`;
	}
}
