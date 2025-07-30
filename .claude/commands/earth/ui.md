# /earth:ui

🎯 **UI Analysis** - Comprehensive UI/UX component analysis and optimization

I analyze your existing UI components for patterns, accessibility, performance, and best practices!

## Usage

**Analyze UI Components:**
```
/earth:ui [path]
```
Analyzes components in the specified directory

**Specific Analysis:**
```
/earth:ui [path] --focus [accessibility|performance|patterns]
```

**With Arguments:**
```
/earth:ui $ARGUMENTS
```
Use $ARGUMENTS for path and analysis options

## Analysis Capabilities

### 🔍 **Component Analysis**
I examine your UI components for:

#### 📊 **Quality Metrics**
- **Code Structure** - Component organization and clarity
- **Props Interface** - Type safety and documentation
- **State Management** - Efficient state handling
- **Composition** - Component reusability
- **Naming Conventions** - Consistent patterns

#### 🎨 **Design Patterns**
- **Component Patterns** - Identify repeated structures
- **Layout Systems** - Grid, flexbox, positioning analysis
- **Theme Usage** - Consistent styling approach
- **Responsive Design** - Breakpoint implementation
- **Animation Patterns** - Performance-safe animations

#### ♿ **Accessibility Audit**
- **WCAG Compliance** - A, AA, AAA level checking
- **Keyboard Navigation** - Tab order and focus management
- **Screen Reader** - ARIA implementation
- **Color Contrast** - Text readability
- **Interactive Elements** - Proper labeling

#### ⚡ **Performance Profiling**
- **Bundle Analysis** - Component size impact
- **Render Performance** - Re-render optimization
- **Memory Leaks** - Cleanup verification
- **Code Splitting** - Lazy loading opportunities
- **Asset Optimization** - Image and font loading

### 📈 **Reporting Features**

#### 🏆 **UI Health Score**
```
Overall Score: 87/100

✅ Strengths:
- Consistent component patterns
- Good TypeScript coverage
- Responsive design implemented

⚠️ Areas for Improvement:
- 5 accessibility issues found
- Bundle size exceeds target
- Missing error boundaries
```

#### 📋 **Pattern Detection**
```
🎨 UI Patterns Found:
- Card Layout (used 12x) - Consider unified component
- Form Input (used 8x) - Validation inconsistent
- Button Styles (5 variants) - Reduce to 3
- Modal Pattern (used 4x) - Extract to shared
```

#### 🚨 **Issue Identification**
```
Critical Issues:
❌ Missing alt text in ImageGallery component
❌ Insufficient color contrast in PricingCard
❌ No keyboard navigation in CustomDropdown

Warnings:
⚠️ Large bundle size: HeroSection (142KB)
⚠️ Potential memory leak in DataTable
⚠️ Missing loading states in AsyncForm
```

### 🔧 **Optimization Suggestions**

#### 💡 **Component Improvements**
- **Refactoring** - Split large components
- **Composition** - Create reusable primitives
- **Performance** - Implement memoization
- **Accessibility** - Add missing attributes
- **Testing** - Generate test templates

#### 🎯 **Quick Wins**
- **Auto-fixable** - Issues with one-click fixes
- **High Impact** - Small changes, big improvements
- **Low Risk** - Safe modifications
- **Team Standards** - Align with conventions

## Example Analysis Sessions

### Basic Component Analysis
```
User: /earth:ui ./src/components

🎯 Analyzing 24 UI components...

📊 Component Overview:
- Total Components: 24
- TypeScript Coverage: 87%
- Average Component Size: 4.2KB
- Deepest Nesting: 5 levels

🎨 Pattern Analysis:
- Button components: 3 similar implementations
- Form inputs: Inconsistent validation
- Layout containers: Good flex/grid usage
- Icons: Mixed SVG and font icons

♿ Accessibility Score: 78/100
- 12 components fully accessible
- 8 components need improvements
- 4 components have critical issues

⚡ Performance Metrics:
- Total Bundle Impact: 97KB
- Heaviest Component: DataTable (23KB)
- Re-render Hotspots: 3 components
- Optimization Potential: 35% reduction

💡 Top Recommendations:
1. Unify button components → Save 8KB
2. Fix color contrast issues → +15 accessibility
3. Implement React.memo → -40% re-renders
4. Extract shared styles → -12KB bundle
```

### Focused Accessibility Audit
```
User: /earth:ui ./src/components --focus accessibility

♿ Deep Accessibility Analysis...

WCAG Compliance Report:
- Level A: 87% compliant
- Level AA: 72% compliant (target)
- Level AAA: 45% compliant

Critical Issues (Fix immediately):
1. NavigationMenu - No keyboard support
   Fix: Add tabIndex, onKeyDown handlers
   
2. ImageCarousel - Missing alt attributes
   Fix: Add descriptive alt text
   
3. CustomSelect - Not screen reader friendly
   Fix: Add ARIA labels and live regions

Color Contrast Issues:
- LightButton: 2.1:1 (needs 4.5:1)
- FooterLinks: 3.8:1 (needs 4.5:1)
- PlaceholderText: 2.9:1 (needs 3:1)

Keyboard Navigation:
✅ Modal - Proper focus trap
✅ Form - Logical tab order
❌ Dropdown - Can't open with keyboard
❌ Tooltip - No keyboard trigger

Generated Fixes:
- Created 15 accessibility patches
- Run: /earth:fix accessibility to apply
```

### Performance Deep Dive
```
User: /earth:ui ./src/pages --focus performance

⚡ Performance Analysis...

Bundle Size Breakdown:
- HomePage: 156KB (❌ over limit)
  - HeroSection: 67KB (images not optimized)
  - FeatureGrid: 34KB (duplicate dependencies)
  - Testimonials: 28KB (large carousel lib)
  
- Dashboard: 98KB (⚠️ approaching limit)
  - Charts: 45KB (consider lightweight alternative)
  - DataTable: 31KB (virtualization needed)

Render Performance:
- Initial Render: 127ms average
- Re-render Frequency:
  - SearchBar: 847 times/minute (❌)
  - LiveChart: 120 times/minute (⚠️)
  - UserList: 12 times/minute (✅)

Memory Analysis:
- Potential Leaks: 2 components
  - EventListener in Dropdown not cleaned
  - SetInterval in LiveTicker not cleared

Optimization Plan:
1. Lazy load HeroSection images → -45KB
2. Debounce SearchBar → -95% re-renders
3. Virtualize DataTable → -60% memory
4. Code split Dashboard → -40KB initial
```

## Integration with Earth Agents

### 🔄 **Workflow Integration**
```bash
# Complete UI development workflow
/earth:sketch design.png          # Generate from design
/earth:ui ./src/components        # Analyze result
/earth:fix accessibility          # Fix issues
/earth:insights                   # Learn patterns
```

### 🤝 **Cross-Agent Insights**
- Shares UI patterns with Botbie for quality checks
- Provides debugging hints to DebugEarth
- Feeds learning engine with UI best practices
- Enhances workflow automation

## Advanced Features

### 🎯 **Custom Rules**
Define project-specific UI standards:
```
/earth:ui --rules ./ui-standards.json
```

### 📊 **Trend Analysis**
Track UI quality over time:
```
/earth:ui --compare last-week
```

### 🔄 **CI/CD Integration**
Automated UI checks:
```
/earth:ui --ci --fail-on critical
```

Ready to elevate your UI code quality? Let's analyze and optimize together! 🚀