# 🌍 Earth Agents Ecosystem

A comprehensive AI-powered development platform combining proactive quality analysis, reactive debugging, and intelligent UI development!

## 🚀 Quick Start

```bash
# Install and build everything
npm install
npm run build

# Use the unified CLI
earth analyze              # Analyze code quality
earth debug "Error desc"   # Debug an issue
earth sketch design.png    # Convert design to code
earth workflow smart       # AI-powered workflow
```

## 🤖 Available Agents

### 1. **Botbie** - Proactive Code Guardian
Your code quality guardian that prevents bugs before they happen.

### 2. **DebugEarth** - Reactive Debugging Expert  
Systematic debugging assistant with mathematical proof generation.

### 3. **Sketchie** - UI/UX Development Assistant
Transform designs into TypeScript components with accessibility built-in.

## 📚 Complete Command Reference

### 🎯 Core Commands

#### `/earth:analyze` - Code Quality Analysis
Comprehensive code analysis powered by Botbie.

**Usage:**
```bash
/earth:analyze [path] [options]
```

**Options:**
- `security` - Focus on security vulnerabilities
- `performance` - Analyze performance bottlenecks
- `architecture` - Review architectural patterns

**Example:**
```bash
/earth:analyze ./src security
```

**Output:**
```
🤖 Botbie Analysis Complete!

📊 Quality Score: 85/100

Issues Found:
❌ CRITICAL: Hardcoded API key in config.ts:15
⚠️  HIGH: SQL injection risk in userService.ts:42
💡 MEDIUM: Complex function in auth.ts:128 (cyclomatic complexity: 12)

✅ Strengths:
- Good TypeScript coverage (92%)
- Consistent naming conventions
- Proper error handling in 87% of functions

💡 Recommendations:
1. Move secrets to environment variables
2. Use parameterized queries
3. Split complex functions
```

---

#### `/earth:debug` - Methodical Debugging
Start a debugging session with DebugEarth.

**Usage:**
```bash
/earth:debug [issue-description]
/earth:debug add [evidence-type] [data]
/earth:debug analyze
/earth:debug list
```

**Example:**
```bash
/earth:debug "User login fails intermittently"
/earth:debug add error "TypeError: Cannot read property 'id' of undefined"
/earth:debug analyze
```

**Output:**
```
🌍 DebugEarth Session Started!

📋 Collecting evidence...
✅ Console logs analyzed (42 entries)
✅ Stack traces correlated (3 patterns)
✅ Network requests examined (18 requests)

🎯 Root Cause Analysis:
━━━━━━━━━━━━━━━━━━━━━
Description: Race condition in authentication middleware
Confidence: 94%

📐 Proof Chain:
1. User object accessed before auth completes
2. Async middleware not awaited properly
3. Intermittent null reference when timing varies

💡 Solution:
Add 'await' to middleware chain in server.js:34
```

---

#### `/earth:sketch` - Design to Code
Transform designs into production TypeScript components.

**Usage:**
```bash
/earth:sketch [design-source] [options]
```

**Design Sources:**
- Image path (PNG, JPG)
- Figma URL
- Text description
- Screenshot

**Options:**
- `--framework [react|vue|angular]`
- `--styling [styled-components|tailwind|css]`
- `--typescript` (default: true)

**Example:**
```bash
/earth:sketch "Create a pricing card with title, price, features list, and CTA button"
```

**Output:**
```
🎨 Sketchie Analysis Complete!

✅ Generated Components:
- PricingCard.tsx (main component)
- PricingCard.styles.ts (styled-components)
- PricingCard.types.ts (TypeScript interfaces)
- PricingCard.test.tsx (unit tests)
- PricingCard.stories.tsx (Storybook)

📊 Component Analysis:
- Accessibility: WCAG AA compliant ✅
- Bundle Size: 2.3KB (gzipped)
- Performance: <16ms render time
- TypeScript: 100% type safe

Features Included:
✅ Responsive design (mobile-first)
✅ Theme support
✅ Loading states
✅ Error boundaries
✅ Keyboard navigation
```

---

