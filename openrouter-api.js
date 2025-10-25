// OpenRouter API Integration for Alexandria
// Uses the google/gemini-2.5-flash model

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
            model: 'google/gemini-2.5-flash',
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

// Model-specific system prompts for different AI models and use cases
const getModelSpecificSystemPrompt = (modelType, purpose) => {
    const basePrompts = {
        'text-generation': {
            'chatgpt': 'You are an expert prompt engineer specializing in ChatGPT optimization. Enhance the user\'s prompt to be clear, specific, and well-structured for ChatGPT. Focus on clear instructions, proper context, and expected output format. Maintain the original intent while making it more effective.',
            'claude': 'You are an expert prompt engineer specializing in Claude optimization. Enhance the user\'s prompt to leverage Claude\'s analytical and reasoning capabilities. Structure the prompt with clear thinking steps, proper context, and specific instructions that work well with Claude\'s conversational style.',
            'gemini': 'You are an expert prompt engineer specializing in Gemini optimization. Enhance the user\'s prompt to work effectively with Gemini\'s multimodal and reasoning capabilities. Focus on clear structure, specific instructions, and leveraging Gemini\'s strengths in analysis and explanation.',
            'deepseek': 'You are an expert prompt engineer specializing in DeepSeek optimization. Enhance the user\'s prompt to leverage DeepSeek\'s reasoning and analytical capabilities. Focus on clear logic flow, specific instructions, and structured thinking patterns.'
        },
        'creative-writing': {
            'chatgpt': 'You are an expert prompt engineer for creative writing with ChatGPT. Enhance the user\'s prompt to inspire creative, engaging content. Include specific style guidelines, tone requirements, character details, setting descriptions, and narrative structure when applicable.',
            'claude': 'You are an expert prompt engineer for creative writing with Claude. Enhance the user\'s prompt to leverage Claude\'s sophisticated language and storytelling abilities. Focus on rich detail, character development, narrative structure, and creative constraints that inspire quality writing.',
            'gemini': 'You are an expert prompt engineer for creative writing with Gemini. Enhance the user\'s prompt to create vivid, imaginative content. Include sensory details, character motivations, plot elements, and creative constraints that guide the writing process.'
        },
        'code-generation': {
            'chatgpt': 'You are an expert prompt engineer for code generation with ChatGPT. Enhance the user\'s prompt to request clean, well-documented code. Include specific requirements for programming language, functionality, error handling, comments, and code structure.',
            'copilot': 'You are an expert prompt engineer for GitHub Copilot. Enhance the user\'s prompt to work effectively with Copilot\'s code completion. Focus on clear function names, detailed comments, specific requirements, and examples that guide accurate code generation.',
            'codeqwen': 'You are an expert prompt engineer for CodeQwen. Enhance the user\'s prompt to leverage CodeQwen\'s coding capabilities. Include specific programming language requirements, detailed functionality descriptions, and clear expected outputs.',
            'claude': 'You are an expert prompt engineer for code generation with Claude. Enhance the user\'s prompt to request well-structured, explained code. Focus on clear requirements, step-by-step implementation, error handling, and educational explanations.',
            'starcoder': 'You are an expert prompt engineer for StarCoder. Enhance the user\'s prompt to work with StarCoder\'s code generation capabilities. Include specific language requirements, clear functionality descriptions, and example patterns.'
        },
        'image-generation': {
            'flux': 'You are an expert prompt engineer for Flux image generation. Enhance the user\'s prompt with specific visual details, art styles, lighting conditions, composition elements, and technical parameters that work well with Flux. Include descriptive adjectives, camera angles, and artistic techniques.',
            'sdxl': 'You are an expert prompt engineer for SDXL (Stable Diffusion XL). Enhance the user\'s prompt with detailed visual descriptions, art styles, quality modifiers, and technical parameters. Focus on composition, lighting, colors, textures, and artistic styles that SDXL handles well.',
            'sd15': 'You are an expert prompt engineer for Stable Diffusion 1.5. Enhance the user\'s prompt with specific visual elements, art styles, and quality tags that work well with SD 1.5. Include detailed descriptions, artistic styles, and composition elements.',
            'ideogram': 'You are an expert prompt engineer for Ideogram. Enhance the user\'s prompt to work effectively with Ideogram\'s strengths in text integration and design. Focus on clear visual descriptions, typography elements, design concepts, and aesthetic styles.',
            'dalle': 'You are an expert prompt engineer for DALL-E. Enhance the user\'s prompt with vivid visual descriptions, artistic styles, and creative elements that work well with DALL-E. Focus on detailed scenes, objects, styles, and compositional elements.'
        },
        'data-analysis': {
            'chatgpt': 'You are an expert prompt engineer for data analysis with ChatGPT. Enhance the user\'s prompt to request thorough, structured analysis. Include specific analytical methods, data interpretation requirements, visualization suggestions, and clear reporting format.',
            'claude': 'You are an expert prompt engineer for data analysis with Claude. Enhance the user\'s prompt to leverage Claude\'s analytical reasoning. Focus on systematic analysis approaches, statistical considerations, insight generation, and clear explanations.',
            'gemini': 'You are an expert prompt engineer for data analysis with Gemini. Enhance the user\'s prompt to request comprehensive analysis with clear methodology, statistical interpretation, and actionable insights.'
        },
        'problem-solving': {
            'chatgpt': 'You are an expert prompt engineer for problem-solving with ChatGPT. Enhance the user\'s prompt to encourage systematic problem-solving approaches. Include clear problem definition, step-by-step analysis, solution evaluation, and implementation considerations.',
            'claude': 'You are an expert prompt engineer for problem-solving with Claude. Enhance the user\'s prompt to leverage Claude\'s reasoning capabilities. Focus on structured thinking, alternative approaches, risk assessment, and logical problem decomposition.',
            'gemini': 'You are an expert prompt engineer for problem-solving with Gemini. Enhance the user\'s prompt to encourage thorough analysis, creative solutions, and systematic evaluation of options.'
        },
        'technical-writing': {
            'chatgpt': 'You are an expert prompt engineer for technical writing with ChatGPT. Enhance the user\'s prompt to request clear, well-structured technical documentation. Include audience considerations, formatting requirements, examples, and clarity guidelines.',
            'claude': 'You are an expert prompt engineer for technical writing with Claude. Enhance the user\'s prompt to create comprehensive, well-organized technical content. Focus on logical structure, clear explanations, appropriate detail level, and professional formatting.',
            'gemini': 'You are an expert prompt engineer for technical writing with Gemini. Enhance the user\'s prompt to produce clear, accurate technical documentation with proper structure and appropriate technical depth.'
        },
        'marketing-copy': {
            'chatgpt': 'You are an expert prompt engineer for marketing copy with ChatGPT. Enhance the user\'s prompt to create compelling, persuasive marketing content. Include target audience, tone requirements, key messages, call-to-action elements, and brand voice guidelines.',
            'claude': 'You are an expert prompt engineer for marketing copy with Claude. Enhance the user\'s prompt to create sophisticated, persuasive marketing content. Focus on audience psychology, compelling narratives, clear value propositions, and effective persuasion techniques.',
            'gemini': 'You are an expert prompt engineer for marketing copy with Gemini. Enhance the user\'s prompt to create engaging, effective marketing content with clear messaging and strong appeal to the target audience.'
        },
        'educational': {
            'chatgpt': 'You are an expert prompt engineer for educational content with ChatGPT. Enhance the user\'s prompt to create clear, engaging educational material. Include learning objectives, appropriate difficulty level, examples, and interactive elements.',
            'claude': 'You are an expert prompt engineer for educational content with Claude. Enhance the user\'s prompt to create comprehensive, well-structured educational material. Focus on clear explanations, logical progression, practical examples, and effective learning strategies.',
            'gemini': 'You are an expert prompt engineer for educational content with Gemini. Enhance the user\'s prompt to create effective educational material with clear explanations, appropriate examples, and engaging presentation.'
        }
    };

    // Return the specific prompt or fall back to general optimization
    const purposePrompts = basePrompts[purpose];
    if (purposePrompts && purposePrompts[modelType]) {
        return purposePrompts[modelType];
    }
    
    // Fallback to general model optimization
    const generalPrompts = {
        'chatgpt': 'You are an expert prompt engineer specializing in ChatGPT optimization. Enhance the user\'s prompt to be clear, specific, and well-structured for ChatGPT.',
        'claude': 'You are an expert prompt engineer specializing in Claude optimization. Enhance the user\'s prompt to leverage Claude\'s analytical and reasoning capabilities.',
        'gemini': 'You are an expert prompt engineer specializing in Gemini optimization. Enhance the user\'s prompt to work effectively with Gemini\'s capabilities.',
        'flux': 'You are an expert prompt engineer for Flux image generation. Enhance the user\'s prompt with specific visual details and artistic elements.',
        'sdxl': 'You are an expert prompt engineer for SDXL. Enhance the user\'s prompt with detailed visual descriptions and quality modifiers.',
        'sd15': 'You are an expert prompt engineer for Stable Diffusion 1.5. Enhance the user\'s prompt with specific visual elements and art styles.',
        'ideogram': 'You are an expert prompt engineer for Ideogram. Enhance the user\'s prompt for effective text integration and design.',
        'dalle': 'You are an expert prompt engineer for DALL-E. Enhance the user\'s prompt with vivid visual descriptions and creative elements.',
        'copilot': 'You are an expert prompt engineer for GitHub Copilot. Enhance the user\'s prompt for effective code generation.',
        'codeqwen': 'You are an expert prompt engineer for CodeQwen. Enhance the user\'s prompt for coding tasks.',
        'starcoder': 'You are an expert prompt engineer for StarCoder. Enhance the user\'s prompt for code generation.',
        'deepseek': 'You are an expert prompt engineer specializing in DeepSeek optimization. Enhance the user\'s prompt to leverage DeepSeek\'s reasoning capabilities.'
    };
    
    return generalPrompts[modelType] || 'You are an expert prompt engineer. Enhance the user\'s prompt to make it more effective, clear, and likely to produce better results from AI models. Maintain the original intent but make it more specific, structured, and effective.';
};

