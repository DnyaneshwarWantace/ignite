# Complete Platform Guide - Ghostwriter OS v2

**The Ultimate Guide to Understanding and Using Ghostwriter OS v2**

---

## 📑 Table of Contents

1. [Platform Overview](#platform-overview)
2. [How DNA Works](#how-dna-works)
3. [Progressive Context System](#progressive-context-system)
4. [Complete Agent List](#complete-agent-list)
5. [Best Practice Flow](#best-practice-flow)
6. [How the Code Works](#how-the-code-works)
7. [Platform Architecture](#platform-architecture)
8. [Storage System](#storage-system)
9. [API Routes](#api-routes)
10. [Auto-Save System](#auto-save-system)

---

## 🎯 Platform Overview

Ghostwriter OS v2 is an AI-powered copywriting platform that generates high-converting marketing content using proven direct response copywriting methodologies from Dan Kennedy, Russell Brunson, and Sabri Suby.

### Core Concept

The platform uses a **Campaign DNA** system - a comprehensive profile of your business, audience, and messaging strategy. This DNA feeds all AI agents to generate personalized, conversion-focused content.

### Key Features

- **11 DNA Sections**: Build a complete business profile
- **35+ AI Agents**: Specialized copywriting tools
- **Progressive Context**: Each section builds on previous ones
- **Auto-Save**: Automatic saving of DNA sections and generated content
- **docOS**: Document management system
- **History Tracking**: Track all generated content

---

## 🧬 How DNA Works

### What is Campaign DNA?

Campaign DNA is your complete business profile containing:
- Your story and achievements
- Your ideal client profile
- Your brand voice
- Your buying profiles
- Your persuasive premise
- Your false beliefs
- Your product/offer
- Your proofs and testimonials
- Your problem and solution

### DNA Section Order (Progressive Building)

DNA sections must be completed **in order** because each section uses context from previous sections:

```
1. Author Biography
   ↓
2. Ideal Client Profile (uses: Biography)
   ↓
3. Author/Brand Voice (uses: Biography, ICP)
   ↓
4. Buying Profile (uses: Biography, ICP, Brand Voice)
   ↓
5. The Persuasive Premise (uses: Sections 1-4)
   ↓
6. False Beliefs (uses: Sections 1-5)
   ↓
7. Product Offer and UVP (uses: Sections 1-6)
   ↓
8. Proofs (uses: Sections 1-7)
   ↓
9. Testimonials (uses: Sections 1-8)
   ↓
10. The Problem (uses: Sections 1-9)
   ↓
11. The Solution (uses: Sections 1-10)
```

### Complete DNA Section Details

#### **Section 1: Author Biography**
- **Purpose**: Your story, company info, and achievements
- **Required**: At least 3 main achievements (numbers, awards, clients, etc.)
- **Max Length**: 3,000 characters
- **Example**: "I'm Rajesh Kumar, founder of SkillUp Academy. I've trained 8,000+ students with 87% placement rate. Featured in Forbes, YourStory, and ET Now."
- **Used By**: Almost all agents (foundation for all content)

#### **Section 2: Ideal Client Profile (ICP)**
- **Purpose**: Detailed description of your ideal customer
- **Recommended Agents**: High-Value Client Compass → Ideal Client Profile (ICP)
- **Max Length**: 10,000 characters
- **Should Include**: Demographics, psychographics, pain points, desires, challenges
- **Used By**: All marketing and copywriting agents

#### **Section 3: Author/Brand Voice**
- **Purpose**: Clone your communication style
- **How to Fill**: Paste examples of your writing, emails, sales letters, or video transcriptions
- **Tip**: Ask AI to analyze your text and create a "communication style summary"
- **Max Length**: 2,500 characters
- **Used By**: All agents that generate content (to match your voice)

#### **Section 4: Buying Profile**
- **Purpose**: Understand how your customer makes purchasing decisions
- **Recommended Agent**: Buying Profiles
- **Max Length**: 5,000 characters
- **Should Include**: Decision-making style, triggers, objections, timeline
- **Used By**: Sales and marketing agents

#### **Section 5: The Persuasive Premise**
- **Purpose**: Core belief shift that guides your entire marketing campaign
- **Recommended Agent**: The Persuasive Premise (paste only Part 1 here)
- **Max Length**: 3,000 characters
- **Note**: Parts 2 and 3 (Primary/Secondary Beliefs) go in Section 6
- **Used By**: All copywriting agents

#### **Section 6: False Beliefs**
- **Purpose**: Address false beliefs that prevent sales
- **Recommended Agent**: The Persuasive Premise (paste Parts 2 and 3 here)
- **Max Length**: 5,000 characters
- **Should Include**: Primary beliefs and secondary beliefs
- **Used By**: Objection handling, belief shift agents

#### **Section 7: Product Offer and UVP**
- **Purpose**: Your offer, product, and unique value proposition
- **Recommended Agents**: Irresistible Offer → Unforgettable Offer Names → Unique Selling Proposition
- **Max Length**: 10,000 characters
- **Should Include**: Offer details, pricing, deliverables, bonuses, guarantees
- **Used By**: All offer and sales agents

#### **Section 8: Proofs**
- **Purpose**: All evidence of your credibility and results
- **Max Length**: 3,000 characters
- **Should Include**: Numbers, achievements, awards, certifications, media appearances, statistics
- **Note**: Testimonials go in Section 9
- **Used By**: All agents (for credibility and social proof)

#### **Section 9: Testimonials**
- **Purpose**: Best customer testimonials (3-5 recommended)
- **Max Length**: 5,000 characters
- **Structure**: Name, Result, Emotional Transcription
- **Best Testimonials**: Extreme transformations (worst "before" to best "after")
- **Used By**: All agents (for social proof)

#### **Section 10: The Problem**
- **Purpose**: The exact problem your solution solves
- **Recommended Agents**: Problem & Promise → Main Surprising Cause
- **Max Length**: 5,000 characters
- **Should Fit**: D.O.R.E.S. criteria (Desirable, Observable, Relevant, Experienced, Specific)
- **Used By**: Problem-focused agents, sales pages, ads

#### **Section 11: The Solution**
- **Purpose**: Your solution, promise, and transformation
- **Recommended Agents**: Problem & Promise → Unique Primary Solution
- **Max Length**: 5,000 characters
- **Focus**: Final destination (sell Paris, not the flight)
- **Used By**: Solution-focused agents, offers, sales pages

---

## 🔄 Progressive Context System

### How It Works

The progressive context system ensures each DNA section builds on previous ones, creating richer and more cohesive content.

### For DNA Section Generation

When generating content **for a DNA section** (using agents to help fill sections):

1. **Section 1 (Biography)**: No previous context
2. **Section 2 (ICP)**: Uses Section 1
3. **Section 3 (Brand Voice)**: Uses Sections 1-2
4. **Section 4 (Buying Profile)**: Uses Sections 1-3
5. **Section 5 (Persuasive Premise)**: Uses Sections 1-4
6. **Section 6 (False Beliefs)**: Uses Sections 1-5
7. **Section 7 (Product/Offer)**: Uses Sections 1-6
8. **Section 8 (Proofs)**: Uses Sections 1-7
9. **Section 9 (Testimonials)**: Uses Sections 1-8
10. **Section 10 (Problem)**: Uses Sections 1-9
11. **Section 11 (Solution)**: Uses Sections 1-10

**Code Implementation:**
```typescript
// In app/api/generate/route.ts
if (targetSectionId) {
  const targetIndex = DNA_SECTION_ORDER.indexOf(targetSectionId);
  if (targetIndex > 0) {
    sectionsToInclude = DNA_SECTION_ORDER.slice(0, targetIndex);
  }
}
```

### For Agent Content Generation

When using **any agent** to generate marketing content:

- **Uses ALL completed DNA sections** (full context)
- This ensures agents have complete information about your business
- Results are highly personalized and specific to your DNA

**Code Implementation:**
```typescript
// In app/api/generate/route.ts
if (!targetSectionId) {
  sectionsToInclude = DNA_SECTION_ORDER; // All sections
}
```

### Benefits

1. **Consistency**: Each section aligns with previous ones
2. **Richness**: More context = better content
3. **Personalization**: Content is specific to your business
4. **Cohesion**: All content works together as a system

---

## 🤖 Complete Agent List

### Foundation Agents (6)

#### 1. **The Persuasive Premise**
- **ID**: `persuasive-premise`
- **Category**: Foundation
- **Purpose**: Create your Persuasive Premise by discovering customer beliefs and shifting them to favor the sale
- **Output**: Main belief shift, new better belief, persuasive premise statement, primary beliefs, secondary beliefs
- **Use For**: DNA Section 5 (paste Part 1), DNA Section 6 (paste Parts 2-3)
- **Best Practice**: Use after completing Sections 1-4

#### 2. **High-Value Client Compass**
- **ID**: `high-value-client-compass`
- **Category**: Foundation
- **Purpose**: Find better-paying clients using the 6-direction compass and 7D Profile
- **Output**: Compass analysis (North, South, East, West, Through, Outside), 7D Profile evaluation, final choice
- **Use For**: DNA Section 2 (before Ideal Client Profile)
- **Best Practice**: Use first to identify your best client segment

#### 3. **Ideal Client Profile (ICP)**
- **ID**: `ideal-client-profile`
- **Category**: Foundation
- **Purpose**: Understand your ideal client better than they understand themselves
- **Output**: Complete ICP with demographics, psychographics, pain points, desires, challenges
- **Use For**: DNA Section 2 (after High-Value Client Compass)
- **Best Practice**: Use after High-Value Client Compass

#### 4. **Buying Profiles**
- **ID**: `buying-profiles`
- **Category**: Foundation
- **Purpose**: Understand your customer's buying profile and decision-making triggers
- **Output**: Primary/secondary buying profiles, decision-making process, buying triggers, objections, sales approach
- **Use For**: DNA Section 4
- **Best Practice**: Use after completing Sections 1-3

#### 5. **Methodology**
- **ID**: `methodology`
- **Category**: Foundation
- **Purpose**: Create the ideal methodology to teach better, stand out, and sell more
- **Output**: Unique methodology framework, steps, name, branding
- **Use For**: Product positioning, teaching materials
- **Best Practice**: Use when creating your unique approach

#### 6. **Problem & Promise**
- **ID**: `problem-promise`
- **Category**: Foundation
- **Purpose**: Define the problem and value proposition using D.O.R.E.S. criteria
- **Output**: Main problem, problem criteria (D.O.R.E.S.), problem name, real cause, promise, promise components
- **Use For**: DNA Section 10 (Problem), DNA Section 11 (Solution)
- **Best Practice**: Use after completing Sections 1-9

---

### Offer Creation Agents (4)

#### 7. **Irresistible Offer**
- **ID**: `irresistible-offer`
- **Category**: Offer
- **Purpose**: Create an offer so good that people would feel foolish saying no
- **Output**: Problem/Promise, offer structure, deliverables, value stack, obstacles addressed, delivery, risk reversal, urgency/scarcity, pricing, bonuses, CTA
- **Use For**: DNA Section 7 (Product Offer and UVP)
- **Best Practice**: Use after completing Sections 1-6

#### 8. **Unforgettable Offer Names**
- **ID**: `unforgettable-offer-names`
- **Category**: Offer
- **Purpose**: Create great names for your offer, product, or course
- **Output**: Multiple name options with explanations
- **Use For**: DNA Section 7 (Product Offer and UVP)
- **Best Practice**: Use with Irresistible Offer

#### 9. **Unique Selling Proposition**
- **ID**: `unique-selling-proposition`
- **Category**: Offer
- **Purpose**: Make it clear once and for all why you're different
- **Output**: Clear USP statement, differentiation points, competitive advantages
- **Use For**: DNA Section 7 (Product Offer and UVP)
- **Best Practice**: Use with Irresistible Offer

#### 10. **Unique Primary Solution**
- **ID**: `unique-primary-solution`
- **Category**: Offer
- **Purpose**: Create a unique solution that stands out from all competitors
- **Output**: Solution name, what it is, how it works, why it's unique, transformation (before-after-bridge)
- **Use For**: DNA Section 11 (Solution)
- **Best Practice**: Use after completing Sections 1-10

---

### Solution Agents (1)

#### 11. **Main Surprising Cause**
- **ID**: `main-surprising-cause`
- **Category**: Copy
- **Purpose**: Find the real cause behind your prospect's problems
- **Output**: What most people think is the cause, the real (surprising) cause, why it matters, validation, implications
- **Use For**: DNA Section 10 (Problem)
- **Best Practice**: Use with Problem & Promise

---

### Copywriting Agents (15)

#### 12. **Ad Funnel**
- **ID**: `ad-funnel`
- **Category**: Copy
- **Purpose**: Create a complete ad funnel using Eugene Schwartz's 5 Levels of Awareness
- **Output**: Ad copy for each awareness level (L5: Totally Unaware → L1: Fully Aware)
- **Has Instructions**: Yes (funnel stage selection)
- **Use For**: Complete marketing funnel creation
- **Best Practice**: Use after completing all DNA sections

#### 13. **Change of Beliefs**
- **ID**: `change-of-beliefs`
- **Category**: Copy
- **Purpose**: Create persuasive ads to establish Persuasive Premise and shift beliefs
- **Output**: Belief shift ad copy
- **Has Instructions**: Yes
- **Use For**: Facebook/Instagram ads, awareness campaigns
- **Best Practice**: Use after completing Sections 1-6

#### 14. **My Little Secret**
- **ID**: `my-little-secret`
- **Category**: Copy
- **Purpose**: A surprising confession that leads to the desired solution
- **Output**: Secret-based ad copy
- **Has Instructions**: Yes
- **Use For**: Attention-grabbing ads, pattern interrupts
- **Best Practice**: Use for hook creation

#### 15. **Objection Remover**
- **ID**: `objection-remover`
- **Category**: Copy
- **Purpose**: Create high-conversion carousels that shift beliefs and remove objections
- **Output**: Carousel ad content (multiple slides)
- **Has Instructions**: Yes
- **Use For**: Instagram/Facebook carousel ads
- **Best Practice**: Use after identifying objections from Buying Profile

#### 16. **The Problem Gateway**
- **ID**: `the-problem-gateway`
- **Category**: Copy
- **Purpose**: Reveals how common solutions can make problems worse
- **Output**: Problem gateway ad copy
- **Has Instructions**: Yes
- **Use For**: Problem agitation, awareness building
- **Best Practice**: Use after completing Section 10 (Problem)

#### 17. **The Provocative Question**
- **ID**: `the-provocative-question`
- **Category**: Copy
- **Purpose**: Create highly persuasive Facebook ads focused on identifying and scaling the main surprising cause
- **Output**: Provocative question-based ad copy
- **Has Instructions**: Yes
- **Use For**: Facebook ads, attention hooks
- **Best Practice**: Use with Main Surprising Cause

#### 18. **The Unexpected Solution**
- **ID**: `the-unexpected-solution`
- **Category**: Copy
- **Purpose**: Create highly persuasive ads to capture attention, challenge conventional thinking, and present your unique solution
- **Output**: Unexpected solution ad copy
- **Has Instructions**: Yes
- **Use For**: Solution-focused ads, differentiation
- **Best Practice**: Use after completing Section 11 (Solution)

#### 19. **Infinite Titles**
- **ID**: `infinite-titles`
- **Category**: Copy
- **Purpose**: Generate as many irresistible titles for posts, ads, and videos as you want
- **Output**: Multiple title variations
- **Use For**: Blog posts, ads, videos, social media
- **Best Practice**: Use for any content that needs a title

#### 20. **Landing Pages**
- **ID**: `landing-pages`
- **Category**: Copy
- **Purpose**: Create high-converting landing pages using 14 essential sections
- **Output**: Complete landing page copy with all sections
- **Has Instructions**: Yes
- **Use For**: Sales pages, lead magnets, product pages
- **Best Practice**: Use after completing all DNA sections

#### 21. **Perpetual Conversion Video (VSL)**
- **ID**: `perpetual-conversion-video`
- **Category**: Copy
- **Purpose**: Transform your product into a high-converting offer with expert Video Sales Letter scripts
- **Output**: Complete VSL script (12 sections)
- **Has VSL Sections**: Yes (can generate individual sections)
- **VSL Sections**: 
  - Section 1: Introduction / Real Cause of the Problem
  - Section 2: Solution Mechanism
  - Sections 3-4: The Damaging Admission / Transition
  - Section 5: The Solution (Product)
  - Sections 6-7: Offer / CTA + Scarcity
  - Sections 8-9: Bonuses / Guarantee
  - Sections 10-12: Urgency / Options / Close
- **Use For**: Video sales letters, webinar scripts, long-form sales content
- **Best Practice**: Use after completing all DNA sections

#### 22. **E-mail Editor**
- **ID**: `email-editor`
- **Category**: Copy
- **Purpose**: Edit your emails to correct errors, improve flow, and sell more
- **Output**: Improved email copy
- **Has Instructions**: Yes
- **Use For**: Email marketing, sales emails, newsletters
- **Best Practice**: Use for any email content

#### 23. **SPIN Selling**
- **ID**: `spin-selling`
- **Category**: Copy
- **Purpose**: Discover relevant questions to apply the SPIN Selling methodology in your sales
- **Output**: SPIN questions (Situation, Problem, Implication, Need-Payoff)
- **Has Instructions**: Yes
- **Use For**: Sales conversations, discovery calls, qualification
- **Best Practice**: Use after completing Sections 1-4 (especially Buying Profile)

---

### Content Agents (14)

#### 24. **Twitter/X Content**
- **ID**: `twitter-x-content`
- **Category**: Content
- **Purpose**: Create tweets or threads that engage, educate, and sell
- **Output**: Twitter/X posts or threads
- **Has Funnel Stage**: Yes (Awareness, Interest, Desire, Action)
- **Has Tweet Format**: Yes (Single Tweet, Thread, Poll, etc.)
- **Use For**: Twitter/X marketing, social media content
- **Best Practice**: Use for regular social media posting

#### 25. **Content Ideas that Sell**
- **ID**: `content-ideas-that-sell`
- **Category**: Content
- **Purpose**: Find content ideas that attract the right type of customer, the one who buys
- **Output**: Multiple content ideas with angles
- **Has Instructions**: Yes
- **Use For**: Content planning, social media strategy
- **Best Practice**: Use for content calendar planning

#### 26. **Selling Stories**
- **ID**: `selling-stories`
- **Category**: Content
- **Purpose**: Create persuasive story sequences that sell like crazy
- **Output**: Story-based content sequences
- **Use For**: Instagram stories, social media content
- **Best Practice**: Use for storytelling content

#### 27. **Short Content Scripts**
- **ID**: `short-content-scripts`
- **Category**: Content
- **Purpose**: Create content scripts specialized in list formats (tips, steps, myths, mistakes, etc.)
- **Output**: List-based content scripts
- **Use For**: Social media posts, short videos, carousels
- **Best Practice**: Use for quick, scannable content

#### 28. **Stories that Connect**
- **ID**: `stories-that-connect`
- **Category**: Content
- **Purpose**: Adapt any content into a sequence of stories that truly connect
- **Output**: Story sequences
- **Use For**: Instagram, social media, relationship building
- **Best Practice**: Use for emotional connection content

#### 29. **Viral Hooks**
- **ID**: `viral-hooks`
- **Category**: Content
- **Purpose**: Create short hooks up to 6 seconds to ensure you capture the attention of as many people as possible
- **Output**: Multiple hook variations
- **Has Instructions**: Yes
- **Use For**: Video hooks, social media openings
- **Best Practice**: Use for any video content

#### 30. **Viral Ideas**
- **ID**: `viral-ideas`
- **Category**: Content
- **Purpose**: Generate highly shareable ideas that can be used for content, ads, and more
- **Output**: Viral content ideas
- **Has Instructions**: Yes
- **Use For**: Content ideation, viral marketing
- **Best Practice**: Use for content planning

#### 31. **Viral Scripts**
- **ID**: `viral-scripts`
- **Category**: Content
- **Purpose**: Follow a proven structure based on some of the most viral videos in the world with attention-grabbing hooks
- **Output**: Complete viral video scripts
- **Has Instructions**: Yes
- **Use For**: Video content, TikTok, Instagram Reels, YouTube Shorts
- **Best Practice**: Use for short-form video content

#### 32. **Thumbnail Titles**
- **ID**: `thumbnail-titles`
- **Category**: Content
- **Purpose**: Create text variations for your YouTube video thumbnail to increase your click-through rate
- **Output**: Multiple thumbnail text options
- **Has Instructions**: Yes (requires topic)
- **Use For**: YouTube thumbnails
- **Best Practice**: Use with YouTube Thumbnails agent

#### 33. **YouTube Angles**
- **ID**: `youtube-angles`
- **Category**: Content
- **Purpose**: Turn a dull idea into a video that's impossible to ignore
- **Output**: Multiple video angles and approaches
- **Has Instructions**: Yes (requires topic)
- **Use For**: YouTube video planning
- **Best Practice**: Use before creating YouTube content

#### 34. **YouTube Description**
- **ID**: `youtube-description`
- **Category**: Content
- **Purpose**: Create an SEO-optimized description based on the transcript of your video
- **Output**: SEO-optimized YouTube description
- **Has Instructions**: Yes (requires video transcript/topic)
- **Use For**: YouTube video descriptions
- **Best Practice**: Use after creating YouTube video

#### 35. **YouTube Thumbnails**
- **ID**: `youtube-thumbnails`
- **Category**: Content
- **Purpose**: Suggestions for text, elements, and design for your YouTube thumbnails
- **Output**: Thumbnail design suggestions
- **Has Instructions**: Yes
- **Use For**: YouTube thumbnail design
- **Best Practice**: Use with Thumbnail Titles agent

#### 36. **YouTube Titles**
- **ID**: `youtube-titles`
- **Category**: Content
- **Purpose**: Create optimized titles to perform well on YouTube
- **Output**: Multiple YouTube title options
- **Has Instructions**: Yes
- **Use For**: YouTube video titles
- **Best Practice**: Use for any YouTube content

---

## 🎯 Best Practice Flow

### Step-by-Step Process to Get the Best Results

#### **Phase 1: Foundation (DNA Sections 1-4)**

1. **Create a New DNA**
   - Go to DNAs page → Click "Create New DNA"
   - Give it a name (e.g., "SkillUp Academy - Main Campaign")

2. **Fill Section 1: Author Biography**
   - Write your story, company info
   - Include at least 3 specific achievements with numbers
   - Example: "8,000+ students trained, 87% placement rate, featured in Forbes"
   - **Auto-saves** after 500ms of inactivity

3. **Fill Section 2: Ideal Client Profile**
   - **First**: Use "High-Value Client Compass" agent
     - This helps identify your best client segment
   - **Then**: Use "Ideal Client Profile (ICP)" agent
     - Paste the result into Section 2
   - **Auto-saves** after 500ms

4. **Fill Section 3: Author/Brand Voice**
   - Paste examples of your writing
   - Or paste video transcriptions
   - Tip: Ask AI to create a "communication style summary"
   - **Auto-saves** after 500ms

5. **Fill Section 4: Buying Profile**
   - Use "Buying Profiles" agent
   - Paste the result into Section 4
   - **Auto-saves** after 500ms

#### **Phase 2: Strategy (DNA Sections 5-6)**

6. **Fill Section 5: The Persuasive Premise**
   - Use "The Persuasive Premise" agent
   - **Only paste Part 1** (The Persuasive Premise Statement) into Section 5
   - **Auto-saves** after 500ms

7. **Fill Section 6: False Beliefs**
   - Use "The Persuasive Premise" agent again (or use previous result)
   - **Paste Parts 2 and 3** (Primary and Secondary Beliefs) into Section 6
   - **Auto-saves** after 500ms

#### **Phase 3: Offer (DNA Section 7)**

8. **Fill Section 7: Product Offer and UVP**
   - **Step 1**: Use "Irresistible Offer" agent
   - **Step 2**: Use "Unforgettable Offer Names" agent
   - **Step 3**: Use "Unique Selling Proposition" agent
   - Paste all results into Section 7
   - **Auto-saves** after 500ms

#### **Phase 4: Proof (DNA Sections 8-9)**

9. **Fill Section 8: Proofs**
   - Manually enter all your proofs:
     - Numbers (8,000+ students)
     - Achievements (87% placement rate)
     - Awards, certifications
     - Media appearances
     - Social media stats
   - **Auto-saves** after 500ms

10. **Fill Section 9: Testimonials**
    - Paste 3-5 best testimonials
    - Format: Name, Result, Emotional Transcription
    - Best: Extreme transformations (worst before → best after)
    - **Auto-saves** after 500ms

#### **Phase 5: Problem & Solution (DNA Sections 10-11)**

11. **Fill Section 10: The Problem**
    - **Step 1**: Use "Problem & Promise" agent
    - **Step 2**: Use "Main Surprising Cause" agent
    - Paste results into Section 10
    - **Auto-saves** after 500ms

12. **Fill Section 11: The Solution**
    - **Step 1**: Use "Problem & Promise" agent (for the Promise part)
    - **Step 2**: Use "Unique Primary Solution" agent
    - Paste results into Section 11
    - **Auto-saves** after 500ms

#### **Phase 6: Generate Marketing Content**

Now that your DNA is complete, use any agent to generate marketing content:

13. **For Ads**: Use Ad Funnel, Change of Beliefs, Objection Remover, etc.
14. **For Social Media**: Use Twitter/X Content, Viral Scripts, Stories that Connect
15. **For Sales Pages**: Use Landing Pages, Perpetual Conversion Video
16. **For Content**: Use Content Ideas that Sell, Viral Hooks, YouTube agents

**All generated content:**
- **Auto-saves** to history immediately
- Can be **saved to docOS** using "Save to docOS" button
- Can be **copied** using "Copy" button

---

## 💻 How the Code Works

### File Structure

```
ghost-writer-os-v2/
├── app/
│   ├── agents/
│   │   └── [id]/
│   │       └── page.tsx          # Agent page (UI + logic)
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts          # Main AI generation API
│   │   ├── dna/
│   │   │   ├── save/route.ts     # Save DNA sections
│   │   │   └── load/route.ts     # Load DNA sections
│   │   └── history/
│   │       ├── save/route.ts     # Save generated content
│   │       └── load/route.ts      # Load generated content
│   ├── dnas/
│   │   ├── page.tsx              # DNA list page
│   │   ├── new/page.tsx          # Create new DNA
│   │   └── [id]/page.tsx         # DNA edit page
│   └── docos/
│       └── page.tsx              # Document management
├── lib/
│   ├── agents.ts                 # Agent definitions
│   ├── constants.ts              # DNA sections, constants
│   ├── storage.ts                # Local storage utilities
│   └── supabase/
│       ├── client.ts             # Supabase client
│       └── server.ts             # Supabase server
└── components/
    ├── dnas/                     # DNA components
    ├── layout/                   # Layout components
    └── ui/                       # UI components
```

### Core Flow: Content Generation

```
User Action (Generate Button)
    ↓
app/agents/[id]/page.tsx
    ↓
handleGenerate() function
    ↓
POST /api/generate
    ↓
app/api/generate/route.ts
    ↓
buildPrompt() function
    ├── DNA Context (progressive or full)
    ├── Copywriting Strategies
    ├── Agent-Specific Instructions
    └── User Input
    ↓
AI API Call (Anthropic Claude or OpenAI GPT-4)
    ↓
Response Processing
    ├── cleanMarkdown()
    └── Return to frontend
    ↓
Display in UI
    ├── Auto-save to history
    └── Show Copy/Save buttons
```

### Key Functions

#### **buildPrompt()** (app/api/generate/route.ts)
- Builds the complete prompt for AI
- Handles progressive context (DNA sections)
- Adds copywriting strategies
- Adds agent-specific instructions

#### **getCopywritingStrategiesSection()** (app/api/generate/route.ts)
- Generates copywriting strategies section
- Randomly selects expert focus (Dan Kennedy, Russell Brunson, Sabri Suby, or Combined)
- Includes all mnemonic frameworks (PAIN, PAS, AIDA, etc.)

#### **getAgentSpecificInstructions()** (app/api/generate/route.ts)
- Returns agent-specific instructions
- Handles special cases (VSL sections, funnel stages, tweet formats)

#### **cleanMarkdown()** (app/api/generate/route.ts)
- Cleans AI-generated markdown
- Removes unwanted headings
- Fixes spacing and formatting

### DNA Section Auto-Save

**Location**: `app/dnas/[id]/page.tsx`

**How It Works:**
```typescript
// Debounced auto-save (500ms delay)
useEffect(() => {
  const handler = setTimeout(async () => {
    for (const sectionId in debouncedContent) {
      await handleSectionChange(sectionId, debouncedContent[sectionId]);
    }
    setDebouncedContent({});
  }, 500); // 500ms debounce

  return () => clearTimeout(handler);
}, [debouncedContent]);
```

**Flow:**
1. User types in DNA section
2. Content updates in state
3. Debounced content is set
4. After 500ms of no typing, auto-save triggers
5. Saves to Supabase (or localStorage if Supabase not configured)

### Generated Content Auto-Save

**Location**: `app/agents/[id]/page.tsx`

**How It Works:**
```typescript
// Auto-save immediately after generation
const responseData = {
  content: data.content,
  agentId,
  agentName: agent?.name,
  timestamp: Date.now(),
  dnaId: selectedDNA,
};
localStorage.setItem(`agent-response-${agentId}-${timestamp}`, JSON.stringify(responseData));
```

**Flow:**
1. User clicks "Generate"
2. Content is generated
3. Immediately saved to localStorage (history)
4. User can also save to docOS using "Save to docOS" button

---

## 🏗️ Platform Architecture

### Frontend (Next.js 14 App Router)

- **Pages**: Server and client components
- **Routing**: Dynamic routes (`[id]`, `[id]/page.tsx`)
- **State Management**: React hooks (useState, useEffect)
- **Styling**: Tailwind CSS
- **Markdown**: react-markdown for rendering AI responses

### Backend (Supabase + API Routes)

- **Database**: Supabase (PostgreSQL)
- **Tables**: 
  - `dnas`: DNA profiles
  - `dna_sections`: Individual section data
- **API Routes**: Next.js API routes for AI generation, DNA save/load
- **Storage**: Supabase for production, localStorage for fallback

### AI Integration

- **Primary**: Anthropic Claude (claude-3-haiku-20240307)
- **Fallback**: OpenAI GPT-4 Turbo
- **System Messages**: Comprehensive copywriting strategies
- **Prompt Building**: Dynamic based on DNA context and agent

---

## 💾 Storage System

### Supabase Storage (Primary)

**Tables:**
- `dnas`: Stores DNA profiles
  - id, user_id, name, is_default, created_at, updated_at
- `dna_sections`: Stores section content
  - id, dna_id, section_id, content, completed, last_edit, created_at, updated_at

**API Routes:**
- `POST /api/dna/save`: Save DNA section
- `GET /api/dna/load`: Load DNA and sections

### LocalStorage Storage (Fallback)

**Used When:**
- Supabase not configured
- Offline mode
- Development/testing

**Storage Keys:**
- `dnas`: List of all DNAs
- `dna-sections-{dnaId}`: Sections for specific DNA
- `agent-response-{agentId}-{timestamp}`: Generated content
- `agent-responses-{agentId}`: All responses for agent
- `docos-documents`: All docOS documents

### docOS Storage

**Purpose**: Save generated content as documents

**Storage:**
- Supabase: If configured
- LocalStorage: Fallback

**Operations:**
- `getAll()`: Get all documents
- `getById(id)`: Get specific document
- `create(doc)`: Create new document
- `update(id, updates)`: Update document
- `delete(id)`: Delete document

---

## 🔌 API Routes

### POST /api/generate

**Purpose**: Generate AI content

**Request Body:**
```typescript
{
  agentId: string;
  dnaData: any; // All DNA sections
  generalInput: string; // User input
  agentName: string;
  vslSection?: string; // For VSL agent
  funnelStage?: string; // For Ad Funnel agent
  tweetFormat?: string; // For Twitter/X agent
  keywords?: string; // For some agents
  topic?: string; // For some agents
  language?: string; // Language selection
  targetSectionId?: string; // For DNA section generation
}
```

**Response:**
```typescript
{
  content: string; // Generated content
}
```

**Flow:**
1. Receives request with agent ID and DNA data
2. Builds prompt using `buildPrompt()`
3. Calls AI API (Anthropic or OpenAI)
4. Cleans markdown using `cleanMarkdown()`
5. Returns generated content

### POST /api/dna/save

**Purpose**: Save DNA section

**Request Body:**
```typescript
{
  dnaId: string;
  sectionId: string;
  content: string;
  completed: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
  section?: DNASection;
}
```

### GET /api/dna/load

**Purpose**: Load DNA and all sections

**Query Parameters:**
- `dnaId`: DNA ID to load

**Response:**
```typescript
{
  dna: DNA;
  sections: DNASection[];
}
```

### POST /api/history/save

**Purpose**: Save generated content to history

**Request Body:**
```typescript
{
  agentId: string;
  content: string;
  timestamp: number;
  dnaId: string;
}
```

### GET /api/history/load

**Purpose**: Load history for agent

**Query Parameters:**
- `agentId`: Agent ID

**Response:**
```typescript
{
  history: HistoryItem[];
}
```

---

## ⚡ Auto-Save System

### DNA Section Auto-Save

**Trigger**: 500ms after user stops typing

**Implementation:**
```typescript
// In app/dnas/[id]/page.tsx
const [debouncedContent, setDebouncedContent] = useState<Record<string, string>>({});

useEffect(() => {
  const handler = setTimeout(async () => {
    for (const sectionId in debouncedContent) {
      await handleSectionChange(sectionId, debouncedContent[sectionId]);
    }
    setDebouncedContent({});
  }, 500); // 500ms debounce

  return () => clearTimeout(handler);
}, [debouncedContent]);
```

**Saves To:**
- Supabase (if configured)
- LocalStorage (fallback)

### Generated Content Auto-Save

**Trigger**: Immediately after generation

**Implementation:**
```typescript
// In app/agents/[id]/page.tsx
const responseData = {
  content: data.content,
  agentId,
  agentName: agent?.name,
  timestamp: Date.now(),
  dnaId: selectedDNA,
};
localStorage.setItem(`agent-response-${agentId}-${timestamp}`, JSON.stringify(responseData));
```

**Saves To:**
- LocalStorage (history)
- Can also save to docOS manually

---

## 🎓 Summary

### Key Takeaways

1. **DNA is the Foundation**: Complete all 11 sections in order for best results
2. **Progressive Context**: Each section builds on previous ones
3. **35+ Agents**: Each specialized for specific marketing needs
4. **Auto-Save**: Everything saves automatically (DNA sections: 500ms delay, Generated content: immediate)
5. **Full Context**: Agents use all completed DNA sections for personalized content

### Best Practices

1. **Complete DNA First**: Fill all 11 sections before generating marketing content
2. **Use Recommended Agents**: Each DNA section has recommended agents
3. **Save to docOS**: Organize generated content in docOS
4. **Use History**: Review previously generated content
5. **Iterate**: Refine DNA sections based on generated content quality

### Quick Reference

- **DNA Sections**: 11 sections, must complete in order
- **Agents**: 35+ agents across 4 categories
- **Auto-Save**: DNA (500ms), Generated content (immediate)
- **Storage**: Supabase (primary), LocalStorage (fallback)
- **AI**: Anthropic Claude (primary), OpenAI GPT-4 (fallback)

---

**This is your complete guide to Ghostwriter OS v2. Use it as a reference for understanding how everything works!**
