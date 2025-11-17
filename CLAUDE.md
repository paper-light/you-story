# YouStory - Architecture Documentation

## Project Overview

YouStory is an interactive storytelling application built with SvelteKit that allows users to create and experience dynamic narratives with AI-powered characters. The application uses advanced AI techniques to generate contextual dialogue, manage character relationships, and maintain narrative continuity.

**Tech Stack:**
- **Frontend:** Svelte 5, SvelteKit 2, TailwindCSS v4, DaisyUI 5
- **Backend:** Node.js (SvelteKit server routes), PocketBase (database)
- **Search & Memory:** Meilisearch (vector search with hybrid search capabilities)
- **AI & LLMs:** OpenAI (Grok API), Langfuse (tracing and observability)
- **Utilities:** Zod (validation), Tiktoken (token counting), Marked (markdown)

---

## Architectural Pattern: Ports & Adapters (Hexagonal Architecture)

The application implements a **clean architecture** pattern with a clear separation between:

1. **Core Domain Layer** - Business logic, models, and policies
2. **Adapters Layer** - Integration with external services (OpenAI, Meilisearch, PocketBase)
3. **App Layer** - Use cases and orchestration
4. **Client Layer** - UI components and Svelte stores

This design enables:
- **Testability** - Core logic is independent of external services
- **Flexibility** - Easy to swap implementations (e.g., replace OpenAI with another LLM provider)
- **Separation of Concerns** - Each layer has a single responsibility

---

## Directory Structure

```
src/
├── lib/
│   ├── apps/                    # Domain-driven applications
│   │   ├── scene/              # Scene generation and execution (Enhance → Plan → Act)
│   │   ├── eventChat/          # Chat/conversation management
│   │   ├── memory/             # Memory indexing and retrieval (Meilisearch)
│   │   ├── character/          # Character data and profiles
│   │   ├── story/              # Story management and context
│   │   ├── storyEvent/         # Story events/chapters
│   │   └── user/               # User management and authentication
│   │
│   ├── shared/                  # Cross-cutting concerns
│   │   ├── pb/                 # PocketBase client and types
│   │   ├── server/             # Server-side utilities (OpenAI, Langfuse, LLM config)
│   │   └── ui/                 # UI utilities and shared components
│   │
│   └── index.ts                # Public API exports
│
└── routes/                      # SvelteKit pages and API endpoints
    ├── app/                     # Authenticated application routes
    │   ├── stories/             # Story management UI
    │   ├── characters/          # Character management UI
    │   └── auth/               # Authentication pages
    └── api/                     # Server-side API endpoints
        ├── stories/*/chats/*/sse/  # Event chat streaming
        └── characters/*/chats/*/sse/ # Character chat streaming
```

---

## Application Architecture

### 1. Scene App - The Core AI Engine

The **Scene Application** is the heart of the storytelling system, implementing a three-stage pipeline:

```
User Input → Enhance → Plan → Act → Stream Response
```

#### Core Layer (`src/lib/apps/scene/core/`)

**Models:**
- **SceneIntent** - Enumeration of narrative intents (casual dialogue, romantic flirt, high tension action, etc.)
- **ScenePolicy** - Detailed instructions for how to execute a scene
  - Tempo (slow, normal, fast)
  - DetailLevel (low, medium, high)
  - DialogueDensity, ThoughtsDensity, WorldDensity
  - Character-specific policies (mood, relationship state, allowed modes)
- **ScenePlan** - Steps to execute in a scene
  - Each step has a type (world, thoughts, speech), character ID, and description
- **EnhanceOutput** - Enriched user input analysis
  - Extracted intent, emotion, flow type

**Interfaces:**
- `Enhancer` - Analyzes chat history to determine intent
- `ScenePlanner` - Creates a scene plan based on policy and memories
- `SceneActor` - Executes individual scene steps (sync and streaming)

#### Adapters Layer (`src/lib/apps/scene/adapters/`)

All adapters use OpenAI-compatible APIs with **Grok** as the LLM provider:

**openaiEnhancer.ts:**
- Uses Grok 4 Fast (non-reasoning) model
- Analyzes chat history to extract query enrichment, intent, emotion, and flow type
- Returns structured output via Zod validation

