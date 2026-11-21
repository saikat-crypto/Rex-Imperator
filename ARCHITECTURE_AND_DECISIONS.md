# Usher — Architecture, System Design & Decision Log

> **Product**: Usher (AI-Native Educational Platform for Gen Z & Gen Alpha)  
> **Status**: Active Development  
> **Target Platforms**: Desktop (Web / Tauri Native) & Mobile (Android / iOS)  
> **Repository**: `e:/Antigravity/Usher`  
> **Last Updated**: November 2026

---

## 1. Product Vision & Core Mission

Usher is an AI-native educational product designed specifically for Gen Z and Gen Alpha students. 

While general AI products (like ChatGPT) act as general-purpose chatbots and search-centric tools (like Perplexity) focus on web indexing, Usher is built exclusively for curriculum mastery, structured learning, and exam excellence:
- **Curriculum-Grounded**: Responses are grounded in verified textbook chapters, syllabus notes, and official board examination marking schemes via Retrieval-Augmented Generation (RAG).
- **Exam-Ready Reasoning**: Explains concepts step-by-step, highlighting official marking scheme keywords and scoring criteria.
- **Flawless Mathematical Typography**: Math and physics equations are never degraded to plain text; they are rendered in high-precision LaTeX ($...$ and $$...$$) using KaTeX.
- **Zero-Inference-Cost Goal**: Designed from day one to transition from cloud testing into a **Local-First / Edge AI architecture**, turning student devices (laptops and phones) into self-hosted offline inference engines.

---

## 2. Architectural Pillars & Core Decisions

### Decision 1: Cost-First Engineering (Zero Waste)
- **Problem**: Cloud inference and always-on vector database clusters (Pinecone, OpenSearch) scale costs linearly with active users, leading to massive monthly server bills.
- **Solution**:
  - **No Cloud Vector DB**: RAG is implemented with portable, pre-embedded Knowledge Pack JSON files loaded directly into memory and queried using ultra-fast dot-product cosine similarity (< 15ms latency).
  - **Pay-Per-Request Persistence**: Chat history uses AWS DynamoDB with on-demand capacity (`PAY_PER_REQUEST`), costing $0 when idle.
  - **Provider-Agnostic LLM Layer**: The AI caller in `src/utils/llm.ts` is decoupled from the UI. Testing uses AWS Bedrock; production will swap to a local embedded inference server (`localhost:<port>` running `llama.cpp` / Qwen2-VL-2B).

### Decision 2: Local-First / On-Device Deployment Strategy
- **Roadmap Order**: Complete all desktop and mobile frontend and backend features first using fast cloud testing. Once the product experience is complete, package the app via Tauri (Desktop) and Android NDK (Mobile) bundled with an on-device quantized model.
- **Model Selection for Mediocre Android Phones & Laptops**:
  - **Selected Model**: **Qwen2-VL-2B Instruct** (Q4_K_M quantization, ~1.8 GB footprint).
  - **Capabilities**: Full multimodal vision-language model. Capable of reading photos of circuit diagrams, geometry figures, physics graphs, optics rays, and messy handwritten math, outputting step-by-step LaTeX derivations.
  - **Hardware Feasibility**: Fits easily in the available RAM of standard 6 GB / 8 GB RAM phones and all modern laptops.

### Decision 3: 100% Bespoke, Branded UI (No Native Controls)
- **Directive**: Any dropdown, modal, dialog, button, popover, or effect must be completely custom and built specifically for the Usher brand.
- **Prohibition**: Native OS/browser controls (like default HTML `<select>` dropdowns) are strictly forbidden.
- **Brand Palette**:
  - Base: Warm Alabaster (`#FAF8F5`) & Pure White (`#FFFFFF`)
  - Primary Dark: Deep Obsidian (`#181615`)
  - Brand Gold: Vibrant Yellow (`#FCD702`)
  - Accent Red: Crimson (`#D93025` / `#D60103`)
  - Borders: Whisper-soft borders (`border-black/[0.06]` to `border-black/15`)
  - Typography: Editorial Serif (`font-serif`) for headers paired with crisp geometric sans-serif for UI.
  - Micro-interactions: Spring physics via `framer-motion` (`stiffness: 400`, `damping: 30`) and tactile press states (`active:scale-[0.97]`).

