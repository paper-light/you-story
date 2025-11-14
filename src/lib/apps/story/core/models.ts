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
		story.buildPrompt();
		return story;
	}

	buildPrompt() {
		this.prompt = `
Story: ${this.data.name}
Description: ${this.data.description}
Bible: ${JSON.stringify(this.data.bible)}
`;
	}
}