**openaiPlanner.ts:**
- Uses Grok 4 Fast model with structured JSON output
- Creates scene plan based on policy
- Constructs messages from:
  - Static memories (story context, character descriptions)
  - Chat history
  - Event memories (dynamic chat context)
  - Profile memories (character relationships)

**openaiActor.ts:**
- Uses Grok 4 Fast (non-reasoning) model
- Executes individual scene steps with retry logic (max 5 retries)
- Supports both synchronous and streaming responses
- Implements specialized prompts for:
  - World descriptions
  - Character thoughts (inner monologue)
  - Character speech (dialogue)
  - Friend mode (simplified, conversational)

#### Policy Engine (`src/lib/apps/scene/core/engines/scenePolicy.ts`)

Intelligent policy generation that adjusts narrative parameters based on:
- User emotion
- Scene intent
- Scene flow type

For example:
- **Romantic Flirt** → Slow tempo, high detail, high dialogue, medium thoughts
- **High Tension Action** → Fast tempo, medium detail, medium dialogue, high world description
- **Casual Dialogue** → Normal tempo, medium detail, high dialogue

#### App Layer (`src/lib/apps/scene/app/usecases.ts`)

```typescript
class SceneAppImpl implements SceneApp {
  async enhanceQuery(history): Promise<EnhanceOutput>
  async getPolicy(enhance): Promise<ScenePolicy>
  async plan(policy, memories, history): Promise<ScenePlan>
  async act(...): Promise<string>
  actStream(...): ReadableStream<string>
}
```

Dependency injection pattern - receives adapters in constructor:
- Enhancer (OpenAI)
- ScenePlanner (OpenAI)
- SceneActor (OpenAI)

---

### 2. Memory App - Context Management

The **Memory Application** manages three types of memories for AI context:

```
Static Memories (Story/Character Bibles)
    ↓
Profile Memories (Character traits, relationships)
    ↓
Event Memories (Chat history, past events)
```

#### Core Layer (`src/lib/apps/memory/core/`)

**Memory Types:**
```typescript
type StaticMemory = {
  kind: 'static',
  content: string,
  tokens: number,
  characterId?: string  // Optional - for character-specific static memories
}

type ProfileMemory = {
  kind: 'profile',
  type: 'character' | 'relationship',  // Character description or relationship dynamics
  characterIds: string[],  // 1 for character, 2 for relationship
  content: string,
  tokens: number
}

type EventMemory = {
  kind: 'event',
  type: 'story' | 'chat' | 'action' | 'decision',
  content: string,
  chatId: string,
  tokens: number
}
```

**Interfaces:**
- `MemoryApp` - Main app interface with get/put operations
- `ProfileIndexer` - Meilisearch adapter for profile memories
- `EventIndexer` - Meilisearch adapter for event memories

#### Token-Aware Retrieval

The memory app implements sophisticated token budgeting:

```
Total Token Budget: 7000 tokens
├─ Static Memories: 2000 tokens (fixed)
├─ Profile Memories: 2500 tokens (character traits/relationships)
└─ Event Memories: 2500 tokens (recent chat context)
```

Retrieval strategy:
1. Load story static prompt and character descriptions
2. Search profile memories based on query (character relationships)
3. Perform hybrid search on event memories:
   - Half the tokens from all-time events
   - Half from recent events (last 7 days)

#### Adapters Layer (`src/lib/apps/memory/adapters/`)

**MeiliProfileIndexer & MeiliEventIndexer:**
- Meilisearch with Voyage AI embeddings (1024 dimensions)
- Hybrid search (75% semantic, 25% keyword-based)
- Filtered searches:
  - Profile: by character IDs
  - Events: by chat ID, optional date range, optional event type
- Automatic migration on app startup

#### App Layer (`src/lib/apps/memory/app/usecases.ts`)

```typescript
class MemoryAppImpl implements MemoryApp {
  async get(query, tokens, povId, npcIds, chatId): Promise<MemporyGetResult>
  async put(memories): Promise<void>  // Index new memories
}
```

Dependency injection:
- ProfileIndexer
- EventIndexer
- StoryApp (to fetch story context)
- CharacterApp (to fetch character descriptions)

---

### 3. EventChat App - Conversation Orchestration

The **EventChat Application** orchestrates the entire conversation flow from user input to AI response streaming.

