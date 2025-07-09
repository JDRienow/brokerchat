export async function GET() {
  try {
    console.log('Testing OpenAI API connection...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Say hello in one word.' }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      return Response.json({
        success: false,
        error: errorText,
        status: response.status,
      });
    }

    const data = await response.json();
    console.log('OpenAI API Success:', data);

    return Response.json({
      success: true,
      message: data.choices[0].message.content,
      model: data.model,
    });
  } catch (error) {
    console.error('Test error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