### Decision 4: Non-Negotiable LaTeX Standard
- Under no circumstance may mathematical expressions, algebraic formulas, physical laws, or units be printed in plain text approximations.
- In `src/components/Chat/RichBlocks/TextBlock.tsx`, both inline math (`$...$`) and display blocks (`$$...$$`) are processed through KaTeX into mathematically formatted typography.

### Decision 5: Granular Educational RAG, 10-Tier Taxonomy & Concept Graph Working Memory
- **100% Autonomous Prompt Inference**: Zero onboarding friction; students are never forced to select subject folders or academic profiles upfront. The router dynamically detects educational entities (`board`, `grade`, `subject`, `chapter`, `topic`, `subtopic`) with graceful fallback to generalized retrieval for partial/unspecified prompts.
- **10-Tier Educational Taxonomy**: Standardized hierarchy for indexing all curriculum assets: Authority/Board $\rightarrow$ Grade $\rightarrow$ Stream $\rightarrow$ Subject $\rightarrow$ Source Edition $\rightarrow$ Unit $\rightarrow$ Chapter $\rightarrow$ Topic $\rightarrow$ Subtopic $\rightarrow$ Pedagogical Artifact Type.
- **Curriculum Concept Graph + Dynamic Session Memory**: Replaces expensive multi-turn text re-summarization. An active concept cursor traverses neighbor edges in a predefined concept graph to resolve pronouns and follow-up queries across 50+ turns with zero latency lag.
- **Embedded SQLite Hybrid Retrieval**: Single-file local database engine (Tauri, Android, Web WASM) combining relational metadata filtering, FTS5 BM25 keyword matching (for exact formulas and exam years), and dense vector similarity.
- **Per-Message Citation Persistence & Native Inline Tokenizer**: Retrieved sources are stored directly on each `Message` (`msg.sources = [...]`) and persisted in DynamoDB and localStorage. Citation tags (`[1]`, `[2]`, `[1, 2]`) are parsed as native inline markdown tokens inside `TextBlock.tsx`, guaranteeing smooth inline text flow with rich hover preview cards, click-to-pin ergonomics, and clean clipboard copying.
- **Strict Grounding Filter & Anti-Hallucination**: The system cross-references generated responses with the internal knowledge base. Only sources retrieved from the curated curriculum AND actually referenced via bracketed tokens in the text are linked; responses to casual or unindexed prompts produce zero citation tags and suppress the sources shelf entirely.
- **Branded Curriculum Sources Shelf**: The toggle button is styled in Usher's Alabaster and Obsidian palette with a Brand Yellow (`#FCD702`) accent badge. When opened, it transitions into an active obsidian header with verified curriculum grounding seals, displaying the referenced textbooks, marking schemes, and syllabus documents with KaTeX-rendered excerpts.

### Decision 6: Automated Curriculum Harvesting & High-Fidelity Preprocessing Pipeline
- **Problem**: Comprehensive RAG across 3 major boards (CBSE, CISCE, West Bengal Board) and 5 core subjects (Physics, Chemistry, Mathematics, Biology, English) requires hundreds of official textbooks, syllabuses, and marking schemes, many behind legacy government server firewalls and non-standard SSL stacks.
- **Solution**:
  - **Legacy SSL Renegotiation Adapter**: Configured custom `LegacySSLAdapter` injecting `ssl.OP_LEGACY_SERVER_CONNECT` (OpenSSL 3.0 flag `0x4`) into Python HTTP session managers, successfully bypassing handshake failures with Indian state education servers (`wbchse.wb.gov.in`, `wbbse.wb.gov.in`).
  - **Multi-Board Harvester (`scripts/scrape_curriculum.py`)**: Automated parallel crawler downloading 384+ official curriculum PDFs (810+ MB) with real-time manifest registration (`data/raw/manifest.json`), covering:
    - **CBSE**: Official NCERT Textbooks (Classes 9–12 across PCMB + English), 2024–25 Secondary and Senior Secondary Syllabuses, and 2021–2025 Sample Question Papers (SQPs) & Marking Schemes (MS).
    - **CISCE**: Official 2024 & 2025 Syllabuses, Specimen Question Papers, and Answer Keys/Marking Schemes for ICSE (Class 10) and ISC (Class 11–12).
    - **West Bengal Board (WBCHSE)**: Complete Semester-wise Syllabuses, 2026 Model Question Papers, and Semester 3 Question Patterns for Class 11–12.
  - **High-Fidelity Document Ingestion (`scripts/ingest_curriculum.py`)**: PyMuPDF-based text and layout extraction generating 6,531 atomic knowledge chunks partitioned into `data/processed/chunks/`, automatically standardizing formulas and equations into strict KaTeX syntax (`$...$` and `$$...$$`) and tagging each chunk with 10-tier taxonomy metadata and granular citation coordinates.

