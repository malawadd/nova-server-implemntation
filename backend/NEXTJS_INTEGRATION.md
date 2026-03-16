# Next.js + Convex Integration Plan

This document outlines a practical way to use this production audio streaming server from a Next.js app while storing conversation history in Convex.

## Goal

Use this server for:
- real-time audio streaming
- Bedrock bidirectional inference
- live assistant audio playback

Use Next.js + Convex for:
- authentication
- app UI and routing
- prompt selection and app state
- durable conversation storage
- transcript history and analytics

## Recommended architecture

### Responsibilities

**This Node server**
- keeps the live `Socket.IO` connection open
- streams microphone audio to Bedrock
- receives text/audio events back from Bedrock
- emits incremental events to the browser

Relevant server flow:
- socket session lifecycle in [src/server.ts](src/server.ts#L128-L465)
- Bedrock stream startup in [src/client.ts](src/client.ts#L320-L346)
- health check in [src/server.ts](src/server.ts#L469-L478)

**Next.js app**
- renders the UI
- captures microphone input in the browser
- opens a `Socket.IO` connection to the production streaming server
- listens for transcript/audio events
- forwards final conversation data to Convex

**Convex**
- stores conversations, turns, messages, prompts, and metadata
- provides queries/subscriptions to render saved history
- optionally stores session summaries, statuses, and audit events

## High-level flow

```text
Browser (Next.js)
  ├─ opens Socket.IO connection to production streaming server
  ├─ streams audio chunks
  ├─ receives transcript/audio events
  ├─ plays assistant audio locally
  └─ writes transcript events or finalized turns to Convex

Production streaming server
  ├─ manages real-time Bedrock session
  ├─ emits user/assistant text events
  └─ emits assistant audio events

Convex
  ├─ stores conversation record
  ├─ stores turns/messages
  └─ powers historical UI and search
```

## Best integration pattern

Do **not** route audio through Convex.

Instead:
1. Next.js browser connects directly to this production server over `Socket.IO`.
2. Next.js browser receives text/audio events.
3. Next.js app writes structured conversation data to Convex.

This keeps Convex responsible for persistence, while the streaming server handles low-latency audio.

## Why this pattern fits the current server

The current implementation is optimized for a stateful streaming session:
- `initializeConnection`
- `promptStart`
- `systemPrompt`
- `audioStart`
- `audioInput`
- `stopAudio`

And it emits:
- `contentStart`
- `textOutput`
- `audioOutput`
- `contentEnd`
- `streamComplete`
- `error`
- `audioReady`

Those events are already suited to a browser client. Convex should store results, not act as the streaming transport.

## Proposed production topology

### Frontend
- Next.js app hosted on Vercel or another frontend platform

### Realtime backend
- this Node server hosted separately on Railway, ECS/Fargate, EC2, or Fly.io

### Data layer
- Convex project for durable storage

### Connectivity
- browser connects to Next.js origin for app pages
- browser connects to streaming server origin for live audio session
- browser connects to Convex for queries/mutations

## Suggested data model in Convex

### `conversations`
One row per conversation.

Suggested fields:
- `userId`
- `title`
- `createdAt`
- `updatedAt`
- `status` (`active`, `completed`, `failed`)
- `promptName`
- `systemPrompt`
- `streamServerSessionId`
- `modelId`

### `conversationMessages`
One row per saved message.

Suggested fields:
- `conversationId`
- `role` (`USER`, `ASSISTANT`, `SYSTEM`, `TOOL`)
- `content`
- `contentType` (`text`, `audio_ref`, `tool_result`)
- `sequence`
- `turnIndex`
- `createdAt`
- `stopReason`

### `conversationEvents` (optional)
Useful for debugging or analytics.

Suggested fields:
- `conversationId`
- `eventType`
- `payload`
- `createdAt`

## What should be saved to Convex

### Minimum useful persistence
Save only finalized transcript text:
- final user utterances
- final assistant responses
- conversation status

### Better persistence
Also save:
- prompt used for the session
- timestamps per turn
- interruptions / stop reasons
- error messages
- server session id for debugging

### What not to store by default
Avoid storing raw PCM chunks in Convex.

Reason:
- very high volume
- expensive and unnecessary for chat history
- better handled by object storage if recordings are required

If audio retention is needed, upload recordings to object storage and store only references in Convex.

## Recommended implementation plan

## Phase 1: Wrap the current browser logic in a reusable Next.js client module

Move the logic currently living in [public/src/main.js](public/src/main.js) into a client-side Next.js service/hook.

Suggested pieces:
- `useVoiceSession()` hook
- `socketClient.ts`
- `audioCapture.ts`
- `audioPlayback.ts`

Responsibilities:
- open/close `Socket.IO` connection
- initialize session
- stream microphone data
- receive transcript/audio events
- expose UI state to React components

## Phase 2: Create Convex schema for conversation storage

In Convex, define tables for:
- conversations
- conversationMessages
- optional conversationEvents

Add mutations such as:
- `createConversation`
- `appendConversationMessage`
- `completeConversation`
- `failConversation`

Add queries such as:
- `listConversationsByUser`
- `getConversationWithMessages`

## Phase 3: Start a Convex conversation before opening the stream

When user clicks Start in Next.js:
1. call Convex mutation to create a new conversation row
2. keep the returned `conversationId` in React state
3. open the socket connection to the streaming server
4. pass the selected prompt/system prompt to the server

This gives every live stream a durable Convex parent record from the beginning.

## Phase 4: Persist transcript events from the browser

Listen to server events and convert them into Convex writes.

### Suggested mapping

**On first finalized user text**
- append a `USER` message

**On finalized assistant text**
- append an `ASSISTANT` message

**On `streamComplete`**
- mark conversation complete

**On `error`**
- mark conversation failed
- optionally persist error payload in `conversationEvents`

## Phase 5: Save only finalized text, not every partial token

The current server may emit incremental content. Do not write every small fragment directly to Convex unless you explicitly need token-level replay.

Recommended behavior:
- buffer text locally in the browser during a turn
- save to Convex when the turn is complete
- use `contentEnd` and `stopReason` to determine when to persist a finalized message

This avoids excessive write volume.

## Phase 6: Secure the production streaming server

The Next.js app should not expose unrestricted public access to the streaming server.

Recommended options:
- short-lived signed session token from Next.js/Convex-authenticated backend
- allow only authenticated users to request a stream session
- pass a JWT or signed token during socket connection

Then the streaming server should validate that token before honoring:
- `initializeConnection`
- `audioInput`
- `stopAudio`

## Authentication plan

### Recommended flow
1. user signs into Next.js app
2. Next.js obtains authenticated app identity
3. browser requests a short-lived stream token from your app backend
4. browser connects to the streaming server with that token
5. streaming server validates token and starts session
6. browser writes transcript data to Convex as the authenticated user

## Cross-origin setup

Because the Next.js app and streaming server will likely run on different domains, configure:
- CORS for HTTP routes
- Socket.IO CORS for websocket handshake

You will likely need to update [src/server.ts](src/server.ts#L13-L16) to initialize `Socket.IO` with explicit CORS settings for your Next.js origin.

Example policy to support later:
- allow `https://your-next-app.com`
- allow credentials only if needed
- block unknown origins in production

## Suggested environment variables

### Next.js
- `NEXT_PUBLIC_STREAM_SERVER_URL`
- `NEXT_PUBLIC_CONVEX_URL`

### Streaming server
- `AWS_REGION`
- `PORT`
- `ALLOWED_ORIGIN`
- auth secret or public key for validating stream tokens

## Minimal end-to-end browser sequence

### Start conversation
1. user clicks Start
2. Next.js calls Convex `createConversation`
3. Next.js connects to streaming server
4. socket emits `initializeConnection`
5. socket emits `promptStart`
6. socket emits `systemPrompt`
7. socket emits `audioStart`
8. browser streams `audioInput`

### During conversation
1. browser receives `textOutput`
2. browser updates live UI
3. browser buffers finalized turn text
4. browser persists finalized turn to Convex

### End conversation
1. browser emits `stopAudio`
2. server emits final events
3. browser calls Convex `completeConversation`
4. Next.js conversation page subscribes to Convex history

## Reliability notes

### If the socket disconnects
- mark the conversation as interrupted or failed in Convex
- keep partial buffered text client-side if useful
- let the user retry with a new stream session

### If Convex write fails
- keep a client-side retry queue for finalized messages
- retry mutation writes after reconnect

### If server scaling is needed
Current server state is in memory:
- socket session maps in [src/server.ts](src/server.ts#L26-L39)
- active stream sessions in [src/client.ts](src/client.ts#L139-L141)

That means horizontal scaling requires one of:
- sticky sessions at the load balancer
- or refactoring session state into shared infrastructure

For initial production, prefer a single instance.

## Security notes

- never expose AWS credentials to Next.js client code
- Next.js client should talk only to your deployed streaming server
- keep Bedrock access only on the streaming server
- store only app-level conversation data in Convex

## Recommended folder split in a future Next.js app

```text
app/
  conversations/
    [id]/page.tsx
  voice/page.tsx
components/
  voice/
    VoiceControls.tsx
    TranscriptPanel.tsx
lib/
  voice/
    socketClient.ts
    useVoiceSession.ts
    audioCapture.ts
    audioPlayback.ts
convex/
  schema.ts
  conversations.ts
  messages.ts
```

## Initial implementation checklist

- [ ] Deploy this streaming server to production
- [ ] Add production CORS policy to the streaming server
- [ ] Create Convex schema for conversations and messages
- [ ] Create Next.js client hook for socket session management
- [ ] Create Convex mutations for conversation lifecycle
- [ ] Persist finalized user and assistant turns to Convex
- [ ] Add authenticated stream token flow
- [ ] Add retry handling for disconnects and failed writes

## Recommended first milestone

Build the simplest production version first:
1. Next.js page opens a socket to the deployed server
2. user can talk to the assistant
3. finalized transcript text is saved to Convex
4. a conversation history page reads stored messages from Convex

Once that works, add:
- auth
- signed stream tokens
- better error recovery
- optional audio recording references
