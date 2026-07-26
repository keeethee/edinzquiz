import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly host: string;
  private readonly modelName: string;

  constructor(private configService: ConfigService) {
    this.host = (this.configService.get<string>('OLLAMA_HOST') || 'http://localhost:11434').replace(/\/$/, '');
    this.modelName = this.configService.get<string>('OLLAMA_MODEL') || 'qwen3-vl:latest';
  }

  get model(): string {
    return this.modelName;
  }

  /**
   * Generates AI response using Ollama generate/chat API with 3x retry policy on failure.
   */
  async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    imageBase64List?: string[],
    maxRetries = 3,
  ): Promise<string> {
    const url = `${this.host}/api/generate`;
    const payload: any = {
      model: this.modelName,
      system: systemPrompt,
      prompt: userPrompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.2, // Low temp for deterministic evaluations
      },
    };

    if (imageBase64List && imageBase64List.length > 0) {
      payload.images = imageBase64List;
    }

    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        this.logger.log(`Calling Ollama API [${this.modelName}] (Attempt ${attempt}/${maxRetries})...`);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        if (!data || (!data.response && !data.text)) {
          throw new Error('Ollama returned empty response string');
        }

        return data.response || data.text;
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Ollama call attempt ${attempt} failed: ${err.message}`);
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }

    throw new Error(`Ollama evaluation failed after ${maxRetries} retries: ${lastError?.message || 'Connection offline'}`);
  }
}
