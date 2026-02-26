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

const missionSectionPrompts = {
  gearRolesText: {
    title: 'Gear Roles & Camera Personalities',
    instructions: `Craft a cinematic "gear roles" briefing that assigns personalities and primary use cases to each camera body, lens, or tool in the mission's saved gear list. Explain why each item earns its nickname, which scenarios it owns, and how it pairs with the rest of the kit. Keep it practical but inspiring so the photographer knows exactly why each piece is in the bag. Format as rich paragraphs or short bullet groupings—no JSON, no code fences.`,
  },
  baseRecipesText: {
    title: 'Base Recipes & Settings',
    instructions: `Produce a set of "base recipes"—repeatable camera setups tuned to this mission's locations (waterfalls, night sky, basalt cliffs, steam, etc.). For each recipe include the scenario, recommended body/lens, exact settings (mode, aperture, shutter, ISO), filters, and execution tips. Keep it punchy and field-ready.`,
  },
  seriesChecklistText: {
    title: 'Series Checklist',
    instructions: `Summarize all required diptychs/triptychs/series as a checklist. For each series, list the frame labels (A/B/C), what to capture, and which core mission they tie to. Emphasize storytelling continuity and variety (wide/medium/detail).`,
  },
  compositionNotesText: {
    title: 'Composition & Shot Guidance',
    instructions: `Write composition coaching tailored to this mission: foreground choices, leading lines, perspective swaps, negative space, weather adaptations, and pacing reminders. Reference specific locations or missions where possible.`,
  },
  fieldCardText: {
    title: 'Field Card / Quick Reference',
    instructions: `Create a one-page field card with three blocks: Gear (must-pack items), Base Recipes (top 3-5), and Aurora/Night/Weather emergency settings. Keep it extremely scannable with bullet lists and micro-headlines.`,
  },
};

function summarizeGearList(gearList = []) {
  if (!gearList.length) return 'No saved gear list yet.';
  return gearList
    .map((item) => `- ${item.name}${item.category ? ` (${item.category})` : ''}: ${item.description || ''}`)
    .join('\n');
}

function summarizeStructuredPlan(plan) {
  if (!plan) return 'No structured plan yet.';
  const days = plan?.days || plan;
  if (!Array.isArray(days)) return 'No structured plan yet.';
  return days
    .map((day) => {
      const title = day.title || day.dayTitle || `Day ${day.dayNumber || ''}`;
      const locations = (day.locations || [])
        .map((loc) => (typeof loc === 'string' ? loc : loc?.name))
        .filter(Boolean)
        .join(', ');
      return `- ${title}: ${locations}`;
    })
    .join('\n');
}

export async function enhanceMissionSection(fieldName, mission, style = 'default') {
  const config = missionSectionPrompts[fieldName];
  if (!config) {
    throw new Error('Unsupported mission section');
  }

  const missionContext = `Mission: ${mission.title || 'Untitled'}\nLocation: ${mission.location || 'Unknown'}\nDescription: ${mission.description || mission.summary || 'N/A'}\nDuration: ${mission.structuredPlan?.days?.length || 'Not specified'} days`;
  const gearSummary = summarizeGearList(mission.gearList);
  const planSummary = summarizeStructuredPlan(mission.structuredPlan);
  const existingContent = mission[fieldName] || 'None yet—please create from scratch.';

  const prompt = `${config.instructions}

Mission Context:
${missionContext}

Saved Gear List:
${gearSummary}

Structured Plan Highlights:
${planSummary}

Current Draft:
${existingContent}

Style preference: ${style} (default means cinematic field-notes voice).

Return ONLY the upgraded section text (markdown-friendly), no JSON, no intro or outro.`;

  return await retryWithBackoff(async () => {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a senior travel photographer and creative director crafting high-impact mission briefings. Be vivid, precise, and field-ready.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    return completion.choices[0].message.content.trim();
  });
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
  const { includeDiptychs, includeTriptychs, gearRoles, duration, model = 'llama-3.3-70b-versatile' } = preferences;
  
  // Try the requested model first, then fallback chain if rate limited
  try {
    return await generateMissionsWithModel(location, summary, { includeDiptychs, includeTriptychs, gearRoles, duration, model });
  } catch (error) {
    const isRateLimit = error.status === 429 || error.code === 'rate_limit_exceeded' || error.message?.includes('rate limit');
    
    if (isRateLimit) {
      // Fallback chain: Try Groq first (best free tier), then Gemini
      if (!model.startsWith('llama')) {
        try {
          console.log('⚠️ Rate limited, trying Groq Llama 3.3 70B (free tier: 30 req/min)...');
          return await generateMissionsWithModel(location, summary, { includeDiptychs, includeTriptychs, gearRoles, duration, model: 'llama-3.3-70b-versatile' });
        } catch (groqError) {
          console.log('⚠️ Groq also limited, falling back to Gemini...');
          return await generateMissionsWithModel(location, summary, { includeDiptychs, includeTriptychs, gearRoles, duration, model: 'gemini-1.5-flash' });
        }
      } else if (!model.startsWith('gemini')) {
        // If Groq is rate limited, try Gemini
        try {
          console.log('⚠️ Groq rate limited, falling back to Gemini 1.5 Flash...');
          return await generateMissionsWithModel(location, summary, { includeDiptychs, includeTriptychs, gearRoles, duration, model: 'gemini-1.5-flash' });
        } catch (geminiError) {
          console.log('⚠️ All free models rate limited, please wait and try again...');
          throw geminiError;
        }
      }
    }
    
    throw error;
  }
}

