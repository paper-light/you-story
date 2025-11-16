import z from 'zod';

import type { Archetype } from '$lib/apps/character/core';

// SCENE INTENT

export enum SceneIntent {
	CasualDialogue = 'casualDialogue',
	SeriousTalk = 'seriousTalk',
	RomanticFlirt = 'romanticFlirt',
	IntimateEmotional = 'intimateEmotional',
	SexualEncounter = 'sexualEncounter',
	HighTensionAction = 'highTensionAction',
	StoryContinuation = 'storyContinuation',
	EmotionalSupport = 'emotionalSupport',
	Exposition = 'exposition'
}

export enum SceneFlowType {
	Dialogue = 'dialogue',
	Banter = 'banter',
	Intimate = 'intimate',
	Action = 'action',
	Exposition = 'exposition'
}

export enum UserEmotion {
	Neutral = 'neutral',
	Good = 'good',
	Bad = 'bad',
	Anxious = 'anxious',
	Excited = 'excited',
	Horny = 'horny',
	Angry = 'angry'
}

export const EnhanceOutputSchema = z.object({
	interactionIntent: z.enum(Object.values(SceneIntent)),
	userEmotion: z.enum(Object.values(UserEmotion)),
	sceneFlowType: z.enum(Object.values(SceneFlowType)),
	perCharacterMoodDelta: z.record(z.string(), z.enum(['increased', 'decreased', 'neutral']))
});
export type EnhanceOutput = z.infer<typeof EnhanceOutputSchema>;

// SCENE POLICY
export enum DetailLevel {
	Low = 'low',
	Medium = 'medium',
	High = 'high'
}

export enum Tempo {
	Slow = 'slow',
	Normal = 'normal',
	Fast = 'fast'
}

export enum DialogueDensity {
	Low = 'low',
	Medium = 'medium',
	High = 'high'
}
export enum ThoughtsDensity {
	Low = 'low',
	Medium = 'medium',
	High = 'high'
}
export enum WorldDensity {
	Low = 'low',
	Medium = 'medium',
	High = 'high'
}
export type ScenePolicy = {
	intent: SceneIntent;
	sceneFlowType: SceneFlowType;
	userEmotion: UserEmotion;

	tempo: Tempo;
	detailLevel: DetailLevel;
	dialogueDensity: DialogueDensity;
	thoughtsDensity: ThoughtsDensity;
	worldDensity: WorldDensity;
	maxBeats: number;
	maxBeatsPerActor: number;
};

// CHARACTER POLICY
export enum CharacterMood {
	Neutral = 'neutral',
	Soft = 'soft',
	Playful = 'playful',
	Reserved = 'reserved',
	Angry = 'angry',
	Anxious = 'anxious'
}

export enum RelationshipState {
	Stranger = 'stranger',
	Acquaintance = 'acquaintance',
	Friend = 'friend',
	Close = 'close',
	Enemy = 'enemy'
}

export enum CharacterRoleInScene {
	Focus = 'focus', // POV / главный в этой сцене
	Support = 'support', // важный второстепенный
	Background = 'background'
}

export enum StepMode {
	Speech = 'speech',
	Thoughts = 'thoughts',
	World = 'world'
}

export type CharacterPolicy = {
	characterId: string;
	archetype: Archetype;
	prompts: string;
	sessionStyle?: string;

	mood: CharacterMood;
	relationshipState: RelationshipState;

	allowedModes: StepMode[];
	preferredDetailLevel: DetailLevel;
	goals: string[];
	boundaries: string[];
};

// SCENE PLAN
export const SchemaSceneStep = z.object({
	type: z.enum(['world', 'thoughts', 'speech']).describe(
		`
World: update the environment, atmosphere, or overall mood.
Thoughts: focus the scene on the character's thoughts.
Speech: focus the scene on the character's dialogue.
`
	),
	characterId: z.string().optional().nullable(),
	description: z.string()
});
export const SchemaScenePlan = z.object({
	steps: z.array(SchemaSceneStep)
});
export type ScenePlan = z.infer<typeof SchemaScenePlan>;