#### `/earth:workflow` - Intelligent Workflows
AI-powered workflow orchestration across agents.

**Workflow Types:**
- `preventive` - Proactive quality checks
- `detective` - Reactive investigation
- `comprehensive` - Full analysis
- `ui-development` - UI/UX workflow
- `smart` - AI-recommended

**Example:**
```bash
/earth:workflow comprehensive
```

**Output:**
```
🔗 Comprehensive Workflow Started!

Step 1/6: 🤖 Quality Analysis (Botbie)
✅ Analyzed 156 files, found 23 issues

Step 2/6: 🎨 UI Analysis (Sketchie)  
✅ 12 components analyzed, 3 accessibility issues

Step 3/6: 🌍 Runtime Analysis (DebugEarth)
✅ No active bugs, performance optimal

Step 4/6: 🔄 Cross-Agent Correlation
✅ Found 3 insights linking quality to UX

Step 5/6: 🧠 Learning Engine Update
✅ 7 new patterns learned

Step 6/6: 📊 Report Generation
✅ Comprehensive report generated

Workflow Complete! 
Overall Health Score: 88/100 ⬆️ +5
```

---

### 🎨 UI Development Commands

#### `/earth:ui` - UI Component Analysis
Analyze existing components for quality and patterns.

**Usage:**
```bash
/earth:ui [path] [--focus accessibility|performance|patterns]
```

**Example:**
```bash
/earth:ui ./src/components --focus accessibility
```

**Output:**
```
🎯 UI Analysis Complete!

♿ Accessibility Report:
- Score: 78/100 (WCAG AA)
- Issues: 5 critical, 8 moderate
  ❌ Missing alt text in Gallery
  ❌ Low contrast in Button (3.2:1)
  ⚠️ No keyboard navigation in Dropdown

⚡ Performance:
- Bundle: 124KB total
- Largest: DataTable (31KB)
- Render: avg 18ms

🎨 Patterns Found:
- Card layout (8 instances)
- Form validation (5 instances)
- Loading states (inconsistent)
```

---

#### `/earth:component` - Component Operations
Create, refactor, and optimize components.

**Commands:**
- `create [name] --type [atom|molecule|organism]`
- `refactor [path]`
- `extract [file] [lines]`

**Example:**
```bash
/earth:component create Button --type atom --variants "primary,secondary"
```

**Output:**
```
🧩 Component Created!

Generated files:
✅ components/atoms/Button/
   ├── Button.tsx
   ├── Button.styles.ts
   ├── Button.types.ts
   ├── Button.test.tsx
   ├── Button.stories.tsx
   └── index.ts

Features:
- 2 variants (primary, secondary)
- 3 sizes (sm, md, lg)
- Loading state
- Disabled state
- Icon support
- Full accessibility
```

---

#### `/earth:design` - Design System Management
Extract and manage design tokens and systems.

**Commands:**
- `extract [path]` - Extract design tokens
- `audit` - Check consistency
- `create --name [name]` - Create new system

**Example:**
```bash
/earth:design extract ./src
```

**Output:**
```
🎨 Design System Extracted!

📊 Tokens Found:
Colors (24):
- primary: #3B82F6
- secondary: #8B5CF6
- gray.50-900 (10 shades)
- semantic (success, warning, error)

Typography (6):
- font-family: Inter, system-ui
- sizes: 12px to 48px
- weights: 400, 500, 600, 700

Spacing (8):
- 0, 1, 2, 4, 8, 16, 32, 64

⚠️ Inconsistencies:
- 3 different button heights
- Mixed rem/px units
- 5 one-off colors

✅ Auto-generated:
- tokens.ts
- theme.ts
- global.css
```

---

### 🧠 Intelligence Commands

#### `/earth:insights` - Cross-Agent Insights
View patterns and insights from all agents.

**Example:**
```bash
/earth:insights
```

