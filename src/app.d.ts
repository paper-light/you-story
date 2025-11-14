import type PocketBase from 'pocketbase';
import type { SubsResponse, UsersResponse } from '$lib';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			pb: PocketBase;
			user: UsersResponse<unknown> | null;
			sub: SubsResponse<unknown> | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
