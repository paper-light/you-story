# YouStory Architecture - Quick Reference

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  (Svelte 5 UI + Svelte Stores with runes for reactivity)        │
│                                                                   │
│  Routes: /app/stories, /app/characters, /app/chats, /app/auth    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP GET /api/.../sse?q=...
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   API ENDPOINT HANDLER                            │
│  withTracing() wraps handler for Langfuse observability          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   EVENTCHAT APP LAYER                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Orchestrates: Load Context → Plan → Execute → Stream      │ │
│  │ Dependencies: SceneApp, MemoryApp, PocketBase              │ │
│  └────────────────────────────────────────────────────────────┘ │
└────┬─────────────────────────────┬──────────────────────────────┘
     │                             │
     │                      ┌──────▼──────┐
     │        ┌─────────────┤ MEMORY APP  │◄──────────────┐
     │        │             └─────────────┘               │
     │        │                   │                        │
     │        │    ┌──────────────┼──────────────┐        │
     │        │    │              │              │        │
     │        │    ▼              ▼              ▼        │
     │        │ Static Memories  Profile     Event      │
     │        │ (Stories/Chars) Memories   Memories    │
     │        │                (Indexed in Meilisearch)│
     │        │                                         │
     │        └─────────────────────────────────────────┘
     │
     │        ┌──────────────────────────────────────┐
     └───────►│      SCENE APP (AI ENGINE)           │
              │ Enhance → Plan → Act → Stream        │
              │                                       │
              │ ┌──────────────────────────────────┐ │
              │ │ Enhancer (Grok 4 Fast NR)       │ │
              │ │ - Analyzes intent/emotion       │ │
              │ │ - Returns EnhanceOutput         │ │
              │ └──────────────────────────────────┘ │
              │ ┌──────────────────────────────────┐ │
              │ │ ScenePlanner (Grok 4 Fast)      │ │
              │ │ - Creates multi-step plan       │ │
              │ │ - Structured JSON via Zod       │ │
              │ └──────────────────────────────────┘ │
              │ ┌──────────────────────────────────┐ │
              │ │ SceneActor (Grok 4 Fast NR)     │ │
              │ │ - Executes each step            │ │
              │ │ - Streaming + sync support      │ │
              │ │ - 5x retry logic                │ │
              │ └──────────────────────────────────┘ │
              └──────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
        ┌──────────────┐          ┌──────────────┐
        │ Character   │          │   Story      │
        │ App         │          │   App        │
        │             │          │              │
        │ Fetches char│          │ Fetches story│
        │ descriptions│          │ + event ctx  │
        │ from PB     │          │ from PB      │
        └──────────────┘          └──────────────┘
              │                         │
              └───────────┬─────────────┘
                          │
              ┌───────────▼───────────┐
              │   POCKETBASE (DB)     │
              │                       │
              │ Collections:          │
              │ - users               │
              │ - stories             │
              │ - storyEvents         │
              │ - characters          │
              │ - chats               │
              │ - messages            │
              └───────────────────────┘
```

## Data Flow - User Message to Response Stream

```
USER INPUT: "Can you describe how they kiss?"
  │
  ├─ Save to PocketBase messages collection
  │
  ├─ enhanceQuery(history)
  │   └─ Returns: intent, emotion, flowType
  │
  ├─ getPolicy(enhance)
  │   └─ Returns: tempo, detailLevel, densities, maxBeats
  │
  ├─ memoryApp.get(query, tokens)
  │   ├─ Static (2000 tokens): Story bible + character descriptions
  │   ├─ Profile (2500 tokens): Character relationships (Meilisearch)
  │   └─ Event (2500 tokens): Recent chat history (Meilisearch)
  │
  ├─ plan(policy, memories, history)
  │   └─ Returns: [
  │       { type: 'world', description: '...' },
  │       { type: 'character-thoughts', characterId: '...', description: '...' },
  │       { type: 'character-speech', characterId: '...', description: '...' }
  │     ]
  │
  └─ For each step in plan:
      ├─ Create AI message in PocketBase
      ├─ actStream(step) streams from Grok
      │   └─ Grok API sends chunks: "The warm ", "moonlight ", "..."
      ├─ Send SSE events: { text: "The warm ", msgId, stepIndex }
      └─ Update message with final content
```

## Layer Architecture Pattern

```
Each App follows this exact structure:

┌─────────────────────────────────────────┐
│         CORE DOMAIN LAYER                │
├─────────────────────────────────────────┤
│ models.ts        Domain entities         │
│ in.ts            App input interfaces    │
│ out.ts           Adapter interfaces      │
│ engines/ (opt)   Business logic          │
└──────┬──────────────────────────────────┬┘
       │                                  │
       │            Dependency Inversion   │
       │                                  │
