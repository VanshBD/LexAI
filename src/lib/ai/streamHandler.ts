/**
 * Utility to convert an asynchronous stream or generator of events into an SSE Response.
 * Formats data chunks as `data: ${jsonString}\n\n`.
 * Sets appropriate streaming headers.
 */
export function buildSSEResponse(
  streamGenerator: () => AsyncIterable<any>
): Response {
  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    async start(controller) {
      try {
        const stream = streamGenerator();
        for await (const chunk of stream) {
          const payload = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        }
        controller.close();
      } catch (err: any) {
        const errorPayload = JSON.stringify({
          type: 'error',
          message: err?.message || 'Streaming failure occurred',
        });
        controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
