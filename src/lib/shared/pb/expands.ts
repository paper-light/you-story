import type { SubsResponse } from './pocketbase-types';

export type UserExpand = {
	subs_via_users: SubsResponse[] | undefined;
};