---

## 3. Implemented Features & Codebase Inventory

### A. Authentication & Session Management
- **File**: `src/context/AuthContext.tsx`, `src/components/Auth/AuthPage.tsx`
- **Infrastructure**: AWS Cognito User Pool (`us-east-1_m8EPvsfyl`, Client ID: `40fruf14l2bhd4vkc8ironqmua`).
- **Features**:
  - Secure SRP (Secure Remote Password) authentication.
  - Sign-up with verification code delivery to email.
  - Sign-in, sign-out, password reset flow, and live password updates via `updatePassword`.
  - Auto-login session recovery with 365-day refresh token validity.
  - Full-page dedicated `AuthPage` gating the workspace behind authentication.

### B. Chat Persistence & Multi-Turn History
- **Files**: `src/utils/chatStorage.ts`, `src/App.tsx`, `src/utils/llm.ts`
- **Infrastructure**: AWS DynamoDB table `usher-conversations` (`userId` partition key, `conversationId` sort key).
- **Features**:
  - Dual-layer storage: optimistic `localStorage` cache for instant UI rendering + DynamoDB cloud persistence.
  - Conversations survive logout/login and are permanently retrievable.
  - Conversation title inference: generated automatically by AI from the first user prompt and locked permanently.
  - Multi-turn conversation memory: passes complete chronological message history to the model on every exchange.

### C. Educational RAG Engine & Inline Citations
- **Files**: 
  - `src/utils/rag/ragEngine.ts` (Cosine similarity search & context formatting)
  - `src/utils/rag/embedder.ts` (Titan Embeddings Text v2 vector generator)
  - `src/data/knowledgePacks/grade10PhysicsElectricity.json` (Seed curriculum pack)
  - `scripts/build_pack.py` (Pack compilation & embedding script)
  - `src/components/Chat/RichBlocks/CitationTooltip.tsx` (Bespoke hover preview tooltip card)
  - `src/components/Chat/RichBlocks/TextBlock.tsx` (Native inline citation token parsing)
- **Features**:
  - 9 pre-embedded chunks for Grade 10 Physics (Electricity), covering textbook sections and CBSE past board exam marking schemes.
  - In-memory dot-product cosine similarity search (< 15ms).
  - **Per-Message Source Persistence**: Retrieved sources are stored directly on `msg.sources` and saved to DynamoDB & localStorage, surviving page reloads and chat switches.
  - **Native Inline Tokenizer**: `[1]`, `[2]` are parsed directly inside `renderInlineMarkdown`, rendering inline without sentence-splitting line breaks.
  - **Bespoke Hover Tooltips**: Hovering over badges displays an animated card with Board/Grade, Subject, Document Type (Textbook vs Exam Scheme), and verbatim excerpt.
  - **Sanitized Copying**: Copying messages automatically strips citation numbers (`[1]`, `[2]`) to leave clean text on the clipboard.

### D. Voice Typing (Speech-to-Text)
- **Files**: `src/components/Chat/ChatInput.tsx`, `src/utils/useAudioRecorder.ts`, `src/components/Chat/VoiceWaveform.tsx`
- **Features**:
  - AssemblyAI Nano real-time speech-to-text integration.
  - Audio waveform UI with pulsing vertical capsules.
  - Dual control actions: Square button (stop & transcribe into input box) and Cross button (cancel and discard).
  - Automatic exponential backoff handling for API rate limits (HTTP 429).

