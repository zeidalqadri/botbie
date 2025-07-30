# /earth:design

🎨 **Design System Management** - Extract, maintain, and evolve your design system

I help you build and maintain a consistent design system from your codebase!

## Usage

**Extract Design Tokens:**
```
/earth:design extract [path]
```

**Create Design System:**
```
/earth:design create --name [name]
```

**Audit Consistency:**
```
/earth:design audit
```

**With Arguments:**
```
/earth:design $ARGUMENTS
```
Use $ARGUMENTS for design system operations

## Design System Features

### 🎯 **Token Extraction**
Automatically extract design tokens from your code:

#### 🎨 **Color Tokens**
```
Extracted Color Palette:
- Primary: #3B82F6 (blue-500)
  - Light: #60A5FA (blue-400)
  - Dark: #2563EB (blue-600)
- Secondary: #8B5CF6 (violet-500)
- Success: #10B981 (green-500)
- Warning: #F59E0B (amber-500)
- Error: #EF4444 (red-500)
- Neutrals: 12 shades (gray scale)

Found 47 unique colors → Reduced to 24 tokens
```

#### 📐 **Typography Tokens**
```
Font Families:
- Heading: 'Inter', sans-serif
- Body: 'Inter', sans-serif
- Code: 'JetBrains Mono', monospace

Font Sizes:
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl → 6xl: Scaling system

Line Heights & Weights defined
```

#### 📏 **Spacing Tokens**
```
Spacing Scale:
- 0: 0px
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 4: 1rem (16px)
- 8: 2rem (32px)
- 16: 4rem (64px)

Detected inconsistencies:
- 23px used 3 times → Suggest: 24px (6)
- 18px used 5 times → Suggest: 16px (4)
```

#### 🌟 **Effect Tokens**
```
Shadows:
- sm: 0 1px 2px rgba(0,0,0,0.05)
- base: 0 1px 3px rgba(0,0,0,0.1)
- lg: 0 10px 15px rgba(0,0,0,0.1)

Border Radius:
- none: 0
- sm: 0.125rem
- base: 0.25rem
- lg: 0.5rem
- full: 9999px

Transitions:
- fast: 150ms ease-in-out
- base: 250ms ease-in-out
- slow: 350ms ease-in-out
```

### 📋 **Design System Creation**

#### 🏗️ **System Structure**
```
/earth:design create --name "MyDesignSystem"

Created design-system/
├── tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── effects.ts
│   └── index.ts
├── components/
│   ├── primitives/
│   ├── patterns/
│   └── layouts/
├── themes/
│   ├── light.ts
│   ├── dark.ts
│   └── index.ts
├── utils/
│   ├── css-helpers.ts
│   └── theme-provider.tsx
└── docs/
    ├── README.md
    └── guidelines.md
```

#### 🎨 **Theme Generation**
```typescript
// Generated theme object
export const lightTheme = {
  colors: {
    primary: tokens.colors.blue500,
    background: tokens.colors.white,
    text: tokens.colors.gray900,
    // ... complete mapping
  },
  space: tokens.spacing,
  fonts: tokens.typography.families,
  // ... all tokens organized
}
```

### 🔍 **Consistency Audit**

#### 📊 **Usage Analysis**
```
/earth:design audit

Design Consistency Report:

Colors:
✅ Primary color used consistently (142 times)
⚠️ 6 off-brand blues detected
   - #3B82F5 → Use: primary (blue-500)
   - #3B83F6 → Use: primary (1px difference!)
❌ 23 hardcoded colors (not in palette)

Typography:
✅ Font families consistent
⚠️ 5 custom font sizes (use scale)
⚠️ Inconsistent heading hierarchy

Spacing:
❌ 47 magic numbers (use spacing scale)
⚠️ Inconsistent padding patterns
   - Cards: 16px, 20px, 24px → Standardize

Components:
✅ Button variants follow system
⚠️ 3 different card shadows
❌ Form inputs have 4 border styles
```

#### 🔧 **Auto-Fix Suggestions**
```
Found 76 issues (23 auto-fixable)

Quick Fixes:
1. Replace hardcoded colors → tokens (23)
2. Standardize spacing values → scale (18)  
3. Unify border radius → tokens (12)

Run: /earth:fix design-system
```

