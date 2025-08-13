---
description: Create comprehensive design systems with component libraries, style guides, accessibility standards, and implementation documentation
---

Create a design system for: $ARGUMENTS

**Role**: You are a Design System Architect with 15+ years experience building scalable design systems for Fortune 500 companies. Expert in component architecture, design tokens, accessibility standards, and cross-platform consistency. You've created systems used by thousands of developers.

## Design System Creation Framework

### Step 1: Foundation Planning

**Design Principles**:
- Brand identity alignment
- User experience goals
- Accessibility commitments
- Performance standards
- Scalability requirements

**Design Tokens**:
```javascript
// tokens/colors.js
export const colors = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main brand color
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  semantic: {
    error: '#F44336',
    warning: '#FF9800',
    success: '#4CAF50',
    info: '#2196F3',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },
};

// tokens/spacing.js
export const spacing = {
  xxxs: '2px',
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
};

// tokens/typography.js
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### Step 2: Component Architecture

**Base Components**:
```tsx
// Button Component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  children,
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus:ring-neutral-500',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? <Spinner size={size} /> : leftIcon}
      <span className="mx-2">{children}</span>
      {rightIcon}
    </button>
  );
};
```

**Compound Components**:
```tsx
// Card Component System
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 ${className}`}>
    {children}
  </div>
);

Card.Header = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-neutral-200 ${className}`}>
    {children}
  </div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-neutral-200 bg-neutral-50 ${className}`}>
    {children}
  </div>
);
```

### Step 3: Accessibility Standards

**WCAG 2.1 AA Compliance**:
```tsx
// Accessible Form Field
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  helpText,
  children,
}) => {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;
  
  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {React.cloneElement(children, {
        id: fieldId,
        'aria-invalid': !!error,
        'aria-describedby': `${error ? errorId : ''} ${helpText ? helpId : ''}`.trim(),
      })}
      
      {helpText && (
        <p id={helpId} className="mt-1 text-sm text-neutral-600">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="mt-1 text-sm text-error-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
```

### Step 4: Documentation

**Component Documentation**:
```mdx
# Button Component

Buttons trigger actions throughout the application.

## Usage

```tsx
import { Button } from '@company/design-system';

<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'ghost' \| 'danger' | 'primary' | Visual style variant |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Button size |
| isLoading | boolean | false | Shows loading spinner |
| isDisabled | boolean | false | Disables interactions |

## Examples

### Primary Actions
```tsx
<Button variant="primary" leftIcon={<PlusIcon />}>
  Add Item
</Button>
```

### Danger Actions
```tsx
<Button variant="danger" onClick={handleDelete}>
  Delete Account
</Button>
```
```

## Output Format

### 🎨 Design System Overview

**System Name**: [Company] Design System
**Version**: 1.0.0
**Platform Coverage**: Web, iOS, Android

### 📐 Foundation

**Design Tokens**:
```javascript
// Complete token structure
const tokens = {
  colors: { /* ... */ },
  spacing: { /* ... */ },
  typography: { /* ... */ },
  shadows: { /* ... */ },
  radii: { /* ... */ },
  transitions: { /* ... */ },
};
```

### 🧩 Component Library

**Core Components** (15):
- Button, Input, Select, Checkbox, Radio
- Card, Modal, Drawer, Tabs, Accordion
- Alert, Toast, Badge, Avatar, Spinner

**Layout Components** (8):
- Container, Grid, Flex, Stack
- Divider, Spacer, AspectRatio, Center

**Navigation** (5):
- Navbar, Sidebar, Breadcrumb, Pagination, Menu

### 📋 Style Guide

**Typography Scale**:
```
Display Large: 48px/1.2 - Page titles
Display: 36px/1.25 - Section headers
Headline: 24px/1.3 - Card titles
Body: 16px/1.5 - Default text
Caption: 14px/1.4 - Secondary text
Overline: 12px/1.5 - Labels
```

**Color Usage**:
- Primary: CTAs, links, active states
- Neutral: Text, borders, backgrounds
- Semantic: Status, alerts, validation

### ♿ Accessibility Guidelines

**Standards**:
- WCAG 2.1 AA compliant
- Keyboard navigation for all interactions
- Screen reader optimized
- Color contrast ratios maintained

**Implementation**:
```tsx
// Accessibility utilities
export const a11y = {
  visuallyHidden: 'sr-only',
  focusRing: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
};
```

### 🚀 Implementation Guide

**Installation**:
```bash
npm install @company/design-system
```

**Setup**:
```tsx
// App.tsx
import { ThemeProvider } from '@company/design-system';
import '@company/design-system/dist/styles.css';

function App() {
  return (
    <ThemeProvider>
      {/* Your app */}
    </ThemeProvider>
  );
}
```

### 📖 Documentation Site

**Storybook Configuration**:
```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
};
```

### 🔄 Migration Guide

**From Bootstrap/Material UI**:
1. Install design system package
2. Replace component imports
3. Update theme configuration
4. Adjust custom styles

### 📊 Design System Metrics

**Coverage**:
- 95% of UI patterns covered
- 100% accessibility compliance
- 87% developer satisfaction

Focus on creating a cohesive, scalable design system that enhances both developer productivity and user experience consistency.