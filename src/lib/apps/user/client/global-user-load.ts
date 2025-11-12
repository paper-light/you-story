import { pb, type UsersResponse, type UserExpand } from '$lib';

export async function globalUserLoad() {
	if (!pb.authStore.isValid) {
		return { user: null, sub: null };
	}

	const res = await pb.collection('users').authRefresh({ expand: 'subs_via_user' });
	const user = res.record as UsersResponse<UserExpand>;
	const sub = user.expand?.subs_via_user?.at(0) ?? null;
	return { user, sub };
}
