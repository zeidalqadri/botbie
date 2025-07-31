# /earth:component

🧩 **Component Operations** - Create, refactor, and optimize UI components

I help you create new components, refactor existing ones, and maintain a clean component architecture!

## Usage

**Create New Component:**
```
/earth:component create [name] --type [type]
```

**Refactor Existing:**
```
/earth:component refactor [path]
```

**Extract Component:**
```
/earth:component extract [source-file] [selection]
```

**With Arguments:**
```
/earth:component $ARGUMENTS
```
Use $ARGUMENTS for component operations

## Component Operations

### 🆕 **Create Component**
Generate new components with best practices:

#### Component Types
- **Atom** - Basic building blocks (Button, Input, Label)
- **Molecule** - Combinations (FormField, SearchBar, Card)
- **Organism** - Complex sections (Header, ProductList, Form)
- **Template** - Page layouts (DashboardLayout, AuthLayout)
- **Page** - Full pages (HomePage, ProfilePage)

#### Creation Options
```
/earth:component create Button --type atom --variant "primary,secondary,ghost"

Generated:
- Button.tsx (component with variants)
- Button.styles.ts (styled-components)
- Button.types.ts (TypeScript interfaces)
- Button.test.tsx (unit tests)
- Button.stories.tsx (Storybook)
- index.ts (barrel export)
```

### 🔄 **Refactor Component**
Improve existing components:

#### Refactoring Types
- **Split Component** - Break into smaller pieces
- **Extract Hooks** - Separate logic from UI
- **Optimize Performance** - Add memoization
- **Improve Types** - Enhance TypeScript
- **Add Tests** - Generate test suite

#### Example Refactor
```
User: /earth:component refactor ./UserProfile.tsx

Analyzing UserProfile component...

Issues Found:
- Component too large (342 lines)
- Mixed concerns (UI + data fetching)
- No error boundaries
- Missing accessibility

Refactoring Plan:
1. Extract useUserData hook
2. Split into 3 sub-components
3. Add error boundary wrapper
4. Implement loading states
5. Add ARIA labels

✅ Refactored into:
- UserProfile/
  - index.tsx (main component)
  - UserAvatar.tsx
  - UserInfo.tsx  
  - UserStats.tsx
  - hooks/useUserData.ts
  - types.ts
  - styles.ts
```

### 📤 **Extract Component**
Pull code into reusable components:

#### Smart Extraction
```
User: /earth:component extract App.tsx "lines 45-89"

Analyzing selection...

Detected: Form with 3 inputs and submit button

✅ Extracted ContactForm component:
- Moved JSX to ContactForm.tsx
- Created props interface
- Extracted styles
- Added to App.tsx imports
- Maintained functionality
```

### 🏗️ **Component Architecture**

#### 📁 **Organize Structure**
```
/earth:component organize ./src/components

Suggested structure:
src/components/
├── atoms/
│   ├── Button/
│   ├── Input/
│   └── Text/
├── molecules/
│   ├── FormField/
│   ├── Card/
│   └── SearchBar/
├── organisms/
│   ├── Header/
│   ├── ProductGrid/
│   └── CheckoutForm/
├── templates/
│   ├── MainLayout/
│   └── AuthLayout/
└── pages/
    ├── HomePage/
    └── ProfilePage/
```

#### 🔗 **Dependency Analysis**
```
/earth:component deps ./Button

Button Component Dependencies:
- Direct imports: 3
  - styled-components
  - react
  - ./Button.types
  
- Used by: 14 components
  - FormField
  - Card
  - Modal
  ...
  
- Circular deps: None ✅
- Bundle impact: 2.3KB
```

## Advanced Features

### 🎨 **Component Variants**
Create flexible, themed components:

```
/earth:component create Alert --variants "success,warning,error,info"

Generates:
- Type-safe variant props
- Themed styling system
- Variant-specific icons
- Accessibility per variant
```

### 🧪 **Test Generation**
Comprehensive testing setup:

```
/earth:component test ./Button

Generated tests:
- Render tests
- Prop validation
- Event handling
- Accessibility
- Visual regression
- Interaction testing
```

### 📚 **Documentation**
Auto-generate component docs:

```
/earth:component docs ./src/components

Created:
- README per component
- Props documentation
- Usage examples
- Storybook stories
- API reference
```

## Component Examples

### Creating a Design System Component
```
User: /earth:component create Button --atomic --variants "primary,secondary" 
      --sizes "sm,md,lg" --states "loading,disabled"

🧩 Creating atomic Button component...

✅ Generated comprehensive Button:

Button.tsx:
- 3 variants × 3 sizes = 9 combinations
- Loading spinner animation
- Disabled state handling
- Keyboard navigation
- Focus styles

Button.types.ts:
- ButtonProps interface
- Variant union types
- Size constants
- State types

Button.styles.ts:
- Theme-aware styling
- CSS-in-JS with variants
- Responsive sizing
- Animation keyframes

Button.test.tsx:
- 24 test cases
- Accessibility tests
- Interaction tests
- Snapshot tests

Button.stories.tsx:
- Interactive playground
- All variant examples
- State demonstrations
- Usage guidelines
```

### Refactoring Legacy Component
```
User: /earth:component refactor ./LegacyTable.jsx

🔄 Analyzing legacy component...

Issues identified:
- No TypeScript (JSX)
- Class component (outdated)
- Inline styles (performance)
- No pagination (UX)
- No accessibility

Refactoring to modern standards...

✅ Transformed LegacyTable:
- Converted to TypeScript FC
- Implemented hooks pattern
- Extracted TableRow, TableCell
- Added virtualization
- Implemented sorting/filtering
- Added keyboard navigation
- WCAG AA compliant
- 60% smaller bundle size
```

### Component Composition
```
User: /earth:component compose "Dashboard with sidebar, header, and content area"

🧩 Composing Dashboard layout...

Creating component hierarchy:
1. DashboardLayout (template)
   - Sidebar (organism)
     - Logo (atom)
     - NavMenu (molecule)
     - UserInfo (molecule)
   - Header (organism)
     - SearchBar (molecule)
     - Notifications (molecule)
     - UserMenu (molecule)
   - ContentArea (organism)
     - Outlet for pages

✅ Generated 12 components:
- Full TypeScript support
- Responsive grid layout
- Theme context setup
- Route integration ready
- Accessibility complete
```

## Optimization Features

### ⚡ **Performance**
- React.memo wrapping
- useMemo/useCallback
- Code splitting setup
- Lazy loading config

### 🎯 **Bundle Size**
- Tree-shaking ready
- Dynamic imports
- Minimal dependencies
- Icon optimization

### 🧹 **Code Quality**
- ESLint compliance
- Prettier formatting
- Import sorting
- Dead code removal

## Integration

### 🔄 **Workflow Commands**
```bash
# Complete component workflow
/earth:sketch design.png          # Design to component
/earth:component refactor result  # Optimize generated
/earth:ui analyze ./component     # Quality check
/earth:fix                        # Auto-fix issues
```

### 🤝 **Works With**
- **Sketchie** - Design to component
- **Botbie** - Quality analysis
- **DebugEarth** - Component debugging
- **Learning** - Pattern detection

Ready to build better components? Let's create something reusable and beautiful! 🚀