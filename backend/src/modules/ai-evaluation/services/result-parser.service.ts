import { Injectable, Logger } from '@nestjs/common';

export interface ParsedAiEvaluation {
  completionStatus: 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'NOT_COMPLETED';
  completionPercentage: number;
  recommendedMarks: number;
  confidenceScore: number;
  requirementsChecklist: Array<{ requirement: string; satisfied: boolean; explanation: string }>;
  missingRequirements: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  rawAiOutput: string;
}

@Injectable()
export class ResultParserService {
  private readonly logger = new Logger(ResultParserService.name);

  parseAndValidate(rawOutput: string, maxMarks: number): ParsedAiEvaluation {
    if (!rawOutput) {
      throw new Error('Raw AI response output is empty.');
    }

    let cleaned = rawOutput.trim();
    // Strip markdown code fences if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Fallback regex extract first JSON block
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          throw new Error('Failed to parse AI output into valid JSON format.');
        }
      } else {
        throw new Error('AI response did not contain a valid JSON object structure.');
      }
    }

    // Check topic relevance flag
    const isRelevantToTopic = parsed.isRelevantToTopic !== false;

    // Normalize completionStatus
    let completionStatus: 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'NOT_COMPLETED' = 'PARTIALLY_COMPLETED';
    if (!isRelevantToTopic || parsed.completionStatus === 'NOT_COMPLETED') {
      completionStatus = 'NOT_COMPLETED';
    } else if (parsed.completionStatus === 'COMPLETED') {
      completionStatus = 'COMPLETED';
    }

    // Normalize completionPercentage
    let completionPercentage = Number(parsed.completionPercentage);
    if (isNaN(completionPercentage) || completionStatus === 'NOT_COMPLETED' || !isRelevantToTopic) {
      completionPercentage = 0;
    }
    completionPercentage = Math.max(0, Math.min(100, Math.round(completionPercentage)));

    // Normalize recommendedMarks
    let recommendedMarks = Number(parsed.recommendedMarks);
    if (isNaN(recommendedMarks) || completionStatus === 'NOT_COMPLETED' || !isRelevantToTopic) {
      recommendedMarks = 0;
    } else {
      recommendedMarks = Math.max(0, Math.min(maxMarks, Math.round(recommendedMarks * 10) / 10));
    }

    // Normalize confidenceScore
    let confidenceScore = Number(parsed.confidenceScore);
    if (isNaN(confidenceScore)) confidenceScore = 0.95;
    if (confidenceScore > 1.0) confidenceScore = confidenceScore / 100;
    confidenceScore = Math.max(0, Math.min(1.0, Math.round(confidenceScore * 100) / 100));

    // Normalize checklist & lists
    const requirementsChecklist = Array.isArray(parsed.requirementsChecklist)
      ? parsed.requirementsChecklist.map((item: any) => ({
          requirement: String(item.requirement || 'Requirement check'),
          satisfied: Boolean(item.satisfied),
          explanation: String(item.explanation || ''),
        }))
      : [];

    const missingRequirements = Array.isArray(parsed.missingRequirements)
      ? parsed.missingRequirements.map(String)
      : [];

    const strengths = Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [];
    const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [];
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : [];

    return {
      completionStatus,
      completionPercentage,
      recommendedMarks,
      confidenceScore,
      requirementsChecklist,
      missingRequirements,
      strengths,
      weaknesses,
      suggestions,
      rawAiOutput: rawOutput,
    };
  }
}
