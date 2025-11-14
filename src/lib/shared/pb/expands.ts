import type {
	CharactersResponse,
	MessagesResponse,
	StoryEventsResponse,
	SubsResponse
} from './pocketbase-types';

export type StoryExpand =
	| {
			storyEvents_via_story: StoryEventsResponse<StoryEventExpand>[] | undefined;
	  }
	| undefined;

export type StoryEventExpand =
	| {
			characters: CharactersResponse[] | undefined;
	  }
	| undefined;

export type EventChatExpand =
	| {
			messages_via_chat: MessagesResponse[] | undefined;
			povCharacter: CharactersResponse | undefined;
			storyEvent: StoryEventsResponse | undefined;
	  }
	| undefined;

export type UserExpand =
	| {
			subs_via_user: SubsResponse[] | undefined;
	  }
	| undefined;
