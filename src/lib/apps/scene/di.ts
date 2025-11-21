import type { SceneApp } from './core';
import { SceneAppImpl } from './app/usecases';
import { OpenAISceneEnhancer, OpenAIScenePlanner, OpenAISceneActor } from './adapters';

export const getSceneApp = (): SceneApp => {
	const enhancer = new OpenAISceneEnhancer();
	const scenePlanner = new OpenAIScenePlanner();
	const sceneActor = new OpenAISceneActor();
	return new SceneAppImpl(enhancer, scenePlanner, sceneActor);
};
