# Sketchie UI Agent Demonstration

## 1. Design to Code Transformation

Let's create a simple login form from a text description:

### Input:
"Create a login form with email and password fields, a remember me checkbox, and a submit button. Make it accessible and styled with a modern design."

### Expected Output:
- TypeScript React component with full type safety
- Styled-components for modern styling  
- WCAG AA accessibility compliance
- Form validation hooks
- Responsive design

## 2. UI Component Analysis

Analyze existing components for:
- Accessibility issues (missing ARIA labels, color contrast)
- Performance bottlenecks (large bundle sizes, re-renders)
- Design pattern detection (repeated structures)
- TypeScript best practices

## 3. Design System Extraction

From a codebase, extract:
- Color tokens (primary, secondary, neutrals)
- Typography scale (font sizes, weights, line heights)
- Spacing system (4px, 8px, 16px grid)
- Component patterns (buttons, cards, forms)

## 4. Component Refactoring

Transform legacy components:
- Class components → Functional components with hooks
- JavaScript → TypeScript with interfaces
- Inline styles → Styled-components
- Add accessibility attributes
- Optimize bundle size

## 5. Cross-Agent Collaboration

Sketchie works with:
- **Botbie**: Ensures generated components follow quality standards
- **DebugEarth**: Helps debug UI rendering issues
- **Learning Engine**: Learns team's UI patterns and preferences

## Claude Code Commands

### /earth:sketch
Transform any design (image, Figma, text) into production-ready TypeScript components.

### /earth:ui
Analyze existing UI components for quality, accessibility, and performance.

### /earth:component
Create new components or refactor existing ones with best practices.

### /earth:design
Extract and manage design systems from your codebase.

## Example Workflow

1. **Design Input**: `/earth:sketch "Create a pricing card component"`
2. **Quality Check**: `/earth:analyze ./PricingCard.tsx`
3. **Accessibility Fix**: `/earth:fix accessibility`
4. **Performance Optimize**: `/earth:ui ./PricingCard.tsx --focus performance`
5. **Design Tokens**: `/earth:design extract`

The result is a fully accessible, performant, and maintainable component that follows your team's design system!