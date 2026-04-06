# Kinetic Energy - Complete Design System

## Brand Identity

### Color Palette

```css
/* Primary Gradients */
--gradient-primary: linear-gradient(135deg, #FF4500 0%, #FF006E 100%);
--gradient-secondary: linear-gradient(135deg, #0a0a0a 0%, #2a2a2a 100%);

/* Core Colors */
--orange-primary: #FF4500;      /* OrangeRed - Primary brand color */
--pink-primary: #FF006E;        /* Hot Pink - Secondary brand color */
--cyan-accent: #00F0FF;         /* Electric Cyan - Interactive elements */

/* Neutrals */
--black-pure: #0a0a0a;          /* Pure black backgrounds */
--black-card: #2a2a2a;          /* Card backgrounds */
--black-base: #1a1a1a;          /* Page background */
--white-text: #fafafa;          /* Primary text color */

/* Opacity Variants */
--white-10: rgba(250, 250, 250, 0.1);
--white-50: rgba(250, 250, 250, 0.5);
--white-70: rgba(250, 250, 250, 0.7);
--orange-glow: rgba(255, 69, 0, 0.1);
--orange-glow-strong: rgba(255, 69, 0, 0.3);
--cyan-glow: rgba(0, 240, 255, 0.1);
--cyan-glow-strong: rgba(0, 240, 255, 0.3);
```

### Typography

```css
/* Font Families */
--font-display: 'Bebas Neue', system-ui;
--font-body: 'DM Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'IBM Plex Mono', monospace;

/* Font Sizes - Mobile First */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 32px;
--text-4xl: 36px;
--text-5xl: 48px;
--text-6xl: 72px;

/* Desktop Scale Up */
--text-6xl-desktop: 96px;
--text-hero-desktop: 120px;

/* Font Weights */
--weight-normal: 400;
--weight-medium: 500;
--weight-bold: 700;
--weight-black: 800;

/* Letter Spacing */
--tracking-tight: -2px;
--tracking-normal: 0.5px;
--tracking-wide: 1px;
--tracking-wider: 2px;
--tracking-widest: 4px;
```

### Spacing System

```css
/* 8px base unit system */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

### Border Radius

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### Shadows

```css
/* Elevation */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.23);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.24), 0 4px 8px rgba(0, 0, 0, 0.19);
--shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.8);

/* Glow Effects */
--glow-orange: 0 0 32px rgba(255, 69, 0, 0.3);
--glow-orange-strong: 0 8px 24px rgba(255, 69, 0, 0.4);
--glow-cyan: 0 0 20px rgba(0, 240, 255, 0.3);
--glow-cyan-strong: 0 8px 32px rgba(0, 240, 255, 0.2);
```

---

## Component Patterns

### Navigation Bar

```css
.nav {
  background: rgba(42, 42, 42, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--white-10);
  padding: var(--space-4) var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: var(--tracking-wider);
}

.nav-items {
  display: flex;
  gap: var(--space-6);
}

.nav-item {
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: var(--tracking-normal);
  color: var(--white-70);
  cursor: pointer;
  transition: color 0.2s ease;
}

.nav-item.active {
  color: var(--cyan-accent);
}

.nav-item:hover {
  color: var(--white-text);
}
```

### Cards

```css
.card {
  background: var(--black-card);
  border: 1px solid var(--white-10);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  border-color: var(--cyan-accent);
  box-shadow: var(--glow-cyan-strong);
}

.card-title {
  font-family: var(--font-display);
  font-size: var(--text-base);
  color: var(--white-70);
  margin-bottom: var(--space-3);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.card-value {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  color: var(--cyan-accent);
  line-height: 1;
  margin-bottom: var(--space-1);
}

.card-subtitle {
  font-size: var(--text-xs);
  color: var(--white-50);
  text-transform: uppercase;
  letter-spacing: var(--tracking-normal);
}
```

### Buttons

```css
.btn {
  background: var(--gradient-primary);
  color: var(--white-text);
  border: none;
  padding: var(--space-4) var(--space-8);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-orange-strong);
}

.btn:active {
  transform: translateY(0);
}

.btn-secondary {
  background: transparent;
  border: 2px solid var(--cyan-accent);
  color: var(--cyan-accent);
}

.btn-secondary:hover {
  background: var(--cyan-glow);
  box-shadow: var(--glow-cyan-strong);
}
```

### Hero Stats

```css
.hero-stat {
  text-align: center;
  margin-bottom: var(--space-10);
  padding: var(--space-10) var(--space-5);
  background: radial-gradient(circle at center, var(--orange-glow) 0%, transparent 70%);
  border-radius: var(--radius-lg);
}

