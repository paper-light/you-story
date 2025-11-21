import type PocketBase from 'pocketbase';
import type { SubsResponse, UsersResponse, DI } from '$lib/shared/server';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			pb: PocketBase;
			user: UsersResponse<unknown> | null;
			sub: SubsResponse<unknown> | null;
			di: DI;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
