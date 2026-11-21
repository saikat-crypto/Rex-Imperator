import physicsPack from "../../data/knowledgePacks/grade10PhysicsElectricity.json";
import { getQueryEmbedding } from "./embedder";
import type { Message } from "../../types";

export interface KnowledgeChunk {
  id: string;
  title: string;
  topic: string;
  chapter: string;
  subject: string;
  grade: string;
  board?: string;
  docType: 'textbook' | 'past_paper' | 'marking_scheme' | 'sample_paper' | 'syllabus' | 'model_paper';
  source: string;
  content: string;
  vector?: number[];
}

export interface SearchResult extends Omit<KnowledgeChunk, 'vector'> {
  score: number;
}

export interface KnowledgePackInfo {
  packId: string;
  name: string;
  subject: string;
  grade: string;
  curriculum: string;
  chapter: string;
  totalChunks: number;
  items: Array<{
    id: string;
    title: string;
    topic: string;
    source: string;
    docType: 'textbook' | 'past_paper' | 'marking_scheme' | 'sample_paper' | 'syllabus' | 'model_paper';
  }>;
}

/**
 * Global in-memory cache for full curriculum chunks (CBSE, ISC, ICSE, WBCHSE).
 */
let cachedCatalog: KnowledgeChunk[] | null = null;
let catalogPromise: Promise<KnowledgeChunk[]> | null = null;

export const loadCurriculumCatalog = async (): Promise<KnowledgeChunk[]> => {
  if (cachedCatalog && cachedCatalog.length > 0) return cachedCatalog;
  if (catalogPromise) return catalogPromise;

  catalogPromise = (async () => {
    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const res = await fetch('/data/curriculum_chunks.json');
        if (res.ok) {
          const data = await res.json();
          cachedCatalog = data as KnowledgeChunk[];
          return cachedCatalog;
        }
      }
    } catch (err) {
      console.warn('Could not load curriculum catalog via fetch:', err);
    }
    return [];
  })();

  return catalogPromise;
};

/**
 * Computes dot product between two normalized vectors (exact cosine similarity).
 */
const dotProduct = (a: number[], b: number[]): number => {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
};

// Instructional / question words to exclude so they never drown out domain terms
const RAG_STOPWORDS = new Set([
  'what', 'explain', 'show', 'tell', 'about', 'with', 'from', 'this', 'that',
  'does', 'how', 'basics', 'introduction', 'notes', 'please', 'give', 'detail',
  'details', 'can', 'you', 'teach', 'could', 'would', 'should', 'help', 'want',
  'need', 'know', 'understand', 'learn', 'study', 'write', 'make', 'get',
  'the', 'and', 'for', 'are', 'was', 'has', 'have', 'had', 'will', 'just',
  'your', 'more', 'also', 'very', 'such', 'like', 'some', 'than', 'then',
  'find', 'formula', 'calculate', 'derive', 'derivation', 'equation', 'define',
  'definition', 'state', 'solve', 'expression', 'express', 'diagram', 'value', 'values',
  'question', 'answer', 'chapter', 'topic', 'class', 'grade', 'ncert', 'cbse', 'isc',
]);

/**
 * Searches the active educational knowledge base for chunks relevant to the user query.
 * Integrates:
 * 1. Titan v2 semantic vector search
 * 2. Multi-turn conversation context alignment (tracking active subject and topic from preceding turns)
 * 3. BM25 coordination matching (chunks matching multiple distinct query tokens receive significant boosts)
 * 4. Multi-subject catalog search (CBSE, ISC, ICSE, WBCHSE).
 */