#### Core Layer (`src/lib/apps/eventChat/core/`)

**Chat Domain Model:**
```typescript
class Chat {
  data: ChatsResponse  // PocketBase chat record with expanded data
  getMessages(): MessagesResponse[]
  
  // Relationships:
  storyEvent?: StoryEventsResponse  // For story chats
  friend?: string                    // For character chats
  povCharacter: string              // Point of view character
}

type MessageMetadata = {
  step?: SceneStep  // The scene step that generated this message
}
```

#### App Layer (`src/lib/apps/eventChat/app/usecases.ts`)

The core flow:

```typescript
async generate(cmd: SendUserMessageCmd): Promise<ReadableStream> {
  1. Load chat and determine kind (friend | story)
  2. Persist user message to PocketBase
  3. Create placeholder AI message
  
  4. Retrieve context:
     - Load chat message history
     - Call sceneApp.enhanceQuery() → EnhanceOutput
     - Call sceneApp.getPolicy() → ScenePolicy
     - Call memoryApp.get() → memories
  
  5. Plan the scene:
     - Call sceneApp.plan() → ScenePlan (multiple steps)
  
  6. Update user message with metadata (scenePlan, scenePolicy, enhance)
  7. Delete placeholder AI message
  
  8. Execute the scene:
     - For each step in plan:
       a. Create AI message record in PocketBase
       b. Stream actor response via actStream()
       c. Accumulate text and send SSE events
       d. Update message record with final content
       e. Add to history for next step
  
  9. Return ReadableStream of SSE events
}
```

**Token Configuration:**
- History limit: 2000 tokens (recent messages for context)
- Memory limit: 5000 tokens (distributed among memory types)

**SSE Event Format:**
```
event: chunk
data: { text, msgId, stepIndex }

event: error
data: { stepIndex, msgId, error }

event: done
data: { totalSteps }
```

---

### 4. Character App - Profile Management

**Core Layer (`src/lib/apps/character/core/`):**
```typescript
enum Archetype {
  Mentor, Tsundere, Yandere, Trickster, Playboy, Nerd
}

class Character {
  data: CharactersResponse
  staticPrompt: string  // Auto-generated from character data
  
  static fromResponse(res): Character
}
```

**App Layer:**
```typescript
class CharacterAppImpl implements CharacterApp {
  async getByIds(ids: string[]): Promise<Character[]>
}
```

Fetches from PocketBase and builds static prompts for memory context.

---

### 5. Story App - Narrative Context

**Core Layer (`src/lib/apps/story/core/`):**
```typescript
type StoryBible = {
  style: string[]        // Writing style tags
  worldFacts: string[]   // World-building notes
}

class Story {
  data: StoriesResponse<StoryBible, StoryExpand>
  staticPrompt: string   // Auto-generated
  
  getEvents(): StoryEventsResponse[]
  static fromResponse(res, eventOrder?): Story
}
```

Dynamic prompt generation includes:
- Story description
- Writing style and world facts
- Previous events
- Current event being played

**App Layer:**
```typescript
class StoryAppImpl implements StoryApp {
  async getByChat(chatId: string): Promise<Story>
}
```

---

## Data Flow - Complete Conversation Example

```
User Input: "Can you describe how they kiss?"
         ↓
    [HTTP GET /api/stories/.../sse?q=...]
         ↓
    ChatAppImpl.generate()
         ├─ Load chat context from PocketBase
         ├─ Save user message
         ├─ Call sceneApp.enhanceQuery()
         │  └─ Returns: intent=RomanticFlirt, emotion=Excited, flowType=Intimate
         ├─ Call sceneApp.getPolicy()
         │  └─ Returns: slow tempo, high detail, high dialogue, medium thoughts
         ├─ Call memoryApp.get()
         │  ├─ Static: Story bible + Character descriptions (2000 tokens)
         │  ├─ Profile: Character relationship memories (2500 tokens)
         │  └─ Event: Recent chat history (2500 tokens)
         ├─ Call sceneApp.plan()
         │  └─ Returns: [
         │      { type: 'world', description: '...' },
         │      { type: 'character-thoughts', characterId: 'char1', description: '...' },
         │      { type: 'character-speech', characterId: 'char2', description: '...' }
         │    ]
         ├─ For each step:
         │  ├─ Create AI message in PocketBase
         │  ├─ Call sceneApp.actStream(step)
         │  │  └─ Grok API streams: "The warm moonlight..."
         │  ├─ Send SSE chunks: { text: "The warm ", msgId: "...", stepIndex: 0 }
         │  └─ Update message record with final content
         └─ Return SSE stream
         ↓
    [Client receives SSE stream]
    [UI updates in real-time as chunks arrive]
```

