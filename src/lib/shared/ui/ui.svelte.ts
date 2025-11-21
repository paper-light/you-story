import { z } from 'zod';
import { browser } from '$app/environment';

const ChatSettingsSchema = z.object({
	mode: z.enum(['story', 'friend']).optional().nullable(),
	storyId: z.string().optional().nullable(),
	eventId: z.string().optional().nullable(),
	chatId: z.string().optional().nullable(),
	characterId: z.string().optional().nullable()
});

const UIStateSchema = z.object({
	paywallOpen: z.boolean().default(false),
	authWallOpen: z.boolean().default(false),
	globalSidebarOpen: z.boolean().default(true),
	feedbackModalOpen: z.boolean().default(false),
	chatSettings: ChatSettingsSchema.optional().nullable().default(null)
});

type UIState = z.infer<typeof UIStateSchema>;

class UIStore {
	private _state: UIState | null = $state(
		UIStateSchema.parse(JSON.parse(browser ? (localStorage.getItem('uiState') ?? '{}') : '{}'))
	);

	chatSettings = $derived(this._state?.chatSettings);
	paywallOpen = $derived(this._state?.paywallOpen);
	authWallOpen = $derived(this._state?.authWallOpen);
	globalSidebarOpen = $derived(this._state?.globalSidebarOpen);
	feedbackModalOpen = $derived(this._state?.feedbackModalOpen);

	// chatSettings
	setChatSettings(
		storyId: string,
		eventId: string,
		chatId: string,
		characterId: string,
		mode: 'story' | 'friend'
	) {
		if (!this._state) return;
		this._state.chatSettings = { storyId, eventId, chatId, characterId, mode };
		this.saveState();
	}
	chatUrl() {
		if (!this.chatSettings) return null;
		if (this.chatSettings.mode === 'story') {
			return `/app/stories/${this.chatSettings.storyId}/events/${this.chatSettings.eventId}/chats/${this.chatSettings.chatId}`;
		} else {
			return `/app/characters/${this.chatSettings.characterId}/chats/${this.chatSettings.chatId}`;
		}
	}

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

	// authWallOpen
	toggleAuthWallOpen() {
		if (!this._state) return;
		this._state.authWallOpen = !this._state.authWallOpen;
		this.saveState();
	}
	setAuthWallOpen(open: boolean) {
		if (!this._state) return;
		this._state.authWallOpen = open;
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