### 📚 **Documentation Generation**

#### 📖 **Component Library**
```
/earth:design docs

Generated Documentation:
- Component API reference
- Usage examples
- Design principles
- Token reference
- Accessibility guidelines
- Migration guide
```

#### 🎯 **Living Style Guide**
```
Created interactive style guide:
- Color swatches with hex/rgb
- Typography specimens
- Spacing visualization
- Component playground
- Theme switcher
- Code examples
```

## Advanced Features

### 🔄 **Version Management**
Track design system evolution:
```
/earth:design version --bump minor

Design System v1.2.0:
- Added: 3 new color tokens
- Modified: Button padding scale
- Deprecated: .btn-oldstyle class
- Migration: Automated for 90% of changes
```

### 🌍 **Multi-Theme Support**
```
/earth:design theme create dark

Generated dark theme:
- Inverted color scale
- Adjusted contrast ratios
- Modified shadows
- Preserved accessibility
```

### 📊 **Analytics Integration**
```
/earth:design analytics

Token Usage Stats:
- Most used: primary color (342 times)
- Least used: spacing.7 (2 times)
- Unused tokens: 4 (consider removing)
- Component adoption: 87%
```

## Example Workflows

### Extracting from Existing Project
```
User: /earth:design extract ./src

🎨 Analyzing design patterns...

Extracted Design System:

Colors: 24 tokens from 89 unique values
- Clustered similar colors
- Created semantic names
- Identified brand colors

Typography: 6 text styles
- Heading levels 1-4
- Body text (2 variants)
- Caption and overline

Spacing: 8-point grid system
- Detected from 134 measurements
- Suggested standard scale

Components: 18 patterns
- Button (4 variants)
- Card (3 types)
- Form elements (6)
- Navigation (2)

✅ Design system extracted to:
./design-system/

Next steps:
1. Review token names
2. Audit edge cases
3. Generate theme file
```

### Building New Design System
```
User: /earth:design create --name "Atlas" --framework react

🎨 Creating Atlas Design System...

Scaffolding structure...
✅ Created token system
✅ Set up theme provider
✅ Generated primitives
✅ Added Storybook config
✅ Created documentation

Starter components:
- Box (layout primitive)
- Text (typography)
- Button (3 variants)
- Input (form primitive)
- Card (content container)

Features included:
- TypeScript definitions
- Theme switching
- CSS-in-JS setup
- a11y compliance
- Responsive helpers

Run 'npm run storybook' to explore!
```

### Migrating to Design System
```
User: /earth:design migrate ./src/components

🔄 Migrating to design system...

Analysis:
- 47 components to migrate
- 234 hardcoded values
- 18 custom styles

Migration Plan:
Phase 1: Colors (auto)
- Replace hex → tokens ✅
- Update rgba → opacity utils ✅

Phase 2: Spacing (assisted)
- Convert px → spacing scale
- Need review: 12 edge cases

Phase 3: Components (manual)
- Update to system components
- Preserve custom behavior

✅ Automated: 67% of changes
⚠️ Review needed: 28 files
📋 Generated migration guide
```

## Integration Features

### 🤝 **Tool Chain**
- **Figma Plugin** - Sync tokens
- **VS Code Extension** - IntelliSense
- **Storybook Addon** - Live preview
- **CI/CD Checks** - Consistency validation

### 🔗 **Framework Support**
- **React** - ThemeProvider setup
- **Vue** - Composition API
- **CSS Variables** - Runtime theming
- **Sass/Less** - Preprocessor variables

### 📱 **Platform Tokens**
- **Web** - CSS/JS tokens
- **iOS** - Swift colors/fonts
- **Android** - XML resources
- **React Native** - Cross-platform

## Best Practices

### 🎯 **Token Naming**
- Semantic over descriptive
- Scalable naming system
- Clear hierarchy
- Platform agnostic

### 🔄 **Versioning**
- Semantic versioning
- Breaking change docs
- Migration scripts
- Deprecation warnings

### 📊 **Adoption Tracking**
- Component usage stats
- Token analytics
- Consistency scores
- Team feedback

Ready to build a world-class design system? Let's create consistency across your entire product! 🚀