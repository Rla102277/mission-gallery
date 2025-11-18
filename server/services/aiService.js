import OpenAI from 'openai';

// Lazy initialization to ensure env vars are loaded
let openai = null;
let groq = null;
let together = null;
let anthropic = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('🔑 OpenAI API Key present:', apiKey ? `Yes (${apiKey.substring(0, 20)}...)` : 'No');
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openai;
}

function getGroq() {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    console.log('🔑 Groq API Key present:', apiKey ? 'Yes' : 'No');
    
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    
    groq = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return groq;
}

function getTogether() {
  if (!together) {
    const apiKey = process.env.TOGETHER_API_KEY;
    console.log('🔑 Together AI API Key present:', apiKey ? 'Yes' : 'No');
    
    if (!apiKey) {
      throw new Error('TOGETHER_API_KEY is not set in environment variables');
    }
    
    together = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.together.xyz/v1',
    });
  }
  return together;
}

async function getAnthropic() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('🔑 Anthropic API Key present:', apiKey ? 'Yes' : 'No');
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }
    
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }
  return anthropic;
}

async function callHuggingFace(model, prompt) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  console.log('🔑 HuggingFace API Key present:', apiKey ? 'Yes' : 'No');
  
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY is not set in environment variables');
  }
  
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 4096,
        temperature: 0.7,
        return_full_text: false,
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data[0]?.generated_text || '';
}

// Retry helper with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate limit error
      const isRateLimit = error.status === 429 || error.code === 'rate_limit_exceeded' || error.message?.includes('rate limit');
      const isRetryable = error.status === 503 || isRateLimit || error.message?.includes('overloaded');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        // Not retryable or last attempt - throw with detailed message
        const errorMsg = error.status === 503 
          ? 'API is currently overloaded. Please try again in a moment.'
          : isRateLimit
          ? '⚠️ Rate limit reached. Please wait 60 seconds or switch to a different model (try GPT-4o Mini or Gemini).'
          : error.status === 404
          ? 'Model not found. The requested model is not available.'
          : error.message || 'AI service error';
        
        console.error(`❌ AI Error (${error.status || error.code || 'Unknown'}):`, errorMsg);
        throw new Error(errorMsg);
      }
      
      // Wait before retrying with exponential backoff (longer for rate limits)
      const delay = isRateLimit ? 5000 * Math.pow(2, attempt) : initialDelay * Math.pow(2, attempt);
      console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export async function generateMissions(location, summary, preferences = {}) {
  const { includeDiptychs, includeTriptychs, gearRoles, duration, model = 'gemini-1.5-flash' } = preferences;
  
  // Try the requested model first, then fallback to Gemini if rate limited
  try {
    return await generateMissionsWithModel(location, summary, { includeDiptychs, includeTriptychs, gearRoles, duration, model });
  } catch (error) {
    const isRateLimit = error.status === 429 || error.code === 'rate_limit_exceeded' || error.message?.includes('rate limit');
    
    if (isRateLimit) {
      // Fallback to Gemini (best free tier: 15 req/min)
      if (!model.startsWith('gemini')) {
        try {
          console.log('⚠️ Rate limited, falling back to Gemini 1.5 Flash (free tier: 15 req/min)...');
          return await generateMissionsWithModel(location, summary, { includeDiptychs, includeTriptychs, gearRoles, duration, model: 'gemini-1.5-flash' });
        } catch (geminiError) {
          console.log('⚠️ Gemini also limited, please wait and try again...');
          throw geminiError;
        }
      }
    }
    
    throw error;
  }
}

