// Type definitions for Chrome Built-in AI APIs (Experimental)
// Based on Chrome's Gemini Nano implementation

export interface AILanguageModel {
  prompt(text: string): Promise<string>;
  promptStreaming(text: string): ReadableStream;
  countPromptTokens(text: string): Promise<number>;
  destroy(): void;
}

export interface AILanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

export interface AILanguageModelCreateOptions {
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
  systemPrompt?: string;
}

export interface AIWriter {
  write(text: string, context?: AIWriterContext): Promise<string>;
  writeStreaming(text: string, context?: AIWriterContext): ReadableStream;
}

export interface AIWriterContext {
  type?: 'article' | 'email' | 'blog-post' | 'social-media' | 'review';
  tone?: 'formal' | 'neutral' | 'casual';
  length?: 'short' | 'medium' | 'long';
}

export interface AIRewriter {
  rewrite(text: string, context?: AIRewriterContext): Promise<string>;
  rewriteStreaming(text: string, context?: AIRewriterContext): ReadableStream;
}

export interface AIRewriterContext {
  tone?: 'as-is' | 'more-formal' | 'more-casual';
  length?: 'as-is' | 'shorter' | 'longer';
}

export interface AISummarizer {
  summarize(text: string, context?: AISummarizerContext): Promise<string>;
  summarizeStreaming(text: string, context?: AISummarizerContext): ReadableStream;
}

export interface AISummarizerContext {
  type?: 'tl;dr' | 'key-points' | 'teaser' | 'headline';
  length?: 'short' | 'medium' | 'long';
}

export interface AIProofreader {
  proofread(text: string): Promise<string>;
}

export interface AITranslator {
  translate(text: string, options: AITranslatorOptions): Promise<string>;
}

export interface AITranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

declare global {
  interface Window {
    ai?: {
      languageModel: {
        capabilities(): Promise<AILanguageModelCapabilities>;
        create(options?: AILanguageModelCreateOptions): Promise<AILanguageModel>;
      };
      writer?: {
        capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create(): Promise<AIWriter>;
      };
      rewriter?: {
        capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create(): Promise<AIRewriter>;
      };
      summarizer?: {
        capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create(): Promise<AISummarizer>;
      };
      proofreader?: {
        capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create(): Promise<AIProofreader>;
      };
      translator?: {
        capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create(options: AITranslatorOptions): Promise<AITranslator>;
      };
    };
  }
}

export {};

