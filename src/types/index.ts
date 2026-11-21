export type BackgroundType = 'sky' | 'porcelain' | 'mesh' | 'particles' | 'cyber' | 'custom';

export interface BackgroundConfig {
  type: BackgroundType;
  label: string;
  description: string;
  accentTint?: string;
  customUrl?: string;
}

export type BlockType =
  | 'text'
  | 'latex'
  | 'graph'
  | 'openui'
  | 'image'
  | 'carousel'
  | 'comparison-slider'
  | 'metric-grid'
  | 'tabbed-deck'
  | 'comparison-matrix'
  | 'calculator'
  | 'roadmap-checklist'
  | 'flowchart'
  | 'accordion'
  | 'quiz';

export interface TextBlockPayload {
  markdown: string;
}

export interface LatexBlockPayload {
  formula: string;
  displayMode?: boolean;
  caption?: string;
}

export interface GraphBlockPayload {
  title: string;
  type: 'line' | 'bar' | 'area';
  data: { label: string; value: number; secondary?: number }[];
  accentColor?: string;
}

export interface OpenUIWidgetPayload {
  componentType: 'card' | 'slider-metric' | 'toggle-switch' | 'action-panel';
  title: string;
  description?: string;
  props: Record<string, unknown>;
}

export interface ImageBlockPayload {
  url: string;
  alt: string;
  caption?: string;
}

// 1A. Editorial Carousel
export interface CarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  tag?: string;
}
export interface CarouselBlockPayload {
  title?: string;
  items: CarouselItem[];
}

// 1B. Interactive Comparison Slider
export interface ComparisonSliderBlockPayload {
  title?: string;
  beforeLabel: string;
  afterLabel: string;
  beforeText: string;
  afterText: string;
}

// 2A. Metric & Stat Grid
export interface MetricItem {
  label: string;
  value: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    text: string;
  };
  description?: string;
}
export interface MetricGridBlockPayload {
  title?: string;
  metrics: MetricItem[];
}

// 2B. Tabbed View Deck
export interface TabItem {
  id: string;
  label: string;
  content: string;
}
export interface TabbedDeckBlockPayload {
  tabs: TabItem[];
}

// 2C. Comparative Matrix
export interface MatrixColumn {
  id: string;
  title: string;
  isHighlighted?: boolean;
}
export interface MatrixFeature {
  name: string;
  values: Record<string, string | boolean>;
}
export interface ComparisonMatrixBlockPayload {
  title?: string;
  columns: MatrixColumn[];
  features: MatrixFeature[];
}

// 3A. Dynamic Parameter Calculator
export interface CalculatorInput {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
}
export interface CalculatorBlockPayload {
  title: string;
  formulaLabel: string;
  inputs: CalculatorInput[];
  calculationType:
    | 'sampling-temperature'
    | 'linear-scale'
    | 'compound-growth'
    | 'ohms-law'
    | 'power-formula'
    | 'joules-law'
    | 'resistivity'
    | 'kinetic-energy'
    | 'wavelength'
    | 'newtons-second'
    | 'gravitational-pe'
    | 'ideal-gas';
}

// 3B. Roadmap / Action Checklist
export interface ChecklistItem {
  id: string;
  text: string;
  detail?: string;
  completed?: boolean;
}
export interface RoadmapChecklistBlockPayload {
  title: string;
  items: ChecklistItem[];
}

// 4A. Architectural Flowchart (SVG)
export interface FlowchartNode {
  id: string;
  label: string;
  subtext?: string;
}
export interface FlowchartConnection {
  from: string;
  to: string;
  label?: string;
}
export interface FlowchartBlockPayload {
  title?: string;
  nodes: FlowchartNode[];
  connections: FlowchartConnection[];
}

// 4B. Minimalist Accordion
export interface AccordionItem {
  id: string;
  title: string;
  content: string;
}
export interface AccordionBlockPayload {
  items: AccordionItem[];
}

// 4C. Quiz Card (MCQ)
export interface QuizOption {
  id: string;
  text: string;
}
export interface QuizBlockPayload {
  question: string;
  options: QuizOption[];
  correctId: string;
  explanation: string;
  hint?: string;
}

export type AnyBlockPayload =
  | TextBlockPayload
  | LatexBlockPayload
  | GraphBlockPayload
  | OpenUIWidgetPayload
  | ImageBlockPayload
  | CarouselBlockPayload
  | ComparisonSliderBlockPayload
  | MetricGridBlockPayload
  | TabbedDeckBlockPayload
  | ComparisonMatrixBlockPayload
  | CalculatorBlockPayload
  | RoadmapChecklistBlockPayload
  | FlowchartBlockPayload
  | AccordionBlockPayload
  | QuizBlockPayload;

export interface MessageBlock {
  id: string;
  type: BlockType;
  payload: AnyBlockPayload;
}

export interface SearchResult {
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
  score: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  content: string;
  blocks?: MessageBlock[];
  isStreaming?: boolean;
  sources?: SearchResult[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  background?: BackgroundConfig;
}
