import { z } from 'zod';
import { browser } from '$app/environment';

const UIStateSchema = z.object({
	paywallOpen: z.boolean().default(false),
	globalSidebarOpen: z.boolean().default(true),
	feedbackModalOpen: z.boolean().default(false)
});

type UIState = z.infer<typeof UIStateSchema>;

class UIStore {
	private _state: UIState | null = $state(
		UIStateSchema.parse(JSON.parse(browser ? (localStorage.getItem('uiState') ?? '{}') : '{}'))
	);

	paywallOpen = $derived(this._state?.paywallOpen);
	globalSidebarOpen = $derived(this._state?.globalSidebarOpen);
	feedbackModalOpen = $derived(this._state?.feedbackModalOpen);

	// paywallOpen
	togglePaywallOpen() {
		if (!this._state) return;
		this._state.paywallOpen = !this._state.paywallOpen;
		this.saveState();
	}
	setPaywallOpen(open: boolean) {
		if (!this._state) return;
		this._state.paywallOpen = open;
		this.saveState();
	}

	// globalSidebarOpen
	toggleGlobalSidebar() {
		if (!this._state) return;
		this._state.globalSidebarOpen = !this._state.globalSidebarOpen;
		this.saveState();
	}
	setGlobalSidebarOpen(open: boolean) {
		if (!this._state) return;
		this._state.globalSidebarOpen = open;
		this.saveState();
	}

	// feedbackModalOpen
	toggleFeedbackModal() {
		if (!this._state) return;
		this._state.feedbackModalOpen = !this._state.feedbackModalOpen;
		this.saveState();
	}
	setFeedbackModalOpen(open: boolean) {
		if (!this._state) return;
		this._state.feedbackModalOpen = open;
		this.saveState();
	}

	loadState() {
		const raw = localStorage.getItem('uiState');
		if (raw) {
			try {
				this._state = UIStateSchema.parse(JSON.parse(raw));
				return;
			} catch {
				console.error('Failed to parse UI state');
			}
		}

		this._state = UIStateSchema.parse({});
		this.saveState();
	}

	private saveState() {
		localStorage.setItem('uiState', JSON.stringify(this._state));
	}

	clear() {
		this._state = UIStateSchema.parse({});
		this.saveState();
	}
}

export const uiStore = new UIStore();