async function generateMissionsWithModel(location, summary, preferences = {}) {
  const { includeDiptychs, includeTriptychs, gearRoles, duration, model = 'gpt-4o-mini' } = preferences;
  
  const prompt = `You are an expert travel photographer and creative director. Generate an inspiring, detailed photography mission plan for a ${duration || '7-day'} trip to ${location}.

Trip Summary: ${summary}

${gearRoles ? `Available Gear Roles:\n${gearRoles}\n` : ''}

Preferences:
- Include Diptychs: ${includeDiptychs ? 'Yes' : 'No'}
- Include Triptychs: ${includeTriptychs ? 'Yes' : 'No'}

IMPORTANT: Be creative, specific, and inspiring! Think like a professional photographer planning a portfolio-worthy shoot.

For EACH DAY, provide:
1. **Day Title**: Evocative, poetic title (e.g., "Day 1 - Where Mountains Meet Sky")
2. **Theme**: Overall creative theme or mood for the day
3. **Locations**: 2-4 specific locations with brief descriptions
4. **Best Times**: Golden hour, blue hour, or specific timing recommendations
5. **Weather Considerations**: How to adapt to conditions

For EACH CORE MISSION (M1, M2, etc.):
- **Title**: Creative, descriptive mission name
- **Location**: Exact spot or landmark
- **Gear**: Specific camera + lens from available gear
- **Settings**: 
  * Mode (A/M/S/P)
  * Aperture (with reasoning)
  * ISO range
  * Shutter speed (with reasoning)
- **Composition Ideas**: 
  * Rule of thirds, leading lines, framing techniques
  * Foreground/background elements to include
  * Perspective (low angle, bird's eye, etc.)
- **Creative Vision**: 
  * Mood/emotion to capture
  * Story to tell
  * Unique angle or approach
- **Technical Notes**: 
  * Filters (ND, polarizer, etc.)
  * Focus techniques (hyperfocal, focus stacking)
  * Bracketing or special techniques
- **Pro Tips**: 
  * Timing considerations
  * Common mistakes to avoid
  * How to make this shot portfolio-worthy

For SERIES MISSIONS (S1, S2, etc.) - Diptychs/Triptychs:
- **Series Title**: Cohesive title for the series
- **Narrative**: Story or theme connecting the frames
- **Type**: diptych or triptych
- **Frames**: Each frame with:
  * Label (Frame A, B, C)
  * Detailed description of what to shoot
  * How it relates to other frames
  * Mission reference (M1, M2, etc.)
- **Cohesion Tips**: How to ensure visual consistency

Format as JSON:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Evocative day title",
      "theme": "Overall creative theme",
      "locations": [
        {"name": "Location name", "description": "Brief description"}
      ],
      "bestTimes": "Golden hour, blue hour, etc.",
      "weatherTips": "How to adapt to conditions",
      "coreMissions": [
        {
          "id": "M1",
          "title": "Creative mission title",
          "location": "Specific location",
          "gear": "Camera + Lens",
          "settings": {
            "mode": "A/M/S",
            "aperture": "f/8",
            "apertureReason": "Why this aperture",
            "iso": "100-400",
            "shutterSpeed": "1/125",
            "shutterReason": "Why this speed"
          },
          "composition": {
            "techniques": ["Rule of thirds", "Leading lines"],
            "foreground": "What to include in foreground",
            "background": "What to include in background",
            "perspective": "Shooting angle/perspective"
          },
          "creativeVision": {
            "mood": "Emotion to capture",
            "story": "Story to tell",
            "uniqueAngle": "What makes this special"
          },
          "technicalNotes": {
            "filters": "ND, polarizer, etc.",
            "focusTechnique": "Hyperfocal, focus stacking, etc.",
            "specialTechniques": "Bracketing, long exposure, etc."
          },
          "proTips": [
            "Timing tip",
            "Composition tip",
            "Technical tip"
          ]
        }
      ],
      "seriesMissions": [
        {
          "id": "S1",
          "title": "Series title",
          "narrative": "Story connecting the frames",
          "type": "triptych/diptych",
          "frames": [
            {
              "label": "Frame A",
              "description": "Detailed shot description",
              "relationship": "How it relates to other frames",
              "missionRef": "M1"
            }
          ],
          "cohesionTips": "How to ensure visual consistency"
        }
      ]
    }
  ]
}

Be specific, creative, and inspiring. Think portfolio-quality work!`;

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
        response_format: { type: 'json_object' },
      });
      
      const groqMessage = completion.choices[0].message.content;
      text = Array.isArray(groqMessage)
        ? groqMessage.map((msg) => (typeof msg === 'string' ? msg : msg.text || '')).join('')
        : groqMessage;
      
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
    
    if (typeof text !== 'string') {
      text = JSON.stringify(text);
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

export async function generateGearContent(gearList) {
  const prompt = `Create engaging, detailed content about the following photography gear for a portfolio website.

Gear List:
${gearList}

Write a comprehensive, well-structured article that:
1. Introduces the photographer's gear philosophy
2. Describes each piece of equipment and why it was chosen
3. Explains how the gear works together as a system
4. Shares real-world experiences and insights
5. Maintains an authentic, personal tone

Format the output as flowing prose with clear paragraphs. Make it informative yet approachable.`;

  return await retryWithBackoff(async () => {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a professional photographer writing about your gear with expertise and passion.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content.trim();
  });
}

export async function generateImageDescription(imagePath, prompt = '') {
  try {
    // Create a prompt based on the image path
    const enhancedPrompt = `Analyze this architectural photograph (${imagePath}): ${prompt}`;
    
    return await retryWithBackoff(async () => {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert architectural photography critic who provides insightful analysis and constructive feedback on architectural photographs.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0].message.content.trim();
    });
  } catch (error) {
    console.error('Error generating image description:', error);
    return 'Unable to generate image description at this time.';
  }
}

