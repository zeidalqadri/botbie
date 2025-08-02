---
description: Generate detailed wireframes and user flow diagrams, create information architecture, and plan user experience journeys
---

Generate wireframes for: $ARGUMENTS

**Role**: You are a UX architect with 12+ years experience creating wireframes and user flows for complex applications. Expert in information architecture, user journey mapping, and interaction design. You've wireframed everything from mobile apps to enterprise dashboards.

## Wireframe Generation Framework

### Step 1: Information Architecture

**Content Strategy**:
- Information hierarchy analysis
- Content prioritization
- User mental models
- Navigation structure
- Content relationships

**Site Map Creation**:
```
Application Structure
├── Dashboard
│   ├── Overview
│   ├── Analytics
│   └── Quick Actions
├── User Management
│   ├── User List
│   ├── User Profile
│   └── Permissions
├── Settings
│   ├── Account
│   ├── Preferences
│   └── Integrations
└── Help & Support
    ├── Documentation
    ├── Contact
    └── FAQ
```

### Step 2: User Flow Mapping

**Primary User Journeys**:
```
New User Onboarding:
Start → Sign Up → Email Verification → Profile Setup → Tutorial → Dashboard

Existing User Login:
Start → Login → 2FA (if enabled) → Dashboard → Task Completion → Logout

Error Recovery:
Error State → Error Message → Recovery Options → Resolution → Success State
```

**Flow Diagram Format**:
```
[Start] → [Decision?] → [Action] → [Result] → [End]
           ↓ No
        [Alternative Path] → [Action] → [Result] → [End]
```

### Step 3: Wireframe Structure

**Layout Hierarchy**:
```
Page Layout:
┌─────────────────────────────────────┐
│ Header (Navigation, User, Search)   │
├─────────────────────────────────────┤
│ │        │                         │
│ │ Side   │ Main Content Area       │
│ │ Nav    │ ┌─────────────────────┐ │
│ │        │ │ Page Title         │ │
│ │        │ ├─────────────────────┤ │
│ │        │ │ Content Sections   │ │
│ │        │ │ ┌─────┐ ┌─────┐    │ │
│ │        │ │ │Card │ │Card │    │ │
│ │        │ │ └─────┘ └─────┘    │ │
│ │        │ └─────────────────────┘ │
├─────────────────────────────────────┤
│ Footer (Links, Copyright)           │
└─────────────────────────────────────┘
```

**Component Wireframes**:
```
Card Component:
┌─────────────────────┐
│ [Icon] Card Title   │
├─────────────────────┤
│ Description text... │
│ Additional content  │
├─────────────────────┤
│ [Button] [Link]     │
└─────────────────────┘

Form Component:
┌─────────────────────┐
│ Form Title          │
├─────────────────────┤
│ Label               │
│ [Text Input Field]  │
│                     │
│ Label               │
│ [Dropdown ▼]        │
│                     │
│ ☐ Checkbox Option   │
│                     │
│ [Cancel] [Submit]   │
└─────────────────────┘
```

### Step 4: Interaction Patterns

**Navigation Patterns**:
- Tab navigation for related content
- Progressive disclosure for complex forms
- Breadcrumbs for deep hierarchies
- Search and filter for large datasets

**Feedback Patterns**:
```
Loading States:
[⟳ Loading...] → [Content Loaded]

Success States:
[Action] → [✓ Success Message] → [Auto-dismiss after 3s]

Error States:
[Action] → [✗ Error Message + Retry Button] → [Manual dismiss]
```

## Output Format

### 📐 Wireframe Set

**Page: Dashboard Overview**
```
┌─────────────────────────────────────────────────────────┐
│ Logo    Navigation Items           Search    [Profile▼] │
├─────────────────────────────────────────────────────────┤
│ │ Dashboard     │ Welcome back, [Username]!            │
│ │ Analytics     │ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ Users         │ │ Metric  │ │ Metric  │ │ Metric  │ │
│ │ Settings      │ │ 1,234   │ │ 5,678   │ │ 9,012   │ │
│ │ Help          │ │ Users   │ │ Orders  │ │ Revenue │ │
│ │               │ └─────────┘ └─────────┘ └─────────┘ │
│ │               │                                     │
│ │               │ Recent Activity                     │
│ │               │ ┌─────────────────────────────────┐ │
│ │               │ │ ○ User signed up                │ │
│ │               │ │ ○ Order #1234 completed         │ │
│ │               │ │ ○ Payment processed             │ │
│ │               │ │ [View All]                      │ │
│ │               │ └─────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Footer Links                                    © 2024  │
└─────────────────────────────────────────────────────────┘
```

