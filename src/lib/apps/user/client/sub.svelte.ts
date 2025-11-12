import { pb, type SubsResponse } from '$lib';

class SubStore {
	sub: SubsResponse | null = $state(null);

	async subscribe(subId: string) {
		return pb!.collection('subs').subscribe(subId, (e) => {
			const sub = e.record;
			switch (e.action) {
				case 'update':
					this.sub = sub;
					break;
			}
		});
	}

	unsubscribe() {
		pb!.collection('subs').unsubscribe();
	}
}

export const subStore = new SubStore();
