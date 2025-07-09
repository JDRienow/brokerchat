import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Simple streaming test without AI SDK
    const stream = new ReadableStream({
      start(controller) {
        const text = `Echo: ${message}. This is a test streaming response.`;
        const words = text.split(' ');

        let index = 0;
        const intervalId = setInterval(() => {
          if (index < words.length) {
            controller.enqueue(new TextEncoder().encode(`${words[index]} `));
            index++;
          } else {
            clearInterval(intervalId);
            controller.close();
          }
        }, 100);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Test chat error:', error);
    return new Response('Error', { status: 500 });
  }
}