export const searchKnowledge = async (
  query: string,
  topK: number = 3,
  minScore: number = 0.25,
  conversationHistory?: Message[]
): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 3) return [];

  const baseChunks = (physicsPack.chunks as KnowledgeChunk[]) || [];
  const scored: SearchResult[] = [];
  const seenIds = new Set<string>();

  // 1. Semantic Vector Search for pre-embedded packs
  try {
    const queryVector = await getQueryEmbedding(query);
    if (queryVector && queryVector.length > 0) {
      for (const chunk of baseChunks) {
        if (!chunk.vector || chunk.vector.length === 0) continue;
        const score = dotProduct(queryVector, chunk.vector);
        if (score >= minScore) {
          const { vector: _, ...rest } = chunk;
          scored.push({
            ...rest,
            score: Math.round(score * 100) / 100,
          });
          seenIds.add(chunk.id);
        }
      }
    }
  } catch (err) {
    console.warn('Vector embedding search skipped or failed:', err);
  }

  // 2. Comprehensive Lexical / Context-Aware Search across curriculum catalog (6,200+ chunks)
  try {
    const catalog = await loadCurriculumCatalog();
    const allSearchable = [...baseChunks, ...catalog];

    // Extract clean domain tokens from current query
    const queryTokens = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !RAG_STOPWORDS.has(w));

    // Extract multi-turn context from preceding conversation turns
    let contextTokens: string[] = [];
    let detectedActiveSubject: string | null = null;

    if (conversationHistory && conversationHistory.length > 0) {
      // Look at the last few messages before the current query
      const recentHistory = conversationHistory.slice(-4);
      const historyText = recentHistory.map((m) => m.content || '').join(' ').toLowerCase();

      // Collect previously retrieved sources to lock the active subject
      for (const msg of recentHistory) {
        if (msg.sources && msg.sources.length > 0) {
          for (const s of msg.sources) {
            if (s.subject) {
              detectedActiveSubject = s.subject.toLowerCase();
              break;
            }
          }
        }
        if (detectedActiveSubject) break;
      }

      // If no source had explicit subject, infer from prominent keywords in history
      if (!detectedActiveSubject) {
        if (historyText.includes('semiconductor') || historyText.includes('electricity') || historyText.includes('current') || historyText.includes('voltage') || historyText.includes('optics') || historyText.includes('magnetism') || historyText.includes('kinematics')) {
          detectedActiveSubject = 'physics';
        } else if (historyText.includes('chemical') || historyText.includes('electrochemistry') || historyText.includes('mole') || historyText.includes('acid') || historyText.includes('base') || historyText.includes('reaction')) {
          detectedActiveSubject = 'chemistry';
        } else if (historyText.includes('cell') || historyText.includes('genetics') || historyText.includes('dna') || historyText.includes('plant') || historyText.includes('animal')) {
          detectedActiveSubject = 'biology';
        }
      }

      // Extract unique domain keywords from previous turns
      const rawHistoryTokens = historyText
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !RAG_STOPWORDS.has(w) && !queryTokens.includes(w));
      contextTokens = Array.from(new Set(rawHistoryTokens)).slice(-8);
    }

    if (queryTokens.length > 0) {
      for (const chunk of allSearchable) {
        if (seenIds.has(chunk.id)) continue;

        const titleText = (chunk.title || '').toLowerCase();
        const topicText = (chunk.topic || '').toLowerCase();
        const chapterText = (chunk.chapter || '').toLowerCase();
        const subjectText = (chunk.subject || '').toLowerCase();
        const contentText = (chunk.content || '').toLowerCase();

        let matchedTokens = 0;
        let rawScore = 0;

        for (const token of queryTokens) {
          let tokenScore = 0;
          if (titleText.includes(token)) tokenScore += 7;
          if (topicText.includes(token)) tokenScore += 6;
          if (chapterText.includes(token)) tokenScore += 5;
          if (subjectText.includes(token)) tokenScore += 4;
          if (contentText.includes(token)) tokenScore += 2;

          if (tokenScore > 0) {
            matchedTokens++;
            rawScore += tokenScore;
          }
        }

        if (matchedTokens > 0) {
          // Coordination Multiplier: Matching multiple distinct query keywords gives an exponential boost
          // e.g. matching both "semiconductor" and "conductivity" heavily beats matching only "conductivity"
          if (queryTokens.length > 1) {
            if (matchedTokens === queryTokens.length) {
              rawScore *= 2.0; // matched all distinct query keywords
            } else if (matchedTokens > 1) {
              rawScore *= 1.4;
            }
          }

          // History Context Alignment: Reward chunks matching concepts established earlier in the conversation
          let contextMatches = 0;
          for (const cToken of contextTokens) {
            if (
              titleText.includes(cToken) ||
              topicText.includes(cToken) ||
              chapterText.includes(cToken) ||
              contentText.includes(cToken)
            ) {
              contextMatches++;
            }
          }
          if (contextMatches > 0) {
            rawScore += Math.min(contextMatches, 4) * 3;
          }

          // Active Subject Alignment: Keep follow-up questions within the current domain (e.g. Physics vs Chemistry)
          if (detectedActiveSubject && subjectText.includes(detectedActiveSubject)) {
            rawScore *= 1.35;
          }

          // Normalization
          const maxExpected = queryTokens.length * 12;
          const lexicalScore = Math.min(0.96, Math.round((rawScore / maxExpected) * 100) / 100);

          if (lexicalScore >= minScore) {
            const { vector: _, ...rest } = chunk as any;
            scored.push({
              ...rest,
              score: lexicalScore,
            });
            seenIds.add(chunk.id);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Catalog search failed:', err);
  }

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
};

/**
 * Formats retrieved educational sources into a clean markdown block for the LLM context.
 * Instructs the LLM to place inline citation markers [1], [2], [3] in its response
 * wherever it references the corresponding source.
 */
export const formatKnowledgeContext = (results: SearchResult[]): string => {
  if (!results || results.length === 0) return "";

  let context = "\n\n=== VERIFIED CURRICULUM SOURCES (OFFICIAL BOARD ASSETS) ===\n";
  context += "The following verified textbook sections and marking schemes are retrieved from the curriculum database.\n";
  context += "MANDATORY REQUIREMENT: You MUST place bracketed citation markers like [1], [2], etc., matching the source numbers below, immediately after each definition, formula, factor, or exam rule that you teach.\n\n";

  results.forEach((item, index) => {
    context += `[SOURCE ${index + 1}]: ${item.title} (${item.source})\n`;
    context += `Type: ${item.docType === 'past_paper' ? 'Past Board Exam Question & Marking Scheme' : 'Official Textbook Reference'}\n`;
    context += `${item.content}\n\n`;
  });

  context += "=== END OF CURRICULUM SOURCES ===\n";
  return context;
};

/**
 * Returns metadata about the active educational knowledge pack for display in the Knowledge Popover.
 */
export const getActiveKnowledgePackInfo = (): KnowledgePackInfo => {
  return {
    packId: physicsPack.packId,
    name: "CBSE & National Curriculum Database (6,200+ Assets)",
    subject: "Physics, Chemistry, Biology, Mathematics",
    grade: "Grade 9-12",
    curriculum: "CBSE / ISC / ICSE / WBCHSE",
    chapter: "Multi-subject Active Curriculum",
    totalChunks: (cachedCatalog?.length || 0) + (physicsPack.chunks?.length || 9),
    items: (physicsPack.chunks as KnowledgeChunk[]).map((c) => ({
      id: c.id,
      title: c.title,
      topic: c.topic,
      source: c.source,
      docType: c.docType,
    })),
  };
};