async function generateMissionsWithModel(location, summary, preferences = {}) {
  const { includeDiptychs, includeTriptychs, gearRoles, duration, model = 'gpt-4o-mini' } = preferences;
  
  const prompt = `Generate a detailed photography mission plan for a ${duration || '7-day'} trip to ${location}.

Trip Summary: ${summary}

${gearRoles ? `Available Gear Roles:\n${gearRoles}\n` : ''}

Preferences:
- Include Diptychs: ${includeDiptychs ? 'Yes' : 'No'}
- Include Triptychs: ${includeTriptychs ? 'Yes' : 'No'}

Generate missions in this structure:

For EACH DAY, provide:
- Day title (e.g., "Day 1 - The Dragon's Coast")
- Locations to visit
- Core Missions (M1, M2, etc.) with:
  * Mission title and location
  * Specific gear to use (camera + lens)
  * Camera settings (mode, aperture, ISO, shutter speed)
  * Special notes (filters, techniques)
  * Creative idea/goal
- Series Missions (S1, S2, etc.) - Diptychs/Triptychs with:
  * Series title
  * Frame descriptions (Frame A, B, C)
  * Which core missions to combine

Format as JSON:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Day title",
      "locations": ["Location 1", "Location 2"],
      "coreMissions": [
        {
          "id": "M1",
          "title": "Mission title",
          "location": "Specific location",
          "gear": "Camera + Lens",
          "settings": {
            "mode": "A/M/S",
            "aperture": "f/8",
            "iso": "100-400",
            "shutterSpeed": "1/125"
          },
          "specialNotes": "Any filters or techniques",
          "idea": "Creative goal"
        }
      ],
      "seriesMissions": [
        {
          "id": "S1",
          "title": "Series title",
          "type": "triptych/diptych",
          "frames": [
            {"label": "Frame A", "description": "What to shoot", "missionRef": "M1"},
            {"label": "Frame B", "description": "What to shoot", "missionRef": "M2"}
          ]
        }
      ]
    }
  ]
}`;

  return await retryWithBackoff(async () => {
    console.log('🤖 Using model:', model);
    
    let text;
    
    // Route to appropriate provider based on model name
    if (model.startsWith('gemini')) {
      // Google Gemini
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const geminiModel = genAI.getGenerativeModel({ 
        model: model,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      });
      
      const result = await geminiModel.generateContent(prompt + '\n\nRespond with ONLY valid JSON in the exact format shown above, no markdown or extra text.');
      const response = await result.response;
      text = response.text();
      
    } else if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('qwen')) {
      // Groq (Llama, Mixtral, Qwen models)
      const completion = await getGroq().chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional travel and photography advisor. Create detailed, creative mission plans in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt + '\n\nRespond with ONLY valid JSON in the exact format shown above, no markdown or extra text.'
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });
      
      text = completion.choices[0].message.content;
      
    } else if (model.startsWith('claude')) {
      // Anthropic Claude
      const client = await getAnthropic();
      const message = await client.messages.create({
        model: model,
        max_tokens: 4096,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: `You are a professional travel and photography advisor. Create detailed, creative mission plans in valid JSON format.\n\n${prompt}\n\nRespond with ONLY valid JSON in the exact format shown above, no markdown or extra text.`
        }]
      });
      
      text = message.content[0].text;
      
    } else if (model.includes('/')) {
      // HuggingFace or Together AI (format: provider/model)
      if (model.startsWith('meta-llama') || model.startsWith('mistralai') || model.startsWith('together-')) {
        // Together AI
        const completion = await getTogether().chat.completions.create({
          model: model.replace('together-', ''),
          messages: [
            {
              role: 'system',
              content: 'You are a professional travel and photography advisor. Create detailed, creative mission plans in valid JSON format.'
            },
            {
              role: 'user',
              content: prompt + '\n\nRespond with ONLY valid JSON in the exact format shown above, no markdown or extra text.'
            }
          ],
          temperature: 0.7,
          max_tokens: 4096,
        });
        
        text = completion.choices[0].message.content;
      } else {
        // HuggingFace
        text = await callHuggingFace(model, prompt + '\n\nRespond with ONLY valid JSON in the exact format shown above, no markdown or extra text.');
      }
      
    } else {
      // OpenAI (default)
      const completion = await getOpenAI().chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional travel and photography advisor. Create detailed, creative mission plans in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt + '\n\nRespond with ONLY valid JSON in the exact format shown above, no markdown or extra text.'
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      });
      
      text = completion.choices[0].message.content;
    }
    
    console.log('📝 Raw response length:', text.length);
    
    // Clean the response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to parse, if it fails, try to fix common issues
    try {
      const parsed = JSON.parse(text);
      return parsed.days || parsed.missions || [];
    } catch (parseError) {
      console.log('⚠️ JSON parse failed, attempting to fix...');
      console.log('Error:', parseError.message);
      
      // More aggressive JSON fixing
      let fixedText = text;
      
      // 1. Find where the JSON likely ends (last complete closing bracket)
      const lastCloseBrace = fixedText.lastIndexOf('}');
      const lastCloseBracket = fixedText.lastIndexOf(']');
      const lastClose = Math.max(lastCloseBrace, lastCloseBracket);
      
      if (lastClose > 0 && lastClose < fixedText.length - 1) {
        // Truncate to last valid closing
        fixedText = fixedText.substring(0, lastClose + 1);
        console.log('🔧 Truncated to last valid closing bracket');
      }
      
      // 2. Fix unterminated strings
      fixedText = fixedText
        // Fix strings that end with newline instead of quote
        .replace(/: "([^"\n]*)\n/g, ': "$1",\n')
        // Fix strings that have unescaped quotes
        .replace(/([^\\])"([^,:}\]]*)"([^,:}\]]+)/g, '$1"$2\\"$3')
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix incomplete strings at the end
        .replace(/: "([^"]*)$/g, ': "$1"')
        // Ensure proper array/object closing
        .replace(/\n\s*$/g, '')
        // Add missing closing brackets if needed
        ;
      
      // Count opening and closing brackets
      const openBraces = (fixedText.match(/\{/g) || []).length;
      const closeBraces = (fixedText.match(/\}/g) || []).length;
      const openBrackets = (fixedText.match(/\[/g) || []).length;
      const closeBrackets = (fixedText.match(/\]/g) || []).length;
      
      // Add missing closing brackets
      if (closeBrackets < openBrackets) {
        fixedText += ']'.repeat(openBrackets - closeBrackets);
        console.log('🔧 Added missing ] brackets');
      }
      if (closeBraces < openBraces) {
        fixedText += '}'.repeat(openBraces - closeBraces);
        console.log('🔧 Added missing } braces');
      }
      
      try {
        const parsed = JSON.parse(fixedText);
        console.log('✅ JSON fixed successfully');
        return parsed.days || parsed.missions || [];
      } catch (secondError) {
        console.error('❌ Could not fix JSON:', secondError.message);
        console.log('📝 First 500 chars:', fixedText.substring(0, 500));
        console.log('📝 Last 500 chars:', fixedText.substring(fixedText.length - 500));
        throw new Error('AI generated invalid JSON. The response was too large or malformed. Try a shorter duration or simpler request.');
      }
    }
  });
}

