import { pb, type UsersResponse, type UserExpand, Collections } from '$lib';

export async function globalUserLoad() {
	if (!pb.authStore.isValid) {
		return { user: null, sub: null, stories: [], characters: [] };
	}

	const res = await pb.collection(Collections.Users).authRefresh({ expand: 'subs_via_user' });
	const user = res.record as UsersResponse<UserExpand>;
	const sub = user.expand?.subs_via_user?.at(0) ?? null;

	const stories = await pb
		.collection(Collections.Stories)
		.getFullList({ filter: `user = "${user.id}"` });
	const characters = await pb
		.collection(Collections.Characters)
		.getFullList({ filter: `user = "${user.id}"` });

	return { user, sub, stories, characters };
}