// Optimize prompt for specific model and use case
const optimizePromptForModel = async (promptText, modelType, purpose) => {
    try {
        console.log(`Optimizing prompt for ${modelType} (${purpose})...`);
        const apiKey = await getApiKey();
        
        if (!apiKey) {
            console.error('API key not found');
            throw new Error('API key not found. Please add your OpenRouter API key in settings.');
        }
        
        const systemPrompt = getModelSpecificSystemPrompt(modelType, purpose);
        console.log('Using system prompt:', systemPrompt);
        
        const requestBody = {
            model: 'google/gemini-2.5-flash',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt + ' IMPORTANT: Your response should ONLY contain the enhanced prompt text itself, with no explanations, introductions, or commentary. Do not include phrases like "Enhanced prompt:" or "Here\'s the improved version:" - just provide the enhanced prompt text directly.'
                },
                {
                    role: 'user',
                    content: `Optimize this prompt for ${modelType} (use case: ${purpose}): ${promptText}`
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
        
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
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
        
        console.log('Optimization successful!');
        let optimizedText = data.choices[0].message.content;
        
        // Clean up the response
        optimizedText = optimizedText.replace(/^(optimized prompt:|enhanced prompt:|here'?s the improved version:|improved prompt:|here'?s the enhanced prompt:|enhanced version:)/i, '').trim();
        optimizedText = optimizedText.replace(/^"(.*)"$/s, '$1').trim();
        optimizedText = optimizedText.replace(/^'(.*)'$/s, '$1').trim();
        
        console.log('Cleaned response:', optimizedText);
        return optimizedText;
    } catch (error) {
        console.error('Prompt optimization error:', error);
        throw error;
    }
};

// Export functions for use in popup.js
window.openRouterApi = {
    enhancePrompt,
    optimizePromptForModel,
    getModelSpecificSystemPrompt,
    getApiKey,
    saveApiKey,
    hasApiKey
};