**Output:**
```
💡 Cross-Agent Insights

🔴 Critical Pattern: "Auth Complexity → Security Issues"
   Source: Botbie → DebugEarth correlation
   Confidence: 91%
   Impact: 15 bugs prevented
   Action: Complexity limit added for auth code

🟡 UI Pattern: "Card Components Duplicated"
   Source: Sketchie analysis
   Frequency: 8 instances across project
   Action: Create unified Card component

🟢 Performance Win: "Lazy Loading Success"
   Source: Learning Engine
   Impact: 40% faster page loads
   Applied: 12 components optimized
```

---

#### `/earth:learn` - Learning Engine
View and manage learned patterns.

**Commands:**
- `patterns` - View all patterns
- `metrics` - Learning analytics
- `feedback` - Active feedback loops

**Example:**
```bash
/earth:learn patterns
```

**Output:**
```
🧠 Learning Patterns

1. Bug Correlation (Confidence: 94%)
   "Complex auth logic → Security vulnerabilities"
   Learned from: 23 instances
   Prevention rate: 87%

2. UI Performance (Confidence: 89%)
   "Images without lazy loading → Poor LCP"
   Applied to: 45 components
   Impact: 2.3s faster load

3. Team Preference (Confidence: 97%)
   "Prefer functional components over classes"
   Adoption: 98% of new components
   Productivity: +23%
```

---

#### `/earth:fix` - Auto-Fix Engine
Automatically fix detected issues.

**Fix Types:**
- `all` - Fix all safe issues
- `documentation` - Add missing docs
- `accessibility` - Fix a11y issues
- `security` - Security patches
- `performance` - Optimizations

**Example:**
```bash
/earth:fix accessibility
```

**Output:**
```
🔧 Auto-Fix Engine

Analyzing accessibility issues...
Found 12 fixable issues.

Fixes Applied:
✅ Added alt="User avatar" to 8 images
✅ Increased contrast: 3.2:1 → 4.6:1 (3 components)
✅ Added aria-label to icon button
✅ Fixed tab order in navigation

All fixes applied successfully!
Run tests to verify: npm test
```

---

#### `/earth:session` - Session Management
Manage debugging and analysis sessions.

**Commands:**
- `list` - Show active sessions
- `stats` - Analytics dashboard
- `export [id]` - Export session data

**Example:**
```bash
/earth:session stats
```

**Output:**
```
📊 Session Analytics

Active Sessions: 3
Total Sessions: 47 (this week)

By Type:
- Debugging: 28 (60%)
- Analysis: 15 (32%)
- UI Development: 4 (8%)

Success Rate: 89%
Avg Resolution Time: 12 min

Top Issues:
1. Null reference errors (8)
2. Performance bottlenecks (5)
3. Accessibility violations (4)
```

---

## 🏗️ Architecture

```
earth-agents/
├── packages/
│   ├── @earth-agents/
│   │   ├── core/          # Shared utilities
│   │   ├── botbie/        # Code quality agent
│   │   ├── sketchie/      # UI/UX agent
│   │   └── cli/           # Unified CLI
│   └── debugearth/        # Debugging agent
├── vscode-debugearth/     # VS Code extension
└── .claude/               # Claude Code integration
    └── commands/          # Slash commands
```

## 🔧 Configuration

### Global Config (`.earthrc`)
```json
{
  "defaultAgent": "botbie",
  "autoFix": true,
  "reporting": {
    "format": "html",
    "outputDir": "./reports"
  },
  "learning": {
    "enabled": true,
    "shareInsights": true
  },
  "ui": {
    "framework": "react",
    "styling": "styled-components",
    "typescript": true
  }
}
```

### Claude Desktop Integration
```json
{
  "mcpServers": {
    "earth-agents": {
      "command": "earth-mcp",
      "args": [],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT

## 🌟 Philosophy

> "Proactive prevention meets reactive resolution, with intelligent UI development bridging the gap between design and code."

Earth Agents transforms software development by combining:
- **Proactive Quality** (Botbie) - Stop bugs before they start
- **Reactive Debugging** (DebugEarth) - Solve bugs with precision
- **Intelligent UI** (Sketchie) - Design to code, beautifully
- **Continuous Learning** - Every interaction makes the system smarter

---

🌍 **Earth Agents**: Where code quality, debugging excellence, and UI craftsmanship unite! 🚀