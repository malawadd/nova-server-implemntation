# NOVA: NeuroFeedback & MARA 🧠

NOVA is a memory-augmented neurofeedback application powered by AWS Bedrock's Nova models. It combines real-time voice interaction with emotional intelligence to provide dynamic regulation techniques.

## 🚀 Key Features
- **Nova Sonic**: High-performance bidirectional voice streaming for natural, low-latency conversation.
- **Nova Lite**: Specialized emotion classification processing user utterances in parallel.
- **MARA (Memory-Augmented Regulation Agent)**: A persistent session store that tracks emotional arcs, dominant states, and historical context.
- **Real-time Regulation**: Dynamic activation of techniques like Box Breathing, Body Scan, and Cognitive Reframing based on detected emotional states.
- **Diagnostic Panel**: Integrated tool for manual classification testing and session state inspection.

---

## 🏗️ Technical Architecture

### 1. MARA Memory System (`src/mara.ts`)
MARA maintains the "emotional state" of the session. It tracks:
- **Emotion Snapshots**: Timestamped records of emotion, brain region, and technique.
- **Dominant Emotion**: Calculated from the most frequent recent states.
- **Emotional Arc**: Detects if the user is `improving`, `worsening`, or `stable`.
- **System Prompt Injection**: MARA context is dynamically injected into Nova Sonic's system prompt during sessions.

### 2. Dual-Model Strategy
- **`amazon.nova-2-sonic-v1:0`**: Handles the heavy lifting of voice interaction, tool use, and empathetic response.
- **`amazon.nova-lite-v1:0`**: Acts as a precise classifier, mapping text transcripts to emotional payloads (Anxiety, Stress, Sadness, Neutral) and biological markers (Amygdala, Insula, Prefrontal Cortex).

---

## 📡 API & WebSocket Reference

### WebSocket Events (`Socket.IO`)
| Event | Direction | Description |
| :--- | :--- | :--- |
| `initializeConnection` | Client → Server | **Automated Setup:** Initializes the Bedrock stream, injects MARA context into the system prompt, and starts audio automatically. |
| `emotionDetected` | Server → Client | Payload: `emotion`, `brain_region`, `technique`, `confidence`. |
| `maraUpdate` | Server → Client | Payload: `dominantEmotion`, `emotionalArc`, `techniqueHistory`. |
| `sessionSummary` | Server → Client | Sent on `stopAudio`, provides a full emotional review of the session. |

### Streamlined Connection Flow
The backend now features a fully automated WebSocket connection flow to eliminate client-side race conditions. When the client invokes `initializeConnection`, the server automatically orchestrates the complete setup sequence:
1. **Stream Initialization**: Prepares bidirectional Bedrock streaming.
2. **Context Injection**: Builds the MARA memory context and dynamically injects it into the system prompt.
3. **Audio Startup**: Readies the server for audio transmission.
This ensures a robust, sequential setup without requiring discrete `promptStart`, `systemPrompt`, or `audioStart` events from the client.

### REST Endpoints
- **`POST /api/classify-emotion`**: Manually classify a transcript using Nova Lite.
- **`GET /api/mara/:sessionId`**: Retrieve the full MARA memory state for a given session.
- **`GET /health`**: System status and active session counts.

---

## 🛠️ Repository Structure
```
.
├── public/                 # Frontend web application files
│   ├── index.html          # Main application entry point
│   ├── diagnostic.html     # Developer diagnostic panel
│   └── src/                # Frontend source code
├── src/                    # Backend TypeScript source files
│   ├── client.ts           # Nova Sonic stream client
│   ├── server.ts           # Express & Socket.IO implementation
│   ├── mara.ts             # MARA Memory Logic
│   ├── consts.ts           # System prompts and tool definitions
│   └── types.ts            # Shared types
└── tsconfig.json           # TypeScript configuration
```

---

## 🚥 Usage Instructions

### Prerequisites
- Node.js (v18+)
- AWS Account with Bedrock access (Nova Sonic/Lite enabled)
- AWS CLI configured (or `.env` with credentials)

### Installation & Run
1. **Setup**:
   ```bash
   npm install
   cp .env.example .env # Fill in your AWS credentials
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

3. **Open Interfaces**:
   - Application: `http://localhost:3000`
   - Diagnostics: `http://localhost:3000/diagnostic.html`