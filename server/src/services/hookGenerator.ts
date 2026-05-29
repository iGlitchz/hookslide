import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import type { Hook } from "../types/index.js";
import { extractKeywords } from "./pixabayService.js";

let openai: OpenAI | null = null;
let hookLibrary: string = "";

// Load hook library from project root
try {
  const libPath = path.resolve(__dirname, "../../../Hook Library.md");
  hookLibrary = fs.readFileSync(libPath, "utf-8");
  console.log("[hookGenerator] Hook Library loaded (", hookLibrary.length, "chars)");
} catch {
  try {
    const libPath = path.resolve(__dirname, "../../../Hook Library");
    hookLibrary = fs.readFileSync(libPath, "utf-8");
    console.log("[hookGenerator] Hook Library loaded (", hookLibrary.length, "chars)");
  } catch {
    console.warn("[hookGenerator] Hook Library file not found — using built-in hooks only");
  }
}

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:5173",
        "X-OpenRouter-Title": "Slideshow Generator",
      },
    });
  }
  return openai;
}

interface HookLLMOutput {
  hooks: Array<{
    hookText: string;
    hookType: string;
    libraryTemplate: string;
    brief: string;
    slide1ImagePrompt: string;
    slide1PixabayQuery: string;
    slide2ImagePrompt: string;
    slide2NeedsText: boolean;
    slide2Text: string;
  }>;
}

export async function generateHooks(blurb: string): Promise<{
  hooks: Array<{
    hook: Hook;
    slide1Prompt: string;
    slide1PixabayQuery: string;
    slide2Prompt: string;
    slide2NeedsText: boolean;
    slide2Text: string;
  }>;
}> {
  const model = process.env.OPENROUTER_MODEL || "google/gemma-3-4b-it";

  const response = await getOpenAI().chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You write hooks for TikTok/Reels slideshows. Your hooks sound like a real person talking to their friend — never like an ad.

Given a product blurb, generate exactly 3 hooks for 2-slide social slideshows.

=== HOOK LIBRARY — YOU MUST USE THESE TEMPLATES ===
${hookLibrary || "No hook library loaded."}
=== END HOOK LIBRARY ===

RULES FOR THE 3 HOOKS:
1. Hook #1 MUST be a Curiosity / Intrigue hook from the library (e.g. "The BEST way to…", "Nobody is talking about THIS…", "Did you know…?"). Make the viewer NEED to swipe.
2. Hook #2 and #3: pick from ANY OTHER category in the library — Problem/Pain Point, Comparison, Social Proof, Hack/Tip, Lifestyle, Listicle, or Aspiration. Use two DIFFERENT categories.
3. For EVERY hook: pick a specific template from the library, fill in the blanks with details from the blurb. You can remix or combine templates but the structure must clearly come from the library.
4. Hooks must be 5-12 words, casual, conversational. NEVER sound salesy, corporate, or like a commercial. Think friend-to-friend recommendation, not brand copywriting.
5. Do NOT mention the brand name in the hook text.

SLIDE 1 IMAGE (the hook slide):
- Atmospheric, mood-setting, lifestyle vibe — draws the viewer in emotionally.
- NO products shown. Think aesthetic stock photo: a person in a relatable moment, a mood, a vibe.
- slide1PixabayQuery: 2-4 simple words for stock photo search. Use concrete nouns a person would type into a photo site (e.g. "woman morning routine", "messy desk coffee", "girl looking mirror"). Must directly relate to the hook's scenario.

SLIDE 2 IMAGE (the reveal):
- The product placed naturally in a real-world scene matching the hook's vibe.
- Product is the hero — lifestyle context, good lighting, realistic setting.

SLIDE 2 TEXT:
- Short casual follow-up: 2-6 words, Gen-Z energy. Think "say less", "you're welcome bestie", "trust me on this", a funny one-liner, etc.
- If the hook works better without text on slide 2, set slide2NeedsText to false.

Image prompt rules:
- NEVER include text/words/letters in image prompts.
- Write detailed prompts for high-quality 9:16 vertical photorealistic images.

Respond with ONLY this JSON, no other text:
{
  "hooks": [
    {
      "hookText": "the hook text",
      "hookType": "curiosity|problem|comparison|social_proof|hack|lifestyle|listicle|aspiration",
      "libraryTemplate": "the exact template line from the library you based this on",
      "brief": "one sentence explaining why this hook works",
      "slide1ImagePrompt": "detailed atmospheric image prompt",
      "slide1PixabayQuery": "2-4 word stock photo search",
      "slide2ImagePrompt": "detailed product-in-context image prompt",
      "slide2NeedsText": true,
      "slide2Text": "short casual follow-up"
    }
  ]
}`,
      },
      {
        role: "user",
        content: `Product blurb:\n\n"${blurb}"\n\nGenerate 3 hooks. Hook #1 MUST be curiosity/intrigue. Hooks #2 and #3 must be from two different other categories. All hooks must use templates from the Hook Library. Keep it casual and natural — zero salesy vibes. Respond with ONLY valid JSON.`,
      },
    ],
    temperature: 0.9,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from LLM");

  // Extract JSON from response — handle models that wrap JSON in markdown code blocks
  let jsonStr = content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  const parsed: HookLLMOutput = JSON.parse(jsonStr);

  return {
    hooks: parsed.hooks.map((h) => ({
      hook: {
        text: h.hookText,
        type: h.hookType,
        brief: h.brief,
      },
      slide1Prompt: h.slide1ImagePrompt,
      slide1PixabayQuery: h.slide1PixabayQuery || extractKeywords(h.slide1ImagePrompt),
      slide2Prompt: h.slide2ImagePrompt,
      slide2NeedsText: h.slide2NeedsText,
      slide2Text: h.slide2Text,
    })),
  };
}
