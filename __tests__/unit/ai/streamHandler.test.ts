import { describe, it, expect } from 'vitest';
import { buildSSEResponse } from '@/lib/ai/streamHandler';

describe('streamHandler', () => {
  it('creates an SSE Response with correct headers and streamed data chunks', async () => {
    async function* testGenerator() {
      yield { type: 'token', content: 'Hello' };
      yield { type: 'done' };
    }

    const response = buildSSEResponse(testGenerator);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toContain('no-cache');

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    const decoder = new TextDecoder();
    let text = '';
    while (true) {
      const { done, value } = (await reader?.read()) || { done: true, value: undefined };
      if (done) break;
      text += decoder.decode(value);
    }

    expect(text).toContain('data: {"type":"token","content":"Hello"}');
    expect(text).toContain('data: {"type":"done"}');
  });

  it('handles generator exceptions gracefully with error event', async () => {
    async function* errorGenerator() {
      yield { type: 'start' };
      throw new Error('Stream failure simulation');
    }

    const response = buildSSEResponse(errorGenerator);
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let text = '';
    while (true) {
      const { done, value } = (await reader?.read()) || { done: true, value: undefined };
      if (done) break;
      text += decoder.decode(value);
    }

    expect(text).toContain('"type":"error"');
    expect(text).toContain('Stream failure simulation');
  });
});
