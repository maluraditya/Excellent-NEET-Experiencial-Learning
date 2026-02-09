// Frontend service - calls secure server-side API route
// API key is kept server-side only for security

export const getGeminiResponse = async (
  userMessage: string,
  context: string
): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        context: context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      return errorData.error || 'Sorry, I encountered an error connecting to the AI tutor.';
    }

    const data = await response.json();
    return data.response || "I couldn't generate a response.";

  } catch (error) {
    console.error('Network Error:', error);
    return 'Sorry, I encountered a network error. Please try again.';
  }
};