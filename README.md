# Bebop MAD: Amazon Nova AI Hackathon Project

Bebop MAD is an innovative application developed for the Amazon Nova AI Hackathon. It leverages the cutting-edge capabilities of Amazon Nova models to deliver a real-time neurofeedback and mental wellness companion. This project combines advanced reasoning, voice AI, and multimodal understanding to create a unique and impactful user experience.

---

## 🚀 Key Features

### Powered by Amazon Nova Models
- **Nova 2 Lite**: A fast, cost-effective reasoning model for emotion classification and cognitive state analysis.
- **Nova 2 Sonic**: A speech-to-speech model enabling natural, low-latency conversational AI.

### Application Highlights
- **Voice Therapy Sessions**: Real-time voice interaction with dynamic emotional regulation techniques.
- **Live Brain Visualization**: Retro 80s-inspired animated heatmap of active cognitive regions.
- **MARA (Memory-Augmented Regulation Agent)**: Tracks emotional arcs, dominant states, and historical context.
- **Exercise Library**: Curated techniques like breathing, CBT, grounding, and PMR.
- **Insights Dashboard**: Session history, mood trends, and personalized recommendations.
- **Privacy Controls**: Granular consent options for data handling.

---

## 🛠️ Technical Overview

### Backend
The backend is powered by AWS Bedrock's Nova models and features:
- **Dual-Model Strategy**: Combines Nova Sonic for voice interaction and Nova Lite for emotion classification.
- **MARA Memory System**: Tracks emotional states and dynamically injects context into Nova Sonic's system prompts.
- **WebSocket API**: Streamlined connection flow for robust, real-time communication.
- **REST Endpoints**: For manual emotion classification and session data retrieval.

For more details, see the [Backend README](backend/README.md).

### Frontend
The frontend is built with modern web technologies:
- **Next.js**: App Router architecture for server-side rendering and routing.
- **Tailwind CSS**: Customizable styling with a retro aesthetic.
- **Clerk Authentication**: Secure user authentication and onboarding.
- **Convex Database**: Real-time data synchronization and serverless functions.

For more details, see the [Client README](client/README.md).

---

## 📂 Project Structure

```
/
├── backend/   # Backend services and APIs
├── client/    # Frontend application
```

---

## 🌟 About Amazon Nova
Amazon Nova is a portfolio of foundation models and services that deliver frontier intelligence and industry-leading price performance. This project showcases the capabilities of Nova models, including:
- **Advanced Reasoning**
- **Tool Use**
- **Voice AI**

### Nova Models Used
- **Nova 2 Lite**: For emotion classification and cognitive state analysis.
- **Nova 2 Sonic**: For conversational AI and voice interaction.

---