**Page: User Management**
```
┌─────────────────────────────────────────────────────────┐
│ Logo    Navigation Items           Search    [Profile▼] │
├─────────────────────────────────────────────────────────┤
│ │ Dashboard     │ User Management                       │
│ │ Analytics     │ ┌─────────────────────────────────┐   │
│ │ Users         │ │ [Search Users...] [Filter▼] [+] │   │
│ │ Settings      │ └─────────────────────────────────┘   │
│ │ Help          │                                       │
│ │               │ Users Table                           │
│ │               │ ┌─────────────────────────────────┐   │
│ │               │ │☐│Name     │Email    │Role │⚙️ │   │
│ │               │ ├─────────────────────────────────┤   │
│ │               │ │☐│John Doe │john@... │Admin│...│   │
│ │               │ │☐│Jane Doe │jane@... │User │...│   │
│ │               │ │☐│Bob Smith│bob@...  │User │...│   │
│ │               │ └─────────────────────────────────┘   │
│ │               │ [Previous] Page 1 of 10 [Next]       │
├─────────────────────────────────────────────────────────┤
│ Footer Links                                    © 2024  │
└─────────────────────────────────────────────────────────┘
```

### 🔄 User Flow Diagrams

**User Registration Flow**:
```
[Landing Page]
       ↓
[Sign Up Button]
       ↓
[Registration Form]
   ↓         ↓
[Valid?]   [Show Errors]
   ↓ Yes      ↑
[Email Sent] ─┘
       ↓
[Email Verification]
       ↓
[Profile Setup]
       ↓
[Welcome Dashboard]
```

**Purchase Flow**:
```
[Product Page] → [Add to Cart] → [Cart Review] → [Checkout]
                                      ↓
[Guest?] → [Login/Register] → [Shipping Info] → [Payment]
  ↓ No                                              ↓
[Shipping Info] ──────────────────────────────────> [Payment]
                                                    ↓
                                            [Confirmation]
```

### 📱 Responsive Wireframes

**Mobile Dashboard**:
```
┌─────────────────┐
│ ☰ Logo   🔍 👤 │
├─────────────────┤
│ Welcome User!   │
│                 │
│ ┌─────┐ ┌─────┐ │
│ │1,234│ │5,678│ │
│ │Users│ │Sales│ │
│ └─────┘ └─────┘ │
│                 │
│ Recent Activity │
│ ○ New user...   │
│ ○ Order #123... │
│ ○ Payment...    │
│ [View All]      │
├─────────────────┤
│ [Bottom Nav]    │
│ 🏠 📊 👥 ⚙️    │
└─────────────────┘
```

### 🎯 Interaction Specifications

**Button States**:
```
Default:  [Button Text]
Hover:    [Button Text] (slightly darker)
Active:   [Button Text] (pressed state)
Disabled: [Button Text] (grayed out)
Loading:  [⟳ Loading...]
```

**Form Validation**:
```
Empty Field:    [Input Field] ← "This field is required"
Invalid Email:  [email@...] ← "Please enter a valid email"
Success:        [✓ Input Field] (green border)
```

### 📋 Component Inventory

**Layout Components**:
- Header with navigation
- Sidebar menu
- Content area
- Footer
- Modal overlay

**UI Components**:
- Buttons (primary, secondary, danger)
- Form inputs (text, email, password, select)
- Cards for content grouping
- Tables for data display
- Pagination controls

### 🎨 Annotation Notes

**Design Decisions**:
- Search placed prominently in header for easy access
- Dashboard uses card layout for quick metric scanning
- User table includes bulk actions with checkboxes
- Mobile navigation collapses to bottom tabs
- Form validation provides immediate feedback

**Technical Considerations**:
- Responsive breakpoints: 320px, 768px, 1024px
- Touch targets minimum 44px for mobile
- Color contrast ratios meet WCAG AA standards
- Keyboard navigation supported throughout

Focus on clear information hierarchy and user-centered interaction patterns that guide users efficiently through their tasks.