export async function generateGearList(missionDetails, userInputs = {}) {
  const { userGearInventory, ...otherInputs } = userInputs;
  
  const prompt = `Generate a comprehensive photography gear list for the following mission:

Mission: ${missionDetails.title}
Location: ${missionDetails.location}
Description: ${missionDetails.description}
Duration: ${missionDetails.duration || 'Not specified'}

${userGearInventory ? `User's Available Gear Inventory:\n${userGearInventory}\n\n` : ''}

User Inputs:
${Object.entries(otherInputs).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

${userGearInventory ? 'Based on the user\'s gear inventory above, create a curated packing list selecting the most appropriate items for this specific mission.' : 'Provide a detailed gear list with categories (Camera Body, Lenses, Accessories, etc.).'}

For each recommended item, include:
1. Name (match exactly from inventory if provided)
2. Category
3. Brief description
4. Key specifications (as an object)
5. Why it's recommended for this mission
6. Usage scenarios during the trip

Format as JSON with a "gearList" array containing objects with fields: name, category, description, specifications (object), recommendation, usageScenarios (array).`;

  return await retryWithBackoff(async () => {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional photography equipment expert who provides detailed, practical gear recommendations. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt + '\n\nRespond with ONLY valid JSON, no other text.'
        }
      ],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: 'json_object' }
    });
    
    const text = completion.choices[0].message.content;
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return parsed.gearList || [];
  });
}

export async function getGearDetails(gearName) {
  const prompt = `Provide detailed specifications and information about the following photography gear: ${gearName}

Include:
1. Full product name and manufacturer
2. Technical specifications
3. Key features
4. Typical use cases
5. Price range (if known)
6. Pros and cons

Format as JSON with fields: fullName, manufacturer, specifications (object), features (array), useCases (array), priceRange, pros (array), cons (array).`;

  return await retryWithBackoff(async () => {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a photography equipment database with detailed knowledge of cameras, lenses, and accessories. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt + '\n\nRespond with ONLY valid JSON, no other text.'
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    });
    
    const text = completion.choices[0].message.content;
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  });
}

export async function refineAboutText(rawText, style = 'professional') {
  const prompt = `Refine the following "About Me" text for a photography portfolio website.

Original Text:
${rawText}

Style: ${style} (professional, casual, artistic, or adventurous)

Requirements:
1. Keep the core message and personality
2. Improve flow and readability
3. Make it engaging and authentic
4. Keep it concise (2-3 paragraphs max)
5. Maintain first-person perspective
6. Highlight photography passion and expertise

Format as JSON with fields: refinedText (string), suggestions (array of improvement notes).`;

  return await retryWithBackoff(async () => {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional copywriter specializing in photographer bios and portfolio content. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt + '\n\nRespond with ONLY valid JSON, no other text.'
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    });
    
    const text = completion.choices[0].message.content;
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  });
}
