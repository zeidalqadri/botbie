# 🕷️ UIX Crawler - Design Inspiration Engine

UIX Crawler is an intelligent web crawler that discovers, captures, and catalogs exceptional UI designs from acclaimed websites worldwide. It powers the curated gallery at uix.zeidgeist.com, helping developers overcome creative blocks with real-world design inspiration.

## 🌟 Features

- **Smart Discovery**: Crawls award-winning websites (Awwwards, CSS Design Awards, etc.)
- **AI-Powered Analysis**: Uses computer vision to identify exceptional UI components
- **Multi-State Capture**: Records hover, active, and focus states
- **Design Token Extraction**: Automatically extracts colors, typography, spacing
- **Pattern Recognition**: Identifies common UI patterns (cards, navigation, forms)
- **Code Generation**: Integrates with Sketchie to convert designs to TypeScript
- **Performance Metrics**: Analyzes load times and optimization techniques
- **Accessibility Scoring**: WCAG compliance checking for each component

## 🚀 Quick Start

### Installation

```bash
npm install @earth-agents/uix-crawler
```

### Basic Usage

```typescript
import { UIXCrawler } from '@earth-agents/uix-crawler';

// Initialize crawler
const crawler = new UIXCrawler({
  storage: {
    database: 'postgres://localhost/uix',
    images: 's3://uix-screenshots'
  },
  analysis: {
    extractPatterns: true,
    extractColors: true,
    extractTypography: true,
    checkAccessibility: true
  }
});

// Crawl a website
const result = await crawler.crawlWebsite('https://stripe.com', {
  depth: 2,
  captureInteractions: true,
  viewports: ['desktop', 'tablet', 'mobile']
});

// Extract specific component
const component = await crawler.extractComponent(
  'https://linear.app',
  '.navigation-bar'
);

// Generate code with Sketchie
const code = await crawler.generateComponentCode(component, {
  framework: 'react',
  typescript: true,
  styling: 'tailwind'
});
```

## 📊 API Endpoints

```typescript
// Start crawler server
import { createCrawlerAPI } from '@earth-agents/uix-crawler';

const api = createCrawlerAPI({
  port: 3000,
  corsOrigin: 'https://uix.zeidgeist.com'
});

api.start();
```

### Available Endpoints

```bash
# Trigger website crawl
POST /api/crawl
{
  "url": "https://vercel.com",
  "options": {
    "depth": 2,
    "patterns": ["navigation", "cards", "forms"]
  }
}

# Browse components
GET /api/components?type=navigation&style=minimal

# Get component details
GET /api/components/:id

# Generate component code
POST /api/components/:id/code
{
  "framework": "react",
  "styling": "styled-components"
}

# Get trending designs
GET /api/trending?period=week

# Search by color palette
GET /api/search/palette?colors=#000000,#FFFFFF
```

## 🎨 Design Analysis

### Pattern Detection

```typescript
const patterns = await crawler.analyzePatterns(websiteUrl);
// Returns: NavigationPattern[], CardPattern[], FormPattern[], etc.
```

### Color Extraction

```typescript
const palette = await crawler.extractColorPalette(componentImage);
// Returns: { primary: Color, secondary: Color[], accent: Color, neutrals: Color[] }
```

### Typography Analysis

```typescript
const typography = await crawler.analyzeTypography(webpage);
// Returns: { headings: Font[], body: Font, scale: number[], lineHeight: number[] }
```

## 🔄 Workflow Integration

### N8N Automation

```yaml
- Schedule daily crawls of trending sites
- Filter high-quality components
- Generate weekly design digest
- Auto-publish to gallery
```

### Earth Agents Integration

```typescript
// Use with Sketchie for instant code generation
const sketchie = await crawler.getSketchieIntegration();
const component = await sketchie.generateFromCrawled(crawledData);

// Quality check with Botbie
const botbie = await crawler.getBotbieIntegration();
const quality = await botbie.analyzeComponentQuality(component);
```

## 🗄️ Data Storage

### Database Schema

```sql
-- Websites table
websites: {
  id: UUID,
  url: string,
  name: string,
  designer: string,
  awards: string[],
  technology_stack: string[],
  crawled_at: timestamp
}

-- Components table
components: {
  id: UUID,
  website_id: UUID,
  type: ComponentType,
  selector: string,
  screenshot_url: string,
  html: string,
  css: string,
  interactions: InteractionState[],
  design_tokens: DesignTokens,
  accessibility_score: number,
  performance_metrics: PerformanceData,
  created_at: timestamp
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=analyzers

# Visual regression tests
npm run test:visual
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-analyzer`)
3. Commit your changes (`git commit -m 'Add amazing analyzer'`)
4. Push to the branch (`git push origin feature/amazing-analyzer`)
5. Open a Pull Request

## 📄 License

MIT © Earth Agents Team