import PocketBase from 'pocketbase';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PB_EMAIL, PB_PASSWORD } from '$env/static/private';
import { PUBLIC_PB_URL } from '$env/static/public';

import { Collections, pb, type UserExpand, type UsersResponse } from '$lib';

const handleLogger: Handle = async ({ event, resolve }) => {
	console.log(event.request.method, event.url.pathname);
	return resolve(event);
};

const handleAdminPocketbase: Handle = async ({ event, resolve }) => {
	if (pb.authStore.isValid) return resolve(event);

	await pb.collection(Collections.Superusers).authWithPassword(PB_EMAIL, PB_PASSWORD);
	return resolve(event);
};

const handleUserAuth: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.sub = null;
	event.locals.pb = new PocketBase(PUBLIC_PB_URL);

	const token = event.cookies.get('pb_token');
	if (!token) return resolve(event);

	try {
		event.locals.pb.authStore.save(token);
		const res = await event.locals.pb
			.collection(Collections.Users)
			.authRefresh({ expand: 'subs_via_user' });
		const user = res.record as UsersResponse<UserExpand>;
		const sub = user.expand?.subs_via_user?.at(0) ?? null;
		event.locals.user = user;
		event.locals.sub = sub;
	} catch (error) {
		console.error(error);
	}
	return resolve(event);
};

export const handle = sequence(handleLogger, handleAdminPocketbase, handleUserAuth);