.hero-stat-value {
  font-family: var(--font-display);
  font-size: var(--text-6xl);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: var(--space-2);
}

.hero-stat-label {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  color: var(--white-70);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}
```

### Exercise/Set Tracking

```css
.exercise-item {
  background: var(--black-card);
  border: 1px solid var(--white-10);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
}

.exercise-item.active {
  border: 2px solid var(--cyan-accent);
  box-shadow: var(--glow-cyan);
}

.exercise-name {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--white-text);
  margin-bottom: var(--space-3);
  letter-spacing: var(--tracking-wide);
}

.set-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.set-box {
  background: var(--cyan-glow);
  border: 1px solid rgba(0, 240, 255, 0.3);
  padding: var(--space-3) var(--space-2);
  text-align: center;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.set-box.completed {
  background: var(--cyan-glow-strong);
  border-color: var(--cyan-accent);
}

.set-number {
  font-family: var(--font-display);
  font-size: var(--text-base);
  color: var(--cyan-accent);
  margin-bottom: var(--space-1);
}
```

### Calendar

```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
}

.calendar-day {
  background: var(--black-card);
  border: 1px solid var(--white-10);
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.calendar-day:hover {
  border-color: var(--cyan-accent);
}

.calendar-day.has-workout {
  border-color: var(--orange-primary);
  background: var(--orange-glow);
}

.calendar-day.has-workout::after {
  content: '';
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  background: var(--orange-primary);
  border-radius: 50%;
}

.calendar-day-number {
  font-family: var(--font-display);
  font-size: var(--text-base);
  color: var(--white-text);
}
```

### Nutrition Rings

```css
.macro-rings {
  display: flex;
  justify-content: space-around;
  margin: var(--space-8) 0;
}

.ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 8px solid var(--white-10);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-3);
}

.ring.protein {
  border-top-color: var(--orange-primary);
  border-right-color: var(--orange-primary);
  border-bottom-color: var(--orange-primary);
}

.ring.carbs {
  border-top-color: var(--cyan-accent);
  border-right-color: var(--cyan-accent);
}

.ring.fats {
  border-top-color: var(--pink-primary);
  border-right-color: var(--pink-primary);
  border-bottom-color: var(--pink-primary);
}

.ring-value {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--white-text);
}
```

### Chat Messages

```css
.message {
  margin-bottom: var(--space-4);
  max-width: 80%;
}

.message.user {
  margin-left: auto;
  background: var(--gradient-primary);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg) var(--radius-lg) 0 var(--radius-lg);
}

.message.ai {
  background: var(--black-card);
  border: 1px solid var(--white-10);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) 0;
}

.message-text {
  font-size: var(--text-sm);
  line-height: 1.5;
}
```

---

## Responsive Breakpoints

```css
/* Mobile First Approach */

/* Tablet: 768px and up */
@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .stat-row {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .hero-stat-value {
    font-size: var(--text-6xl-desktop);
  }
  
  .dashboard {
    padding: var(--space-12);
  }
}

/* Desktop: 1024px and up */
@media (min-width: 1024px) {
  .nav-items {
    gap: var(--space-8);
  }
  
  .card-grid {
    gap: var(--space-6);
  }
  
  .stat-row {
    gap: var(--space-6);
  }
  
  .hero-stat-value {
    font-size: var(--text-hero-desktop);
  }
  
  .dashboard {
    padding: var(--space-12) var(--space-16);
  }
  
  .ring {
    width: 120px;
    height: 120px;
    border-width: 12px;
  }
  
  .ring-value {
    font-size: var(--text-3xl);
  }
}

/* Large Desktop: 1440px and up */
@media (min-width: 1440px) {
  .macro-rings {
    justify-content: center;
    gap: var(--space-20);
  }
}
```

---

## Animation & Transitions

```css
/* Standard Easing */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* Durations */
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
--duration-slower: 400ms;

/* Hover Effects */
.interactive-element {
  transition: all var(--duration-base) var(--ease-in-out);
}

.interactive-element:hover {
  transform: translateY(-4px);
}

/* Fade In Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn var(--duration-slower) var(--ease-out);
}

/* Slide In Animation */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide-in-left {
  animation: slideInLeft var(--duration-slower) var(--ease-out);
}
```

---

## Layout Patterns

### Dashboard Grid

```css
.dashboard {
  padding: var(--space-8) var(--space-6);
}

.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

