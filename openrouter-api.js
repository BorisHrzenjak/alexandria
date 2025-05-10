// OpenRouter API Integration for Alexandria
// Uses the deepseek/deepseek-chat-v3-0324:free model

// Store API key in local storage to avoid hardcoding
const getApiKey = () => {
    return new Promise((resolve) => {
        chrome.storage.local.get('openRouterApiKey', (result) => {
            resolve(result.openRouterApiKey || '');
        });
    });
};

// Save API key to local storage
const saveApiKey = (apiKey) => {
    return new Promise((resolve) => {
        chrome.storage.local.set({ openRouterApiKey: apiKey }, () => {
            resolve();
        });
    });
};

// Check if API key exists
const hasApiKey = async () => {
    const apiKey = await getApiKey();
    return !!apiKey;
};

// Enhance prompt using OpenRouter API
const enhancePrompt = async (promptText) => {
    try {
        console.log('Starting prompt enhancement...');
        const apiKey = await getApiKey();
        
        if (!apiKey) {
            console.error('API key not found');
            throw new Error('API key not found. Please add your OpenRouter API key in settings.');
        }
        
        console.log('Making API request to OpenRouter...');
        const requestBody = {
            model: 'deepseek/deepseek-chat-v3-0324:free',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert prompt engineer. Your task is to enhance and improve the user\'s prompt to make it more effective, clear, and likely to produce better results from AI models. Maintain the original intent but make it more specific, structured, and effective. IMPORTANT: Your response should ONLY contain the enhanced prompt text itself, with no explanations, introductions, or commentary. Do not include phrases like "Enhanced prompt:" or "Here\'s the improved version:" - just provide the enhanced prompt text directly.'
                },
                {
                    role: 'user',
                    content: `Enhance this prompt: ${promptText}`
                }
            ],
            temperature: 0.7,
            max_tokens: 2048
        };
        
        console.log('Request payload:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/BorisHrzenjak/alexandria',
                'X-Title': 'Alexandria Prompt Library'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        
        // Get the response text first for debugging
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            throw new Error(`Invalid response from API: ${responseText.substring(0, 100)}...`);
        }
        
        if (!response.ok) {
            console.error('API error:', data);
            throw new Error(`API error: ${data.error?.message || response.statusText || 'Unknown error'}`);
        }

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Unexpected API response format:', data);
            throw new Error('Unexpected API response format');
        }
        
        console.log('Enhancement successful!');
        // Clean up the response to remove any explanatory text
        let enhancedText = data.choices[0].message.content;
        
        // Remove common prefixes that LLMs might add despite instructions
        enhancedText = enhancedText.replace(/^(enhanced prompt:|here'?s the improved version:|improved prompt:|here'?s the enhanced prompt:|enhanced version:)/i, '').trim();
        
        // Remove quotes that might surround the prompt
        enhancedText = enhancedText.replace(/^"(.*)"$/s, '$1').trim();
        enhancedText = enhancedText.replace(/^'(.*)'$/s, '$1').trim();
        
        console.log('Cleaned response:', enhancedText);
        return enhancedText;
    } catch (error) {
        console.error('Prompt enhancement error:', error);
        throw error;
    }
};

// Export functions for use in popup.js
window.openRouterApi = {
    enhancePrompt,
    getApiKey,
    saveApiKey,
    hasApiKey
};