---

## Shared Infrastructure

### PocketBase Integration (`src/lib/shared/pb/`)

**Collections:**
- `users` - User accounts
- `stories` - Story records
- `storyEvents` - Story chapters/events
- `characters` - Character profiles
- `chats` - Conversation threads
- `messages` - Individual messages in a chat

**Types:**
- Auto-generated from PocketBase schema via `pocketbase-typegen`
- Located in `pocketbase-types.ts`
- Includes expand definitions for nested queries

**Client:**
```typescript
export const pb = new PocketBase(PUBLIC_PB_URL, store) as TypedPocketBase
```

Uses AsyncAuthStore with localStorage for browser persistence.

### LLM Configuration (`src/lib/shared/server/llms.ts`)

```typescript
const LLMS = {
  GROK_4_FAST: 'grok-4-fast',
  GROK_4_FAST_NON_REASONING: 'grok-4-fast-non-reasoning'
}

const TOKENIZERS = {
  [LLMS.GROK_4_FAST]: encoding_for_model('gpt-4o-mini')
}
```

Uses tiktoken for accurate token counting with GPT-4o-mini encoding.

### Tracing & Observability (`src/lib/shared/server/tracing.ts`)

**Langfuse Integration:**
- `withTracing()` - Wraps route handlers
- `streamWithFlush()` - Ensures traces are flushed after streaming
- Automatic span propagation with userId, sessionId, metadata

```typescript
export const GET = withTracing(handler, {
  traceName: 'storyteller-sse',
  updateTrace: ({ params, locals }) => ({
    userId: locals.user?.id,
    sessionId: params.chatId,
    metadata: { storyId, eventId, chatId }
  })
})
```

---

## Key Conventions & Patterns

### 1. Layer Structure - Every App Follows This Pattern

```
app/
├── core/
│   ├── models.ts      # Domain models and enums
│   ├── in.ts          # Input interfaces (app contract)
│   ├── out.ts         # Output interfaces (external adapters)
│   └── index.ts       # Exports
├── adapters/          # Implementation of out.ts interfaces
│   ├── thirdParty/
│   └── index.ts       # Exports singleton instances
├── app/
│   ├── usecases.ts    # Core app logic using adapters
│   └── index.ts       # Exports singleton app instance
└── client/ (optional)
    ├── index.ts
    ├── *.svelte.ts    # Svelte stores
    └── ui/            # UI components
```

### 2. Dependency Injection

Apps receive their dependencies via constructor:
```typescript
class MyAppImpl implements MyApp {
  constructor(
    private readonly adapter1: Adapter1,
    private readonly adapter2: Adapter2,
    private readonly otherApp: OtherApp
  ) {}
}

export const myApp = new MyAppImpl(adapter1, adapter2, otherApp)
```

This enables:
- Easy mocking for tests
- Clear dependency graph
- Inversion of control

### 3. Singleton Pattern for App Instances

All app instances are singletons exported from `app/usecases.ts`:
```typescript
export const sceneApp = new SceneAppImpl(...)
export const memoryApp = new MemoryAppImpl(...)
export const chatApp = new ChatAppImpl(...)
```

### 4. Error Handling & Retry Logic

Critical operations implement retry logic:
```typescript
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    return await operation()
  } catch (error) {
    if (attempt === MAX_RETRIES - 1) throw error
  }
}
```

### 5. Streaming Pattern

SSE (Server-Sent Events) for real-time response:
```typescript
return new ReadableStream({
  async start(controller) {
    const sendEvent = (event, data) => {
      controller.enqueue(encoder.encode(`event: ${event}\n`))
      controller.enqueue(encoder.encode(`data: ${data}\n\n`))
    }
    // Stream content
  }
})
```

### 6. Type Safety with Zod