### E. Settings & User Preferences (Dedicated Full Page)
- **Files**: 
  - `src/components/Settings/SettingsPage.tsx`
  - `src/context/PreferencesContext.tsx`
  - `src/components/UI/CustomDropdown.tsx`
- **Features**:
  - Full separate page view (not a modal popup) with clean top header (`Back to Chat`, `Done`, `✓ Saved`).
  - Read-only account credentials (Full Name, Email) and Sign-in Provider indicator.
  - Password change form for email/password authenticated users.
  - 4 custom dropdown toggles with complete explanatory descriptions:
    1. **Response Length**: `Concise` | `Balanced` | `Long`
    2. **Charts, Graphs & Visual Elements**: `On` | `Off`
    3. **Rich Formatting**: `None` | `Slight` | `Balanced` | `High`
    4. **Emojis**: `None` | `Less` | `Balanced` | `High`
  - Preferences dynamically customize the AI system prompt in `src/utils/llm.ts`.
  - Automatic persistence across sessions in user-scoped local storage.

### F. Custom UI & Component Library
- **Files**:
  - `src/components/UI/CustomDropdown.tsx`: Bespoke animated dropdown replacing native browser `<select>`.
  - `src/components/Sidebar/Sidebar.tsx`: Custom Rename and Delete confirmation dialogs with frosted blur backdrops, tactile buttons, and three-dots context menu.
  - `src/components/Chat/RichBlocks/TextBlock.tsx`: Real-time markdown parser with integrated KaTeX inline and block math rendering.

---

## 4. Key Configuration & Environment Variables

| Variable | Description |
|---|---|
| `VITE_COGNITO_USER_POOL_ID` | `us-east-1_m8EPvsfyl` |
| `VITE_COGNITO_CLIENT_ID` | `40fruf14l2bhd4vkc8ironqmua` |
| `VITE_AWS_REGION` | `us-east-1` |
| `VITE_AWS_ACCESS_KEY_ID` | AWS IAM credentials for Bedrock & DynamoDB |
| `VITE_AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `VITE_ASSEMBLYAI_API_KEY` | AssemblyAI Nano API Key for voice typing |

---

## 5. Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite 6
- **Styling & Motion**: Tailwind CSS, Framer Motion
- **Math Rendering**: KaTeX 0.19
- **Cloud Infrastructure (Development/Testing)**:
  - AWS Bedrock (`meta.llama3-8b-instruct-v1:0` for LLM, `amazon.titan-embed-text-v2:0` for embeddings)
  - AWS Cognito (SRP Auth)
  - AWS DynamoDB (`usher-conversations`)
- **Speech Processing**: AssemblyAI Nano
- **Target Native Packaging**: Tauri (Desktop), React Native / Kotlin (Mobile)
- **Target Edge AI Runtime**: `llama.cpp` / Qwen2-VL-2B (GGUF Q4_K_M)

---

## 6. Development Roadmap

```
[Phase 1: Core Desktop Web Application] ◄ (CURRENT FOCUS)
 ├── OpenUI Interactive Educational Widgets (Calculators, Graphs, Circuit Renderers)
 ├── Multi-Subject Curriculum Packs (Chemistry, Biology, Mathematics)
 └── UI / UX Polish & Ergonomics

[Phase 2: Mobile Responsive Experience]
 ├── Responsive drawer navigation & mobile input ergonomics
 └── Camera snapshot capture workflow for question papers

[Phase 3: Native Packaging & Local-First AI Engine]
 ├── Tauri Desktop App packaging (Windows .exe / macOS .dmg)
 ├── Android APK packaging via C++ llama.cpp / NDK
 ├── Model asset downloader (Qwen2-VL-2B .gguf ~1.8 GB)
 └── Point llm.ts to localhost embedded inference server
