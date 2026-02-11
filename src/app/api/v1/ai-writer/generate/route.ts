import { NextRequest } from "next/server";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import { callLLM } from "@/lib/llm";
import {
  getCoreBasePrompt,
  buildAWriterPrompt,
  cleanMarkdown,
} from "@/lib/ai-writer/build-prompt";
import { logUsage } from "@/lib/admin/usageLog";

interface User {
  id: string;
  email: string;
  name?: string;
}

export const dynamic = "force-dynamic";

export const POST = authMiddleware(
  async (request: NextRequest, _context: any, user: User) => {
    try {
      const body = await request.json();
      const {
        agentId,
        dnaData,
        generalInput,
        agentName,
        vslSection,
        funnelStage,
        tweetFormat,
        keywords,
        topic,
        language,
        targetSectionId,
      } = body;

      if (!agentName) {
        return createError({ message: "Agent name is required", status: 400 });
      }

      const fullPrompt = buildAWriterPrompt(
        agentName,
        dnaData || null,
        generalInput || "",
        vslSection,
        funnelStage,
        tweetFormat,
        keywords,
        topic,
        targetSectionId
      );

      const systemPrompt = getCoreBasePrompt();

      const content = await callLLM(
        user.id,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: fullPrompt },
        ],
        { max_tokens: 4000, temperature: 0.7, requireUserKey: true }
      );

      const cleanedContent = cleanMarkdown(content);
      if (!cleanedContent) {
        return createError({ message: "No content generated. Please try again.", status: 500 });
      }

      logUsage({
        userId: user.id,
        feature: "ai-writer.generate",
        endpoint: "/api/v1/ai-writer/generate",
        metadata: { agentId, agentName },
      }).catch(() => {});

      return createResponse({
        payload: {
          content: cleanedContent,
          agentId,
          agentName,
          metadata: {
            rawInput: {
              generalInput: generalInput || "",
              dnaData: dnaData || null,
              vslSection: vslSection || null,
              funnelStage: funnelStage || null,
              tweetFormat: tweetFormat || null,
              keywords: keywords || null,
              topic: topic || null,
              language: language || "en",
              targetSectionId: targetSectionId || null,
            },
          },
        },
        message: "OK",
      });
    } catch (e: any) {
      console.error("AI Writer generate error:", e);
      return createError({
        message: e.message || "Failed to generate content. Please try again.",
        status: 500,
      });
    }
  }
);
