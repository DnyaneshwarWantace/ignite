# Ghostwriter OS v2

A modern, AI-powered copywriting platform built with Next.js 14, TypeScript, and Supabase. Generate high-converting marketing content using proven direct response copywriting methodologies from Dan Kennedy, Russell Brunson, and Sabri Suby.

## 🚀 Features

- **Campaign DNA System**: Build comprehensive marketing profiles with progressive context building
- **35+ AI Copywriting Agents**: Specialized agents for every marketing need
- **Direct Response Copywriting**: Powered by methodologies from master copywriters
- **docOS**: Document management and organization
- **History Tracking**: Keep track of all generated content
- **Progressive Context**: DNA sections build on each other for richer context
- **Auto-Save**: Automatic saving of DNA sections and generated content

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- AI API key (OpenAI or Anthropic)

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema-simple.sql`
3. Copy your project URL and anon key from Settings → API

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Keys (at least one required)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

- **PROMPT.md**: Complete prompt system and copywriting strategies
- **NEW-PRMPT.md**: Source file containing all agent prompts in TypeScript format
- **lib/prompts.json**: JSON file containing all prompts (extracted from NEW-PRMPT.md)
- **SUPABASE_SETUP.md**: Detailed Supabase setup instructions
- **docs/agent-strategies/**: Strategy guides for all 35 agents

### Extracting Prompts from NEW-PRMPT.md

**IMPORTANT:** The `NEW-PRMPT.md` file must be SAVED before running the extraction script. If the file is unsaved in your editor, the script will find 0 prompts.

**Steps to Extract All Agent Prompts:**

1. **Save the NEW-PRMPT.md file** in your editor (this is critical!)

2. **Run the extraction script:**
```bash
node scripts/extract-all-prompts-final.js
```

This script:
- Reads `NEW-PRMPT.md` from disk
- Extracts ALL agent prompts (handles backtick-delimited strings)
- Updates `lib/prompts.json` with complete prompts
- Preserves every single line (no content loss)
- Shows you which agents were extracted and their sizes

**Expected Output:**
```
Reading NEW-PRMPT.md...
File size: [X] characters, [Y] lines
Found [Z] agent prompts

✅ Extraction complete!
   - New agents extracted: [number]
   - Total agents in JSON: [number]

Agents:
   ✓ Agent Name 1 (chars, lines)
   ✓ Agent Name 2 (chars, lines)
   ...
```

**If extraction shows 0 agents:**
- Make sure `NEW-PRMPT.md` is saved to disk
- Check that the file contains `const AGENT_PROMPTS` sections
- Verify the file format matches the expected TypeScript-like structure

## 🎯 How It Works

### Campaign DNA System

1. **Create a DNA**: Start by creating a new Campaign DNA
2. **Fill Sections**: Complete DNA sections in order (progressive context building)
3. **Generate Content**: Use any of the 35+ agents to generate personalized content
4. **Save & Organize**: Save generated content to docOS for easy access

### Progressive Context

- When generating DNA sections: Only previous sections are used as context
- When using agents: All completed DNA sections are used for full context
- This ensures each section builds on previous ones while agents have complete information

### Direct Response Copywriting

All content is generated using proven methodologies:
- **Dan Kennedy**: Specificity, guarantees, objection handling
- **Russell Brunson**: Value ladder, storytelling, belief shifts
- **Sabri Suby**: Problem-first, AIDA, social proof

See `PROMPT.md` for complete details.

## 🏗️ Project Structure

```
ghost-writer-os-v2/
├── app/
│   ├── agents/          # Agent pages and routes
│   ├── api/             # API routes (generate, DNA, etc.)
│   ├── dnas/            # DNA management pages
│   └── docos/           # Document management
├── components/
│   ├── dnas/            # DNA-related components
│   ├── layout/          # Layout components
│   └── ui/              # Reusable UI components
├── lib/                 # Utilities and helpers
├── docs/                # Documentation
└── PROMPT.md            # Complete prompt system
```

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4 / Anthropic Claude
- **Markdown**: react-markdown

## 📝 Available Agents

The platform includes 35+ specialized copywriting agents:

**Foundation Agents:**
- The Persuasive Premise
- High-Value Client Compass
- Ideal Client Profile
- Buying Profiles
- Methodology
- Problem & Promise

**Offer Creation:**
- Irresistible Offer
- Unforgettable Offer Names
- Unique Selling Proposition

**Solution Agents:**
- Unique Primary Solution
- Main Surprising Cause

**Copywriting Agents:**
- Ad Funnel (5 Levels of Awareness)
- Change of Beliefs
- My Little Secret
- Objection Remover
- The Problem Gateway
- The Provocative Question
- The Unexpected Solution
- Infinite Titles
- Landing Pages
- Perpetual Conversion Video (VSL)

**Content Agents:**
- Twitter/X Content
- Stories That Connect
- Selling Stories
- Content Ideas That Sell
- Short Content Scripts
- Viral Ideas
- Viral Hooks
- Viral Scripts

**YouTube Agents:**
- YouTube Angles
- Thumbnail Titles
- YouTube Description
- YouTube Thumbnails
- YouTube Titles

**Sales Agents:**
- SPIN Selling

See `docs/agent-strategies/` for detailed strategy guides for each agent.

## 🎨 Key Features

### Auto-Save
- DNA sections auto-save after 500ms of inactivity
- Generated content auto-saves to history
- No manual save required

### Progressive Context
- DNA sections build on each other
- Agents use full DNA context for optimal results
- Ensures consistency and personalization

### Human-Like Content
- Content written from business owner's perspective (first person)
- No AI mentions or automation references
- Ready to use immediately in marketing

## 🤝 Contributing

This is a private project. For issues or questions, please contact the maintainer.

## 📄 License

Private - All Rights Reserved

## 🙏 Acknowledgments

Built using proven copywriting methodologies from:
- **Dan Kennedy** - The No B.S. Direct Marketing expert
- **Russell Brunson** - DotCom Secrets & Expert Secrets
- **Sabri Suby** - Killer Sales Copy

---

**Built with ❤️ for copywriters and marketers**
