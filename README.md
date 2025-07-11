# Ignite - Facebook Ad Intelligence Platform

## Overview

Ignite is a comprehensive Facebook ad intelligence platform that allows users to scrape, analyze, and organize Facebook ads from the Facebook Ad Library. The platform provides tools for competitive analysis, ad discovery, and creative insights.

## Facebook Ad Scraping Architecture

### Current Implementation Status

⚠️ **Important Note**: The Facebook ad scraping functionality is currently in development. The application has the infrastructure in place but lacks the actual scraping implementation.

### How It Works (Intended Architecture)

#### 1. Manual URL-based Scraping
- **Input**: Facebook Ad Library URLs (e.g., `facebook.com/ads/library/...`)
- **Method**: Users can paste Facebook Ad Library page URLs for specific brands
- **Endpoint**: `/api/v1/x-ray/brands/add-to-folder-manually`
- **Status**: ⚠️ **TODO Implementation** (Currently returns mock data)

#### 2. Direct Brand Selection
- **Input**: Pre-existing brand database
- **Method**: Users select brands from the existing database
- **Endpoint**: `/api/v1/x-ray/brands/add-to-folder-directly`
- **Status**: ✅ **Functional** (Works with existing brand data)

### Data Sources

#### Facebook Ad Library
The platform is designed to work with Facebook's Ad Library:
- **URL Format**: `https://www.facebook.com/ads/library/`
- **Target**: Brand-specific ad pages (not keyword searches)
- **Data Extracted**: 
  - Ad creatives (images, videos, carousels)
  - Ad copy and descriptions
  - Call-to-action buttons
  - Landing page URLs
  - Campaign duration and status
  - Platform distribution (Facebook, Instagram)

### Current Scraping Gaps

#### Missing Implementation
```typescript
// TODO: Get brand - from add-to-folder-manually/route.ts:49
const brand = await prisma.brand.findFirst({
  where: {},
});
```

The actual scraping logic needs to be implemented to:
1. Parse Facebook Ad Library URLs
2. Extract brand information
3. Scrape ad creatives and metadata
4. Store ads in the database

### Recommended Scraping Technologies

Based on the project structure, here are recommended technologies for implementing the scraper:

#### Option 1: Puppeteer (Recommended)
```bash
npm install puppeteer
```

**Pros**: 
- Handles JavaScript-heavy sites like Facebook
- Can bypass basic anti-bot measures
- Good for pagination and dynamic content

**Implementation Example**:
```typescript
import puppeteer from 'puppeteer';

async function scrapeFacebookAdLibrary(url: string) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto(url);
  // Scraping logic here
  
  await browser.close();
}
```

#### Option 2: Playwright
```bash
npm install playwright
```

**Pros**:
- More modern than Puppeteer
- Better handling of complex interactions
- Built-in waiting mechanisms

#### Option 3: Facebook Ad Library API (If Available)
**Note**: Facebook's official Ad Library API has limitations and requires approval.

### Database Schema

The application uses Prisma ORM with the following relevant models:

#### Brand Model
```prisma
model Brand {
  id       String @id @default(cuid())
  name     String
  logo     String
  totalAds Int    @default(0)
  folders  Folder[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Missing Ad Model (Needs Implementation)
```prisma
model Ad {
  id          String @id @default(cuid())
  brandId     String
  title       String?
  description String
  imageUrl    String?
  videoUrl    String?
  ctaText     String
  landingUrl  String
  platform    String
  status      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  brand       Brand @relation(fields: [brandId], references: [id])
}
```

## Features

### ✅ Implemented Features
- **User Authentication**: NextAuth.js with secure login
- **Folder Management**: Organize brands into custom folders
- **Brand Database**: Store and manage brand information
- **Responsive UI**: Modern interface with Tailwind CSS
- **State Management**: Redux Toolkit for application state
- **API Architecture**: RESTful API with Prisma ORM

### 🚧 In Development
- **Facebook Ad Scraping**: Core scraping functionality
- **Ad Storage**: Database schema for ad data
- **Ad Display**: UI components for viewing scraped ads
- **Filtering & Search**: Advanced ad filtering capabilities
- **Analytics**: Performance metrics and insights

### 🔮 Planned Features
- **AI-Powered Insights**: Ad performance predictions
- **Creative Testing**: A/B testing recommendations
- **Landing Page Analysis**: Conversion optimization insights
- **Automated Monitoring**: Regular scraping schedules
- **Export Functionality**: Data export in various formats

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Redux Toolkit + Redux Persist
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Validation**: Joi
- **API**: RESTful endpoints

### Development Tools
- **Package Manager**: npm/yarn
- **Database Management**: Prisma Studio
- **Environment Management**: dotenv-cli
- **Code Quality**: ESLint + TypeScript

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Facebook Developer Account (for potential API access)

### Installation

1. **Clone the repository**
```bash
git clone [repository-url]
cd ignite-main
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Configure your database and auth settings
```

4. **Setup database**
```bash
npm run db:generate
npm run db:push
```

5. **Run development server**
```bash
npm run dev
```

### Adding Test Data
```bash
# Add fake brand data for testing
POST /api/add-fake-data
```

## API Documentation

### Brand Management
- `GET /api/v1/x-ray/brands` - Fetch all brands
- `POST /api/v1/x-ray/brands/add-to-folder-directly` - Add existing brands to folder
- `POST /api/v1/x-ray/brands/add-to-folder-manually` - Add brand via URL (TODO: Implement scraping)

### Folder Management  
- `GET /api/v1/x-ray/folders` - Fetch user folders
- `POST /api/v1/x-ray/folders` - Create new folder
- `PATCH /api/v1/x-ray/folders/:id` - Update folder
- `DELETE /api/v1/x-ray/folders/:id` - Delete folder

## Contributing

### Implementing Facebook Scraper

To contribute to the scraping functionality:

1. **Choose a scraping technology** (Puppeteer recommended)
2. **Implement URL parsing** to extract brand information
3. **Add ad data extraction** logic
4. **Create Ad model** in Prisma schema
5. **Update API endpoints** to handle scraped data
6. **Add error handling** for rate limiting and blocks

### Development Guidelines
- Follow TypeScript best practices
- Use Prisma for database operations
- Implement proper error handling
- Add input validation with Joi/Zod
- Follow the existing API response format

## Legal Considerations

⚠️ **Important**: When implementing scraping functionality:
- Respect Facebook's Terms of Service
- Implement rate limiting to avoid overwhelming servers
- Consider using Facebook's official Ad Library API when possible
- Ensure compliance with data privacy regulations
- Implement proper user agent rotation and proxy support

## Support

For questions or support:
- Create an issue in the repository
- Check existing documentation
- Review the API endpoints for integration

---

**Note**: This is an active development project. The scraping functionality is the primary missing component needed to make this a fully functional Facebook ad intelligence platform.