All structured outputs validated with Zod:
```typescript
const EnhanceOutputSchema = z.object({
  query: z.string(),
  interactionIntent: z.enum([...]),
  userEmotion: z.enum([...])
})

const result = EnhanceOutputSchema.parse(data)
```

### 7. Token Budgeting

Every memory and context retrieval respects token limits:
```typescript
const tokens = TOKENIZERS[LLMS.GROK_4_FAST].encode(content).length
remainingTokens -= tokens
if (remainingTokens < 0) break  // Stop retrieving when budget exhausted
```

---

## Route Structure

### Protected Routes (require authentication via locals.user)

**Story Chats:**
```
GET /api/stories/[storyId]/events/[eventId]/chats/[chatId]/sse?q=...
  → chatApp.generate() with 'story' kind
  → Streams multiple character perspectives
```

**Character Chats:**
```
GET /api/characters/[characterId]/chats/[chatId]/sse?q=...
  → chatApp.generate() with 'friend' kind
  → Streams single character perspective
```

### Client Routes

- `/app/stories` - Story list
- `/app/stories/[storyId]/events` - Events in a story
- `/app/stories/[storyId]/events/[eventId]/chats` - Chats in an event
- `/app/stories/[storyId]/events/[eventId]/chats/[chatId]` - Chat interface
- `/app/characters` - Character list
- `/app/characters/[characterId]/chats/[chatId]` - Character chat interface

---

## Development Guidelines

### Adding a New App

1. Create `src/lib/apps/myapp/` directory
2. Implement layers:
   ```
   core/models.ts     → Domain entities
   core/in.ts         → Input/usecase interfaces
   core/out.ts        → External service interfaces
   adapters/          → Implementations of out.ts
   app/usecases.ts    → App logic using adapters
   app/index.ts       → Export singleton
   ```
3. Register in dependency chain if needed
4. Export from `src/lib/index.ts`

### Adding a New Adapter

1. Create in `src/lib/apps/yourapp/adapters/yourservice/`
2. Implement interface from `core/out.ts`
3. Add configuration to `src/lib/shared/server/` if needed
4. Export singleton from `adapters/index.ts`
5. Inject into app constructor

### Adding Tracing

```typescript
import { observeOpenAI } from '@langfuse/openai'

const tracedClient = observeOpenAI(openaiClient)
// Use tracedClient instead of openaiClient
```

All OpenAI calls are automatically traced to Langfuse.

---

## Performance Considerations

1. **Token Budgeting** - Critical for cost control
   - Always check token counts before API calls
   - Use TOKENIZERS to estimate costs

2. **Streaming** - For long-running operations
   - Use actStream() for real-time feedback
   - SSE pattern for browser compatibility

3. **Memory Caching** - Through PocketBase subscriptions
   - Client-side stores (Svelte runes) auto-sync
   - Subscribe to collection changes

4. **Meilisearch Optimization**
   - Hybrid search balances semantic + keyword matching
   - Proper filtering on indexed attributes
   - Embeddings are user-provided (Voyage)

---

## Testing

Testing follows the port & adapters pattern - mock adapters easily:

```typescript
class MockEnhancer implements Enhancer {
  async enhance() { return mockEnhanceOutput }
}

const testApp = new SceneAppImpl(
  new MockEnhancer(),
  new MockPlanner(),
  new MockActor()
)
```

---

## Environment Variables

**Required:**
- `PUBLIC_PB_URL` - PocketBase URL
- `OPENAI_API_KEY` - OpenAI API key
- `GROK_API_KEY` - Grok API key
- `MEILI_URL` - Meilisearch URL
- `MEILI_MASTER_KEY` - Meilisearch master key
- `LANGFUSE_PUBLIC_KEY` - Langfuse public key
- `LANGFUSE_SECRET_KEY` - Langfuse secret key

---

## Future Extensibility

The architecture is designed for:

1. **Multiple LLM Providers** - Replace Grok adapter with Claude, OpenAI, Llama
2. **Alternative Memory Systems** - Swap Meilisearch with Pinecone, Weaviate
3. **Custom Policy Engines** - Implement alternative policy generation
4. **Multi-language Support** - Add prompt translations
5. **Streaming Alternatives** - WebSocket instead of SSE if needed

All enabled by the adapter pattern and dependency injection.

