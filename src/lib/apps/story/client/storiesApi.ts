import { pb, type StoriesResponse, type Create, type Update, Collections } from '$lib';

import type { StoryBible } from '../core/models';

class StoriesApi {
	async create(
		data: Create<Collections.Stories> & {
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

	async update(
		id: string,
		data: Update<Collections.Stories> & {
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

		const record = await pb!.collection('stories').update(id, formData);
		return record as StoriesResponse<StoryBible>;
	}
}

export const storiesApi = new StoriesApi();