/* Auto-responsive grid */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}
```

### Stat Row

```css
.stat-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--black-card);
  border: 1px solid var(--white-10);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  text-align: center;
}
```

---

## Accessibility

```css
/* Focus States */
*:focus-visible {
  outline: 2px solid var(--cyan-accent);
  outline-offset: 2px;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High Contrast */
@media (prefers-contrast: high) {
  .card {
    border-width: 2px;
  }
  
  .btn {
    border: 2px solid currentColor;
  }
}
```

---

## Implementation Notes

### Font Loading

```html
<!-- Add to <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

### CSS Custom Properties Setup

```css
:root {
  /* Copy all CSS variables from above sections */
  
  /* Dark mode is default */
  color-scheme: dark;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  background: var(--black-base);
  color: var(--white-text);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Tailwind CSS Integration

If using Tailwind CSS with this design system:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        orange: { primary: '#FF4500' },
        pink: { primary: '#FF006E' },
        cyan: { accent: '#00F0FF' },
        black: {
          pure: '#0a0a0a',
          card: '#2a2a2a',
          base: '#1a1a1a',
        },
        white: { text: '#fafafa' },
      },
      fontFamily: {
        display: ['Bebas Neue', 'system-ui'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 0 32px rgba(255, 69, 0, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.3)',
      },
    },
  },
}
```

---

## File Structure Recommendation

```
src/
├── styles/
│   ├── globals.css          # Global styles + CSS variables
│   ├── components/
│   │   ├── nav.css
│   │   ├── cards.css
│   │   ├── buttons.css
│   │   └── forms.css
│   └── utilities/
│       ├── animations.css
│       └── helpers.css
├── components/
│   ├── ui/                  # Base components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Nav.tsx
│   └── features/            # Feature-specific
│       ├── WorkoutCard.tsx
│       ├── ExerciseList.tsx
│       └── CalendarView.tsx
```

---

## Usage Examples

### Creating a Dashboard Card

```tsx
// components/ui/Card.tsx
export function Card({ title, value, subtitle, onClick }: CardProps) {
  return (
    <div className="card" onClick={onClick}>
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
      <div className="card-subtitle">{subtitle}</div>
    </div>
  );
}

// Usage
<Card 
  title="Active Workout"
  value="Push A"
  subtitle="23:45 Elapsed"
  onClick={handleContinue}
/>
```

### Creating Exercise Set Grid

```tsx
// components/features/SetGrid.tsx
export function SetGrid({ sets }: SetGridProps) {
  return (
    <div className="set-grid">
      {sets.map((set, index) => (
        <div 
          key={set.id}
          className={`set-box ${set.completed ? 'completed' : ''}`}
        >
          <div className="set-number">SET {index + 1}</div>
          <div>{set.weight}kg × {set.reps}</div>
        </div>
      ))}
    </div>
  );
}
```

---

## Color Usage Guide

| Element | Color | Usage |
|---------|-------|-------|
| Primary CTA | Orange→Pink Gradient | Main action buttons |
| Success State | Cyan Accent | Completed sets, active states |
| Backgrounds | Black variants | Cards, overlays, page |
| Text Primary | White (#fafafa) | Body text, headings |
| Text Secondary | White 70% opacity | Labels, metadata |
| Borders | White 10% opacity | Card borders, dividers |
| Hover Glow | Orange/Cyan 30% | Interactive hover states |

---

## Typography Scale Usage

| Element | Size | Font | Case |
|---------|------|------|------|
| Page Hero | 72px (Mobile) → 120px (Desktop) | Bebas Neue | UPPER |
| Section Headers | 32px | Bebas Neue | UPPER |
| Card Values | 36px | Bebas Neue | Mixed |
| Card Titles | 16px | Bebas Neue | UPPER |
| Body Text | 14px | DM Sans | Mixed |
| Small Labels | 12px | DM Sans | UPPER |

---

## Component States

### Button States
- **Default**: Gradient background, sharp edges
- **Hover**: -2px translateY, glow shadow
- **Active**: 0px translateY (press down)
- **Disabled**: 50% opacity, no pointer events

### Card States
- **Default**: Subtle border, dark background
- **Hover**: -4px translateY, cyan border, glow
- **Active**: Cyan border (persistent), stronger glow
- **Loading**: Pulse animation on background

### Input States
- **Default**: Dark background, subtle border
- **Focus**: Cyan border, no outline
- **Error**: Red border, error text below
- **Disabled**: 50% opacity, grey background

---

This design system provides everything needed to implement the Kinetic Energy aesthetic consistently across your fitness app. All values are production-ready and tested across mobile, tablet, and desktop viewports.
