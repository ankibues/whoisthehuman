// Chrome AI API Integration Layer
import type {
  AILanguageModel,
  AIWriter,
  AIRewriter,
  AISummarizer,
  AIProofreader,
  AIWriterContext,
  AIRewriterContext,
  AISummarizerContext,
} from '../types/chrome-ai';

class ChromeAIService {
  private languageModel: AILanguageModel | null = null;
  private writer: AIWriter | null = null;
  private rewriter: AIRewriter | null = null;
  private summarizer: AISummarizer | null = null;
  private proofreader: AIProofreader | null = null;

  /**
   * Check if Chrome AI is available
   */
  async isAvailable(): Promise<boolean> {
    // Chrome 138+ uses new namespace: LanguageModel (global)
    if (typeof (window as any).LanguageModel === 'undefined') {
      return false;
    }
    try {
      // Chrome 138+ uses availability() instead of capabilities()
      const status = await (window as any).LanguageModel.availability();
      return status === 'available';
    } catch (error) {
      console.error('Error checking AI availability:', error);
      return false;
    }
  }

  /**
   * Initialize the Prompt API (Language Model)
   */
  async initLanguageModel(systemPrompt?: string): Promise<void> {
    // Chrome 138+ uses new global LanguageModel namespace
    if (typeof (window as any).LanguageModel === 'undefined') {
      throw new Error('Chrome AI Language Model API not available');
    }

    // Create session for text-only (no expectedInputs needed)
    this.languageModel = await (window as any).LanguageModel.create({
      systemPrompt,
      temperature: 0.8,
      topK: 3,
    });
  }

  /**
   * Initialize the Writer API
   */
  async initWriter(): Promise<void> {
    // Chrome 138+ uses global Writer namespace
    if (typeof (window as any).Writer === 'undefined') {
      throw new Error('Chrome AI Writer API not available');
    }

    // Create writer directly (no capabilities check)
    this.writer = await (window as any).Writer.create();
  }

  /**
   * Initialize the Rewriter API
   */
  async initRewriter(): Promise<void> {
    // Chrome 138+ uses global Rewriter namespace
    if (typeof (window as any).Rewriter === 'undefined') {
      throw new Error('Chrome AI Rewriter API not available');
    }

    // Create rewriter directly (no capabilities check)
    this.rewriter = await (window as any).Rewriter.create();
  }

  /**
   * Initialize the Summarizer API
   */
  async initSummarizer(): Promise<void> {
    // Chrome 138+ uses global Summarizer namespace
    if (typeof (window as any).Summarizer === 'undefined') {
      throw new Error('Chrome AI Summarizer API not available');
    }

    // Create summarizer directly (no capabilities check)
    this.summarizer = await (window as any).Summarizer.create();
  }

  /**
   * Initialize the Proofreader API
   */
  async initProofreader(): Promise<void> {
    // Chrome 138+ - Proofreader may not exist, make it optional
    if (typeof (window as any).Proofreader === 'undefined') {
      console.warn('Proofreader API not available, skipping');
      return;
    }

    // Create proofreader directly (no capabilities check)
    this.proofreader = await (window as any).Proofreader.create();
  }

  /**
   * Generate a prompt response
   */
  async prompt(text: string): Promise<string> {
    if (!this.languageModel) {
      await this.initLanguageModel();
    }
    return this.languageModel!.prompt(text);
  }

  /**
   * Generate text with the Writer API
   */
  async write(prompt: string, context?: AIWriterContext): Promise<string> {
    if (!this.writer) {
      await this.initWriter();
    }
    return this.writer!.write(prompt, context);
  }

  /**
   * Rewrite text with the Rewriter API
   */
  async rewrite(text: string, context?: AIRewriterContext): Promise<string> {
    if (!this.rewriter) {
      await this.initRewriter();
    }
    return this.rewriter!.rewrite(text, context);
  }

  /**
   * Summarize text with the Summarizer API
   */
  async summarize(text: string, context?: AISummarizerContext): Promise<string> {
    if (!this.summarizer) {
      await this.initSummarizer();
    }
    return this.summarizer!.summarize(text, context);
  }

  /**
   * Proofread text with the Proofreader API
   */
  async proofread(text: string): Promise<string> {
    if (!this.proofreader) {
      await this.initProofreader();
    }
    return this.proofreader!.proofread(text);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.languageModel) {
      this.languageModel.destroy();
      this.languageModel = null;
    }
  }
}

// Export singleton instance
export const chromeAI = new ChromeAIService();

