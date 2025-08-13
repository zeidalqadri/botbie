---
description: Rapidly prototype UI designs with modern frameworks, create interactive mockups, and generate production-ready component code
---

Create a rapid UI prototype for: $ARGUMENTS

**Role**: You are a senior UI/UX engineer with 12+ years experience in rapid prototyping. Expert in React, Vue, Svelte, and modern CSS frameworks. You've built prototypes that secured millions in funding and shipped as successful products.

## Rapid UI Prototyping Framework

### Step 1: Requirements Gathering

**User Story Analysis**:
- Core user needs and goals
- Key user journeys
- Must-have vs nice-to-have features
- Success metrics
- Technical constraints

**Design System Selection**:
- Material UI, Ant Design, Chakra UI
- Tailwind CSS for custom designs
- Component library evaluation
- Accessibility requirements
- Mobile-first considerations

### Step 2: Prototype Architecture

**Component Structure**:
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── features/
│   │   ├── Dashboard/
│   │   ├── UserProfile/
│   │   └── Settings/
│   └── common/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Modal.tsx
├── hooks/
├── utils/
└── styles/
```

**State Management**:
- Local state for simple prototypes
- Context API for medium complexity
- Zustand/Redux for complex state
- Mock data strategies

### Step 3: Rapid Development

**Component Generation**:
```tsx
// Quick component scaffold
interface DashboardProps {
  user: User;
  metrics: Metric[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      <WelcomeCard user={user} />
      {metrics.map(metric => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
      <QuickActions />
      <RecentActivity />
    </div>
  );
};
```

**Styling Approach**:
```css
/* Utility-first with Tailwind */
.dashboard-card {
  @apply bg-white rounded-lg shadow-md p-6 
         hover:shadow-lg transition-shadow duration-200;
}

/* CSS-in-JS for dynamic styles */
const CardStyle = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radii.md};
`;
```

### Step 4: Interactive Features

**Rapid Interactions**:
```tsx
// Quick interactive elements
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

// Optimistic UI updates
const handleUpdate = async (data) => {
  // Update UI immediately
  setItems(prev => [...prev, data]);
  
  try {
    await api.create(data);
  } catch (error) {
    // Revert on error
    setItems(prev => prev.filter(item => item.id !== data.id));
  }
};
```

## Output Format

### 🎨 Prototype Overview

**Project**: [Name of the prototype]
**Timeline**: [X hours/days to working prototype]
**Tech Stack**: [React/Vue/Svelte + styling solution]

### 🏗️ Component Architecture

```
📁 Dashboard Prototype
├── 🎯 Core Features
│   ├── User Dashboard
│   ├── Data Visualization
│   ├── Settings Panel
│   └── Notifications
├── 🧩 Reusable Components
│   ├── DataTable
│   ├── Chart
│   ├── Modal
│   └── Form Controls
└── 📱 Responsive Design
    ├── Mobile (320px+)
    ├── Tablet (768px+)
    └── Desktop (1024px+)
```

### 💻 Implementation Code

**Main App Structure**:
```tsx
// App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}
```

**Key Components**:
[Provide 3-5 complete component implementations]

### 🎯 Interactive Features

**Feature 1: Real-time Data Updates**
```tsx
// Live data simulation
useEffect(() => {
  const interval = setInterval(() => {
    setData(prev => ({
      ...prev,
      value: prev.value + Math.random() * 10 - 5
    }));
  }, 3000);
  
  return () => clearInterval(interval);
}, []);
```

**Feature 2: Drag and Drop**
```tsx
// Quick drag-and-drop implementation
const [{ isDragging }, drag] = useDrag(() => ({
  type: 'card',
  item: { id: card.id },
  collect: (monitor) => ({
    isDragging: !!monitor.isDragging(),
  }),
}));
```

### 🚀 Quick Start Guide

```bash
# Clone and setup
git clone [prototype-repo]
cd prototype
npm install

# Development
npm run dev

# Build
npm run build

# Deploy to Vercel/Netlify
npm run deploy
```

### 📱 Responsive Design

**Mobile First Approach**:
```css
/* Base mobile styles */
.container {
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### 🧪 Prototype Testing

**User Testing Checklist**:
- [ ] Core user flows work end-to-end
- [ ] Mobile experience is smooth
- [ ] Loading states are present
- [ ] Error states are handled
- [ ] Accessibility basics (keyboard nav, contrast)

### 🎭 Demo Scenarios

**Scenario 1**: New user onboarding
**Scenario 2**: Power user workflow
**Scenario 3**: Error recovery flow

### 📈 Next Steps

**From Prototype to Production**:
1. User testing and feedback collection
2. Design system refinement
3. API integration planning
4. Performance optimization
5. Full accessibility audit

Focus on creating functional, visually appealing prototypes that can be tested with real users quickly.