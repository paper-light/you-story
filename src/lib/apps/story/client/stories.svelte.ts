import { pb, type StoriesRecord, type StoriesResponse } from '$lib';
import type { StoryBible } from '../core/model';
import pchelImage from '$lib/shared/assets/images/pchel.png';

class StoriesStore {
	_stories: StoriesResponse[] = $state([]);

	stories = $derived(this._stories);

	setStories(stories: StoriesResponse[]) {
		this._stories = stories;
	}

	addStory(story: StoriesResponse) {
		const existing = this._stories.filter((item) => item.id !== story.id);
		this._stories = [story, ...existing];
	}

	getCoverUrl(story: StoriesResponse): string | null {
		if (!story.cover) return null;
		return pb?.files.getURL(story, story.cover) ?? pchelImage;
	}

	async create(
		data: Omit<Partial<StoriesRecord<StoryBible>>, 'cover'> & {
			cover?: File;
			bible?: StoryBible;
		}
	): Promise<StoriesResponse<StoryBible>> {
		const formData = new FormData();

		if (data.name !== undefined) formData.append('name', data.name);
		if (data.description !== undefined) formData.append('description', data.description);
		if (data.user !== undefined) formData.append('user', data.user);
		if (data.cover) formData.append('cover', data.cover);

		if (data.bible) {
			const hasBibleContent =
				(data.bible.style?.length ?? 0) > 0 || (data.bible.worldFacts?.length ?? 0) > 0;
			if (hasBibleContent) {
				formData.append('bible', JSON.stringify(data.bible));
			}
		}

		const record = await pb!.collection('stories').create(formData);
		return record as StoriesResponse<StoryBible>;
	}

	async subscribe() {
		return pb!.collection('stories').subscribe('*', (e) => {
			switch (e.action) {
				case 'create':
					this._stories.unshift(e.record);
					break;
				case 'update':
					this._stories = this._stories.map((story) =>
						story.id === e.record.id ? e.record : story
					);
					break;
				case 'delete':
					this._stories = this._stories.filter((story) => story.id !== e.record.id);
					break;
			}
		});
	}

	unsubscribe() {
		pb!.collection('stories').unsubscribe();
	}
}

export const storiesStore = new StoriesStore();
