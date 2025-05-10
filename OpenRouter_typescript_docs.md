# OpenRouter TypeScript Documentation

This document contains code examples for interacting with the OpenRouter API using TypeScript.

## Using Vercel AI SDK with OpenRouter

**Description:** Integrate OpenRouter with the Vercel AI SDK using `@openrouter/ai-sdk-provider`. Demonstrates basic text streaming and using tools with the `streamText` function.

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { z } from 'zod';

export const getLasagnaRecipe = async (modelName: string) => {
  const openrouter = createOpenRouter({
    apiKey: '${API_KEY_REF}',
  });

  const response = streamText({
    model: openrouter(modelName),
    prompt: 'Write a vegetarian lasagna recipe for 4 people.',
  });

  await response.consumeStream();
  return response.text;
};

export const getWeather = async (modelName: string) => {
  const openrouter = createOpenRouter({
    apiKey: '${API_KEY_REF}',
  });

  const response = streamText({
    model: openrouter(modelName),
    prompt: 'What is the weather in San Francisco, CA in Fahrenheit?',
    tools: {
      getCurrentWeather: {
        description: 'Get the current weather in a given location',
        parameters: z.object({
          location: z
            .string()
            .describe('The city and state, e.g. San Francisco, CA'),
          unit: z.enum(['celsius', 'fahrenheit']).optional(),
        }),
        execute: async ({ location, unit = 'celsius' }) => {
          // Mock response for the weather
          const weatherData = {
            'Boston, MA': {
              celsius: '15°C',
              fahrenheit: '59°F',
            },
            'San Francisco, CA': {
              celsius: '18°C',
              fahrenheit: '64°F',
            },
          };

          const weather = weatherData[location];
          if (!weather) {
            return `Weather data for ${location} is not available.`;
          }

          return `The current weather in ${location} is ${unit === 'celsius' ? weather.celsius : weather.fahrenheit}.`;
        },
      },
    },
  });

  await response.consumeStream();
  return response.text;
};
```

## Implement Simple Agentic Loop - TypeScript

**Description:** Asynchronous agentic loop implementing LLM tool calls. Calls OpenRouter chat completions API, processes tool calls locally, and repeats until no more tool calls.

```typescript
async function callLLM(messages: Message[]): Promise<Message> {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY_REF}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        tools,
        messages
      })
    }
  );

  const data = await response.json();
  messages.push(data.choices[0].message);
  return data;
}

async function getToolResponse(response: Message): Promise<Message> {
  const toolCall = response.toolCalls[0];
  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments);

  // Execute tool locally
  const toolResult = await TOOL_MAPPING[toolName](toolArgs);

  return {
    role: 'tool',
    toolCallId: toolCall.id,
    name: toolName,
    content: toolResult
  };
}

while (true) {
  const response = await callLLM(messages);

  if (response.toolCalls) {
    messages.push(await getToolResponse(response));
  } else {
    break;
  }
}

console.log(messages[messages.length - 1].content);
```