export async function generatePhotoDescription(exifData, caption = '') {
  const technicalDetails = [];
  
  if (exifData.camera) technicalDetails.push(`Camera: ${exifData.camera}`);
  if (exifData.lens) technicalDetails.push(`Lens: ${exifData.lens}`);
  if (exifData.focalLength) technicalDetails.push(`Focal Length: ${exifData.focalLength}`);
  if (exifData.aperture) technicalDetails.push(`Aperture: ${exifData.aperture}`);
  if (exifData.shutterSpeed) technicalDetails.push(`Shutter Speed: ${exifData.shutterSpeed}`);
  if (exifData.iso) technicalDetails.push(`ISO: ${exifData.iso}`);
  if (exifData.location) technicalDetails.push(`Location: ${exifData.location}`);
  
  const prompt = `Create a brief, engaging description for a photograph based on its technical details.

Technical Information:
${technicalDetails.join('\n')}

${caption ? `Photographer's Caption: ${caption}\n` : ''}

Write a 2-3 sentence description that:
1. Highlights interesting technical choices (like why this aperture/shutter speed combo works)
2. Mentions the location if provided
3. Keeps a professional but approachable tone
4. Focuses on the photography technique, not what's in the photo

Keep it concise and informative. Do not use phrases like "this image" or "this photo".`;

  return await retryWithBackoff(async () => {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a professional photography educator who explains technical camera settings in an engaging way.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return completion.choices[0].message.content.trim();
  });
}

export async function enhanceGalleryDescription(title, currentDescription = '', imageCount = 0, missionContext = '') {
  const prompt = `Create an engaging description for a photography gallery.

Gallery Title: ${title}
Current Description: ${currentDescription || 'None'}
Number of Images: ${imageCount}
${missionContext ? `Mission Context: ${missionContext}` : ''}

Write a compelling 2-3 sentence description that:
1. Captures the essence and theme of the gallery
2. Entices viewers to explore the images
3. Maintains a professional yet approachable tone
4. Highlights what makes this collection special

Keep it concise and engaging.`;

  return await retryWithBackoff(async () => {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a professional photography curator writing compelling gallery descriptions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return completion.choices[0].message.content.trim();
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
