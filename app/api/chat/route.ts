import { NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_MODEL, getAnthropic } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(20_000),
      }),
    )
    .min(1)
    .max(40),
  system: z.string().max(4000).optional(),
});

/**
 * POST /api/chat — server-sent events streaming from Claude.
 *
 * Response format (per line):
 *   data: {"type":"text","text":"..."}
 *   data: {"type":"end"}
 *   data: [DONE]
 *
 * Client-side handling: read the ReadableStream, split by newlines, parse each
 * data: line as JSON, accumulate text chunks. See app/demo/page.tsx.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`chat:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "rate_limited", retryInMs: rl.resetInMs }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "invalid_input");

  const anthropic = getAnthropic();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      const done = () => controller.enqueue(encoder.encode("data: [DONE]\n\n"));

      try {
        const upstream = await anthropic.messages.stream({
          model: DEFAULT_MODEL,
          max_tokens: 1024,
          system: parsed.data.system,
          messages: parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
        });

        for await (const event of upstream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send({ type: "text", text: event.delta.text });
          } else if (event.type === "message_stop") {
            send({ type: "end" });
          }
        }
        done();
        controller.close();
      } catch (e) {
        const message = e instanceof Error ? e.message : "upstream_error";
        try { send({ type: "error", message }); done(); controller.close(); } catch { /* already closed */ }
      }
    },
    cancel() {
      // Client hung up — upstream stream is garbage-collected. Cost stops.
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}

function badRequest(reason: string) {
  return new Response(JSON.stringify({ error: reason }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}