┌──────▼──────────────────────────┬───────▼──┐
│   ADAPTERS LAYER                │ APP LAYER│
├─────────────────────────────────┼──────────┤
│ Implement out.ts interfaces:    │ usecases │
│ - openaiEnhancer                │ .ts      │
│ - openaiPlanner                 │          │
│ - openaiActor                   │ Receives │
│ - meiliProfileIndexer           │ adapters │
│ - meiliEventIndexer             │ in ctor  │
│ - meiliEventIndexer             │          │
│                                 │ Returns  │
│ Third-party services:           │ singleton│
│ - OpenAI (Grok)                 │ instance │
│ - Meilisearch                   │          │
│ - PocketBase                    │          │
└─────────────────────────────────┴──────────┘
       │
       │ (Optional: only for interactive apps)
       │
┌──────▼──────────────────────────┐
│   CLIENT LAYER                   │
├──────────────────────────────────┤
│ *.svelte.ts    Svelte stores     │
│ ui/            Svelte components │
│ *Api.ts        API wrappers      │
└──────────────────────────────────┘
```

## Core Apps and Their Roles

| App | Layer | Purpose | Key Files |
|-----|-------|---------|-----------|
| **scene** | Domain | AI storytelling engine | `core/models.ts`, `adapters/actor|planner|enhancer/` |
| **memory** | Domain | Context management & retrieval | `core/models.ts`, `adapters/indexers/` |
| **eventChat** | Domain | Conversation orchestration | `app/usecases.ts`, `core/models.ts` |
| **character** | Domain | Character profiles | `core/models.ts`, `app/usecases.ts` |
| **story** | Domain | Story context | `core/models.ts`, `app/usecases.ts` |
| **storyEvent** | Domain | Story chapters | `core/models.ts` |
| **user** | Domain | User management | `client/user.svelte.ts` |

## Key Design Patterns

### 1. Dependency Injection
```typescript
class AppImpl implements App {
  constructor(
    private adapter1: Adapter1,
    private adapter2: Adapter2
  ) {}
}
export const app = new AppImpl(adapter1, adapter2)
```

### 2. Singleton Pattern
All app instances are singletons exported at app/index.ts

### 3. Adapter Pattern
External services (OpenAI, Meilisearch) are behind interfaces
Easy to swap implementations

### 4. Token Budgeting
Every API call respects token limits:
```typescript
const tokens = TOKENIZERS[LLMS.GROK_4_FAST].encode(content).length
remainingBudget -= tokens
if (remainingBudget < 0) break
```

### 5. Streaming Pattern
SSE for real-time responses without blocking:
```typescript
return new ReadableStream({ start(controller) { ... } })
```

### 6. Structured Output with Zod
All LLM outputs validated:
```typescript
const result = EnhanceOutputSchema.parse(data)
```

## Token Budgets

```
Conversation Flow:
  History: 2000 tokens (recent messages)
           ↓
  Memory Retrieval: 5000 tokens total
    ├─ Static: 2000 tokens
    ├─ Profile: 2500 tokens
    └─ Event: 2500 tokens
           ↓
  Scene Generation: OpenAI calls
    └─ Grok models with streaming
```

## API Endpoints

```
Protected routes (require locals.user):

GET /api/stories/[storyId]/events/[eventId]/chats/[chatId]/sse?q=QUERY
  └─ Streams story chat (multiple characters)

GET /api/characters/[characterId]/chats/[chatId]/sse?q=QUERY
  └─ Streams friend chat (single character)

Both use Langfuse tracing and SSE streaming
```

## Critical Files Reference

| File | Purpose |
|------|---------|
| `/src/lib/apps/scene/app/usecases.ts` | Scene orchestration (Enhance→Plan→Act) |
| `/src/lib/apps/eventChat/app/usecases.ts` | Conversation flow & SSE generation |
| `/src/lib/apps/memory/app/usecases.ts` | Memory retrieval with token budgeting |
| `/src/lib/apps/scene/core/engines/scenePolicy.ts` | Policy engine (intent→parameters) |
| `/src/lib/apps/memory/adapters/*/meili*.ts` | Meilisearch hybrid search |
| `/src/lib/shared/server/tracing.ts` | Langfuse integration |
| `/src/routes/api/stories/.../sse/+server.ts` | HTTP endpoint with tracing |

## Testing Approach

Mock adapters easily due to ports & adapters pattern:

```typescript
const testApp = new SceneAppImpl(
  new MockEnhancer(),
  new MockPlanner(),
  new MockActor()
)
```

## Extensibility Points

- **Different LLM**: Create new adapter implementing SceneActor, ScenePlanner, Enhancer
- **Different Memory Store**: Create new adapter implementing ProfileIndexer, EventIndexer
- **Policy Generation**: Modify `scenePolicy.ts` function
- **Streaming Transport**: Replace SSE with WebSocket in route handlers
- **Additional Memory Types**: Extend Memory union type in memory/core/models.ts

