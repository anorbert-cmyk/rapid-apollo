/**
 * Analysis Processor
 * 
 * Handles the actual analysis generation for retry queue items.
 * Uses the full multi-part generation logic from perplexityService.
 */

import { getDb } from "../db";
import { analysisSessions, analysisResults } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { Tier } from "../../shared/pricing";
import { recordSuccessToDB, recordFailureToDB } from "./metricsPersistence";
import { 
  generateSingleAnalysis, 
  generateInsiderAnalysis, 
  generateMultiPartAnalysis 
} from "./perplexityService";

/**
 * Generate analysis for a session using the appropriate tier-specific generation
 * - Observer (standard): Single-part analysis
 * - Insider (medium): 2-part sequential analysis
 * - Syndicate (full): 6-part sequential analysis
 * 
 * This is called by the retry queue processor
 */
export async function generateAnalysisForSession(
  sessionId: string,
  tier: Tier,
  problemStatement: string
): Promise<boolean> {
  const startTime = Date.now();
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("[AnalysisProcessor] Database not available");
      return false;
    }

    // Update session status to processing
    await db
      .update(analysisSessions)
      .set({ status: "processing" })
      .where(eq(analysisSessions.sessionId, sessionId));

    console.log(`[AnalysisProcessor] Starting ${tier} tier analysis for session ${sessionId}`);

    let fullMarkdown: string;
    let part1: string | null = null;
    let part2: string | null = null;
    let part3: string | null = null;
    let part4: string | null = null;
    let part5: string | null = null;
    let part6: string | null = null;

    // Generate analysis based on tier
    if (tier === 'standard') {
      // Observer tier: Single-part analysis
      console.log(`[AnalysisProcessor] Generating Observer (single-part) analysis`);
      const result = await generateSingleAnalysis(problemStatement, 'standard');
      fullMarkdown = result.content; // SingleAnalysisResult has 'content', not 'fullMarkdown'
      part1 = result.content;
      
    } else if (tier === 'medium') {
      // Insider tier: 2-part sequential analysis
      console.log(`[AnalysisProcessor] Generating Insider (2-part) analysis`);
      const result = await generateInsiderAnalysis(problemStatement, {
        onPartComplete: (partNum, content) => {
          console.log(`[AnalysisProcessor] Insider Part ${partNum}/2 complete, length: ${content.length}`);
        },
        onError: (error) => {
          console.error(`[AnalysisProcessor] Insider analysis error:`, error.message);
        }
      });
      fullMarkdown = result.fullMarkdown;
      part1 = result.part1;
      part2 = result.part2;
      
    } else {
      // Syndicate tier: 6-part sequential analysis
      console.log(`[AnalysisProcessor] Generating Syndicate (6-part) analysis`);
      const result = await generateMultiPartAnalysis(problemStatement, {
        onPartComplete: (partNum, content) => {
          console.log(`[AnalysisProcessor] Syndicate Part ${partNum}/6 complete, length: ${content.length}`);
        },
        onError: (error) => {
          console.error(`[AnalysisProcessor] Syndicate analysis error:`, error.message);
        }
      });
      fullMarkdown = result.fullMarkdown;
      part1 = result.part1;
      part2 = result.part2;
      part3 = result.part3;
      part4 = result.part4;
      part5 = result.part5;
      part6 = result.part6;
    }

    // Check if we got valid content
    if (!fullMarkdown || fullMarkdown.length < 100) {
      throw new Error("Generated content is too short or empty");
    }

    // Save the result
    const existingResult = await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.sessionId, sessionId))
      .limit(1);

    if (existingResult.length > 0) {
      // Update existing result
      await db
        .update(analysisResults)
        .set({
          singleResult: fullMarkdown,
          part1,
          part2,
          part3,
          part4,
          part5,
          part6,
          generatedAt: new Date(),
        })
        .where(eq(analysisResults.sessionId, sessionId));
    } else {
      // Create new result
      await db.insert(analysisResults).values([{
        sessionId,
        tier,
        problemStatement,
        singleResult: fullMarkdown,
        part1,
        part2,
        part3,
        part4,
        part5,
        part6,
        generatedAt: new Date(),
      }]);
    }

    // Update session status to completed
    await db
      .update(analysisSessions)
      .set({ status: "completed" })
      .where(eq(analysisSessions.sessionId, sessionId));

    const duration = Date.now() - startTime;
    await recordSuccessToDB(sessionId, tier, duration);

    console.log(`[AnalysisProcessor] Successfully generated ${tier} analysis for session ${sessionId} in ${duration}ms`);
    return true;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Update session status to failed
    try {
      const db = await getDb();
      if (db) {
        await db
          .update(analysisSessions)
          .set({ status: "failed" })
          .where(eq(analysisSessions.sessionId, sessionId));
      }
    } catch (dbError) {
      console.error("[AnalysisProcessor] Failed to update session status:", dbError);
    }
    
    await recordFailureToDB(sessionId, tier, duration, "GENERATION_ERROR", errorMessage);
    
    console.error(`[AnalysisProcessor] Failed to generate ${tier} analysis for session ${sessionId}:`, errorMessage);
    return false;
  }
}

/**
 * Resume a partially completed analysis
 * This is useful when an analysis was interrupted mid-way
 */
export async function resumePartialAnalysis(
  sessionId: string,
  tier: Tier,
  problemStatement: string,
  completedParts: number
): Promise<boolean> {
  // For now, we restart from scratch
  // In the future, we could implement true resume functionality
  // by storing conversation history and continuing from where we left off
  console.log(`[AnalysisProcessor] Resuming analysis from part ${completedParts + 1} for session ${sessionId}`);
  return generateAnalysisForSession(sessionId, tier, problemStatement);
}
