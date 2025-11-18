# 🤖 AI Providers Setup Guide

Your mission gallery now supports **5 AI providers** with **20+ models**! Here's how to get API keys for each:

---

## 🏆 1. GROQ (BEST FREE OPTION - RECOMMENDED)

**Why Groq?**

- ✅ **30 requests/minute** (10x more than OpenAI free)
- ✅ **14,400 requests/day**
- ✅ **500+ tokens/sec** (100x faster!)
- ✅ **No credit card required**
- ✅ **No rate limit headaches**

**Setup:**

1. Go to: https://console.groq.com/
2. Sign up with Google/GitHub (30 seconds)
3. Click "API Keys" → "Create API Key"
4. Copy the key and add to `.env`:
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```

**Models Available:**

- `llama-3.1-70b-versatile` - Best quality (DEFAULT)
- `llama-3.1-8b-instant` - Ultra fast
- `mixtral-8x7b-32768` - Great for complex tasks
- `qwen-2.5-72b-instruct` - Excellent reasoning

---

## 💰 2. TOGETHER AI ($25 FREE CREDIT)

**Why Together AI?**

- ✅ **$25 free credit** (no card required)
- ✅ Many open-source models
- ✅ Good performance
- ✅ Pay-as-you-go after credit

**Setup:**

1. Go to: https://api.together.xyz/
2. Sign up
3. Get API key from dashboard
4. Add to `.env`:
   ```bash
   TOGETHER_API_KEY=your_key_here
   ```

**Models Available:**

- `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo`
- `mistralai/Mixtral-8x7B-Instruct-v0.1`
- `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo`

---

## 🔷 3. GOOGLE GEMINI (CHEAPEST PAID)

**Why Gemini?**

- ✅ **$0.0006 per generation** (20x cheaper than GPT-4o)
- ✅ Generous free tier: 15 req/min, 1500/day
- ✅ Good quality
- ✅ No credit card for free tier

**Setup:**

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Create API key
4. Add to `.env`:
   ```bash
   GEMINI_API_KEY=AIza_your_key_here
   ```

**Models Available:**

- `gemini-1.5-flash` - Cheapest
- `gemini-2.5-flash` - Newer, better
- `gemini-2.5-pro` - Best quality

---

## 🤖 4. ANTHROPIC CLAUDE (YOUR SUBSCRIPTION)

**Why Claude?**

- ✅ Excellent instruction following
- ✅ Great for complex tasks
- ✅ You already have a subscription!

**Important:** Your claude.ai subscription is separate from API access.

**Setup:**

1. Go to: https://console.anthropic.com/
2. Sign up (separate from claude.ai)
3. Add payment method (API is pay-as-you-go)
4. Create API key
5. Add to `.env`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your_key_here
   ```

**Models Available:**

- `claude-3-5-haiku-20241022` - Fast & cheap
- `claude-3-5-sonnet-20241022` - Best quality

**Cost:** ~$0.008 per generation (still cheap!)

---

## 💳 5. OPENAI (PREMIUM)

**Why OpenAI?**

- ✅ Industry standard
- ✅ Excellent quality
- ✅ JSON mode support

**Problem:** Very low free tier (3 req/min)

**Setup:**

1. Go to: https://platform.openai.com/
2. Add $5+ credit for Tier 1 (500 req/min)
3. Get API key
4. Add to `.env`:
   ```bash
   OPENAI_API_KEY=sk-your_key_here
   ```

**Models Available:**

- `gpt-4o-mini` - Good balance
- `gpt-4o` - Best quality
- `gpt-4-turbo` - Previous gen

**Cost:** $0.0012 - $0.025 per generation

---

## 🎯 RECOMMENDED SETUP

**For Development (Free):**

```bash
# Just add Groq - best free tier!
GROQ_API_KEY=gsk_your_key_here
```

**For Production (Cheap):**

```bash
# Add Groq + Gemini for fallback
GROQ_API_KEY=gsk_your_key_here
GEMINI_API_KEY=AIza_your_key_here
```

**For Best Quality:**

```bash
# Add all providers for maximum flexibility
GROQ_API_KEY=gsk_your_key_here
GEMINI_API_KEY=AIza_your_key_here
ANTHROPIC_API_KEY=sk-ant_your_key_here
TOGETHER_API_KEY=your_key_here
OPENAI_API_KEY=sk_your_key_here
```

---

## 🔄 AUTO-FALLBACK SYSTEM

The system automatically tries multiple providers if one is rate limited:

1. **Your selected model** (e.g., GPT-4o)
2. **Falls back to:** Groq Llama 3.1 70B (30 req/min)
3. **Falls back to:** Gemini 1.5 Flash (15 req/min)

You'll never hit rate limits again! 🎉

---

## 💡 TIPS

1. **Start with Groq** - Best free tier, no card needed
2. **Add Gemini** - Cheap backup for high volume
3. **Use Claude** - When you need best quality
4. **Avoid OpenAI free tier** - Only 3 req/min

## 🚀 QUICK START

Minimum setup (takes 2 minutes):

```bash
# 1. Get Groq key: https://console.groq.com/
# 2. Add to .env:
GROQ_API_KEY=gsk_your_key_here

# 3. Restart server
npm run dev
```

Done! You now have 30 requests/minute for FREE! 🎊