```

---

## 7. Knowledge Inventory: Data, Curriculums & Context Fed to the AI

This section catalogs all curriculum knowledge, textbook assets, examination schemes, and runtime contexts currently ingested and supplied to the Usher AI model.

### Layer 1: Active Runtime Knowledge Engine (Hybrid Vector + Curriculum Catalog)
- **Primary Embedded Pack**: `src/data/knowledgePacks/grade10PhysicsElectricity.json` (9 high-priority atomic chunks with 256-dimensional Amazon Titan Text v2 vector embeddings for instant semantic search).
- **Curriculum Catalog**: `public/data/curriculum_chunks.json` (6,276 substantive curriculum chunks spanning CBSE, ISC, ICSE, and WBCHSE across Physics, Chemistry, Mathematics, Biology, and Science).
- **Search Architecture** (`src/utils/rag/ragEngine.ts`):
  - Fast hybrid search: combines Titan v2 semantic vector similarity with sub-millisecond BM25/token-weighted catalog indexing.
  - Preloaded in background on application start.
  - Dynamically searches across all school subjects: questions on Semiconductors, Optics, Electrostatics, Chemical Kinetics, Coordination Compounds, Genetics, or Calculus immediately retrieve matching NCERT textbook sections and official sample paper marking schemes.
- **Content Breakdown for Grade 10 Electricity Pack**:
  1. `phys-elec-001`: **Ohm's Law & Electrical Resistance**
     - *Source*: NCERT Chapter 12: Electricity, Pages 81–83
     - *Type*: Official Textbook Reference
     - *Concepts*: Proportionality ($V = IR$), $1\,\Omega$ definition, mandatory "at constant temperature" exam requirement.
  2. `phys-elec-002`: **Factors Affecting Resistance & Resistivity**
     - *Source*: NCERT Chapter 12: Electricity, Pages 84–86
     - *Type*: Official Textbook Reference
     - *Concepts*: Length ($R \propto l$), cross-sectional area ($R \propto \frac{1}{A}$), resistivity ($\rho = \frac{RA}{l}$), units ($\Omega\cdot\text{m}$), conductors vs insulators.
  3. `phys-elec-003`: **Resistors in Series Combination**
     - *Source*: NCERT Chapter 12: Electricity, Pages 87–89
     - *Type*: Official Textbook Reference
     - *Concepts*: Invariant current ($I_{\text{total}} = I_1 = I_2 = I_3$), voltage distribution ($V = V_1 + V_2 + V_3$), equivalent resistance ($R_s = \sum R_i$), failure modes.
  4. `phys-elec-004`: **Resistors in Parallel Combination & Domestic Wiring**
     - *Source*: NCERT Chapter 12: Electricity, Pages 90–93
     - *Type*: Official Textbook Reference
     - *Concepts*: Invariant potential ($V_1 = V_2 = V_3 = V$), branch currents, reciprocal resistance ($\frac{1}{R_p} = \sum \frac{1}{R_i}$), domestic parallel benefits.
  5. `phys-elec-005`: **Heating Effect of Electric Current (Joule's Law)**
     - *Source*: NCERT Chapter 12: Electricity, Pages 94–96
     - *Type*: Official Textbook Reference
     - *Concepts*: Joule's heating laws ($H = I^2Rt = VIt = \frac{V^2}{R}t$), Nichrome alloy heating elements, Tungsten filament ($3380\,^\circ\text{C}$), lead-tin electric fuses.
  6. `phys-elec-006`: **Electric Power & Commercial Unit of Energy**
     - *Source*: NCERT Chapter 12: Electricity, Pages 97–99
     - *Type*: Official Textbook Reference
     - *Concepts*: Power formulas ($P = VI = I^2R = \frac{V^2}{R}$), Watt, kilowatt-hour conversion ($1\,\text{kWh} = 3.6 \times 10^6\,\text{J}$), Board of Trade units.
  7. `phys-elec-007`: **2023 CBSE Board Exam Question & Marking Scheme: V-I Graphs (3 Marks)**
     - *Source*: CBSE 2023 Class 10 Science Board Paper (Question & Official Evaluation Scheme)
     - *Type*: Past Board Exam Question & Marking Scheme
     - *Concepts*: V-I slope analysis ($\text{Slope} = \frac{\Delta V}{\Delta I} = R$), resistance comparison ($R_A > R_B$), series vs parallel comparison.
  8. `phys-elec-008`: **2022 CBSE Board Exam Question & Marking Scheme: Tungsten & Alloys (3 Marks)**
     - *Source*: CBSE 2022 Class 10 Science Board Paper (Question & Official Evaluation Scheme)
     - *Type*: Past Board Exam Question & Marking Scheme
     - *Concepts*: High melting point ($3380\,^\circ\text{C}$), non-oxidizing properties of heating alloys, step-by-step marking criteria.
  9. `phys-elec-009`: **2021 CBSE Sample Question Paper: Energy Cost Calculation (3 Marks)**
     - *Source*: CBSE Official 2021 Class 10 Science Sample Paper & Evaluation Scheme
     - *Type*: Official Sample Paper & Marking Scheme
     - *Concepts*: Multi-appliance daily kWh calculation ($E = P \times t$), 30-day tariff multiplication, penalty deductions for skipping unit conversions.

---

### Layer 2: Ingested & Scraped Curriculum Corpus (Offline Catalog)
- **Asset Count**: **384 Official Curriculum PDFs** | **810.95 MB Total Footprint**
- **Catalog Manifest**: `data/raw/manifest.json`
- **Extracted Knowledge Base**: **6,531 atomic knowledge chunks** in `data/processed/chunks/`:
  - `cbse_chunks.json` (Central Board of Secondary Education)
  - `icse_chunks.json` (Council for the Indian School Certificate Examinations - Class 10)
  - `isc_chunks.json` (Council for the Indian School Certificate Examinations - Classes 11–12)
  - `west_bengal_board_(wbchse)_chunks.json` (West Bengal Council of Higher Secondary Education)

#### Ingested Document Matrix:
| Education Board | Target Grades | Subjects Ingested | Document Types Harvested |
|---|---|---|---|
| **CBSE / NCERT** | Classes 9, 10, 11, 12 | Physics, Chemistry, Mathematics, Biology, English Core | Complete NCERT Textbooks, 2024–25 Curriculum Frameworks, 2021–2025 Sample Question Papers (SQPs) & Official Marking Schemes (MS) |
| **CISCE (ICSE / ISC)** | Class 10 (ICSE), Classes 11–12 (ISC) | Physics, Chemistry, Mathematics, Biology, English Language & Literature | 2024 & 2025 Official Syllabuses, Specimen Question Papers, and Official Answer Keys / Evaluation Guidelines |
| **West Bengal Board (WBCHSE / WBBSE)** | Classes 11, 12 | Physics, Chemistry, Mathematics, Biological Sciences, English A/B | Complete Semester-Wise Syllabuses, 2026 Model Question Papers, and Semester 3 Question Blueprint Patterns |

---

### Layer 3: Dynamic Runtime Context Fed to the Model per Turn

On every prompt submission, the model receives a carefully orchestrated compound payload:

1. **System Prompt & Pedagogical Persona** (`src/utils/llm.ts`):
   - **Identity**: Usher, an encouraging, razor-sharp AI tutor.
   - **Pedagogy**: Clear step-by-step explanations, emphasizing official exam scoring steps and marking criteria.
   - **Mathematical Standard**: Mandatory KaTeX notation ($...$ and $$...$$). Programming asterisks (`*`) and plain-text approximations are forbidden.
   - **Grounding Mandate**: When verified curriculum sources are provided, the model must insert bracketed citations (`[1]`, `[2]`, `[3]`) matching distinct topics. When no sources match (casual or non-academic questions), citation tags are suppressed.
   - **Strict Confidentiality**: Zero meta-talk; prompt instructions and formatting rules are never revealed to the user.
2. **Verified Educational Context Injection** (`formatKnowledgeContext`):
   - When RAG search matches the query ($\ge 0.30$ similarity), the verbatim text of the top 3–4 curriculum chunks—along with their chapter, page, and marking scheme notes—is injected directly into the prompt context.
3. **Multi-Turn Conversation Memory**:
   - The full chronological history of preceding user prompts and assistant responses for the active conversation is passed into the context, allowing pronoun resolution and continuous learning dialogues.
4. **Personalized Preference Directives**:
   - Injected user preferences from `src/context/PreferencesContext.tsx`: response length (`concise` / `balanced` / `long`), rich formatting depth, and emoji density.

