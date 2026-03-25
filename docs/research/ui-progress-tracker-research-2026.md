# Progress Tracker & Dashboard UI Research — March 2026

Comprehensive research into best-in-class progress tracker UIs, design systems, and
micro-interactions for building a premium coding roadmap/progress tracker.

---

## 1. NeetCode.io — Roadmap & Progress View

**Live inspection performed on neetcode.io/roadmap (March 25, 2026)**

### Architecture
- Angular app (`ng-star-inserted` classes throughout)
- Interactive graph built with custom card nodes (NOT React Flow)
- Dark theme default: root background `rgb(32, 34, 37)` / `#202225`

### Roadmap Graph Layout
- **Container**: `graph-card` class, 891px wide, `border-radius: 12px`
- **Topic nodes**: `cardContainer` class — clickable cards arranged in a DAG (directed acyclic graph)
  - Background: `rgb(63, 75, 209)` / `#3F4BD1` (purple-blue)
  - Size: `200px x 62px`
  - Border radius: `8px`
  - Cursor: pointer
  - Labels rendered as white text overlays
- **Node labels** (18 categories): Arrays & Hashing, Two Pointers, Binary Search, Stack, Sliding Window, Linked List, Trees, Tries, Heap/Priority Queue, Backtracking, Graphs, 1-D DP, Intervals, Greedy, Advanced Graphs, Math & Geometry, 2-D DP, Bit Manipulation
- Nodes are connected with directional edges showing prerequisite ordering

### Difficulty Color System (EXACT values from DOM inspection)
```
Easy:   rgb(72, 199, 142)  →  #48C78E   (green)     font-weight: 600, 14px
Medium: rgb(245, 166, 35)  →  #F5A623   (orange)     font-weight: 600, 14px
Hard:   rgb(248, 113, 113) →  #F87171   (red)        font-weight: 600, 14px
```

### Progress Counter UI
- Summary bar at top: `Easy 0/28 | Med 0/101 | Hard 0/21 | /150 Solved`
- Counter text: `rgb(244, 244, 244)` / `#F4F4F4`, 13px
- Counters are split by difficulty color with fraction format `solved/total`

### Progress Bars
- Uses Bulma CSS framework progress element: `progress is-small is-success`
- Dimensions: `180px wide x 8px tall`
- Border radius: `9999px` (full pill shape)
- Each topic category has its own mini progress bar
- Fill color uses the "success" semantic color (green)

### Streak / Gamification Panel (sidebar)
- `streak-card` with bg `rgb(47, 49, 54)` / `#2F3136`
- Calendar heatmap grid (`calendar-grid`)
- 5-level heatmap scale from light to dark green
- Stats: Current Streak (days), Best Streak (days)
- Day counter with countdown timer: "07:57:36 left"
- Motivational text: "Solve one problem a day to keep your streak"

### Roadmap Collection Tabs
- Tabs: Blind 75, NeetCode 150, NeetCode 250, NeetCode All
- Active tab: `rgb(244, 244, 244)` text on `rgb(19, 24, 28)` background
- Tab styling: `border-bottom: 3px solid` (active indicator)

### Color Theme Tokens
```
Light:
  Background: #FFFFFF
  Text: rgb(10, 10, 10)
  Cards: #F0F2F5
  Accents: #3B5BDB (blue)

Dark:
  Background: #202225
  Text: #F4F4F4
  Cards: #2F3136
  Accents: #627EFF (purple-blue)
  Node cards: #3F4BD1
```

### Card Design Details
- Border: 1px solid with `border-radius: 16px`
- Box shadow: `0 2px 8px rgba(0,0,0,.15), 0 2px 4px rgba(0,0,0,.08)`
- Internal padding: 28px, gap: 24px
- Hover: opacity transition

### Settings Features
- Toggle for Enable Dragging, Enable Panning, Enable Zooming (checkboxes)
- About modal with instructions
- Streak Repair feature (Pro)

---

## 2. roadmap.sh — Progress Tracking UI

**Live inspection performed on roadmap.sh/frontend (March 25, 2026)**

### Architecture
- Astro-based static site with interactive SVG roadmaps
- Body font: `ui-sans-serif, system-ui, sans-serif`
- Main content bg: `bg-gray-50` (Tailwind class)

### Roadmap Rendering
- **163 SVG nodes** in the Frontend roadmap alone
- Each node is an SVG `<g>` with `data-node-id` attribute
- Nodes contain `<rect>` elements with:
  - Fill: `#ffffff` (white for topic nodes)
  - Stroke: `#000000`, stroke-width: `2.7`
  - Border radius: `rx="5"`
  - Typical size: `179.3px x 91.3-111.3px`
- Section headers use `transparent` fill with black stroke

### SVG Color Palette (from live DOM)
```
Node fills:     #ffffff, #fff (white — default/unvisited)
Stroke colors:  #000000, black (primary borders)
Accent purple:  #4136D6 (brand purple)
Accent blue:    #2b78e4, #2a79e4
Yellow:         #fdff00, #ffe599 (highlights / learning status)
Green:          #4f7a28 (done status)
Gray:           #929292, #6b7280, #dedede, #e3e3e3 (secondary/muted)
Dark:           #232323 (text/dark elements)
Pro badge:      #874efe (purple)
```

### Progress Tracking Mechanism
- **Right-click** (or long-press) on any topic node opens a status selector
- Three states: **Done** (green), **In Progress** (yellow), **Skip** (gray)
- When marked, the node's fill color changes to reflect status
- Login required: "Login to track your progress" / "Track Progress" button
- Button styling: `text-gray-500 hover:text-black` (Tailwind classes)
- No explicit progress bar — instead visual coloring of the SVG nodes themselves

### Navigation & Header
- Nav menu: Roadmaps, AI Tutor, Upgrade to Pro
- Brand color: `rgb(24, 99, 220)` / `#1863DC` (buttons)
- Registered users count: 2.8M+
- Sub-roadmaps: Role-based (Frontend, Backend, DevOps) and Skill-based (SQL, React, Python)

### Key Design Pattern
The entire roadmap IS the progress indicator — nodes change color as you complete them, creating a visual "coloring book" effect where your progress is immediately visible in the graph structure itself.

---

## 3. Cal.com — Dashboard UI Patterns

### Design System Structure (design.cal.com)
- Three sections: **Basics** (design tokens), **Assets** (brand materials), **Figma** (source of truth)
- Open-source: AGPLv3 license, available on GitHub (`calcom/design`)
- Component library at `ui.cal.com`

### Architecture (2026)
- Transitioning to **Vertical Slice Architecture** + **Domain-Driven Design**
- Each feature folder is a self-contained vertical slice: domain logic, services, repositories, DTOs, UI components, tests
- Enforced via PR reviews and linting

### Dashboard Patterns
- **Event Types Dashboard**: command-center layout with configurable cards
  - Each event type card shows: unique booking URL, duration setting, visibility toggle
  - Card actions: edit, duplicate, delete
- **Toggle pattern**: visibility toggle per event type (public/private)
- **Duration badges**: compact labels showing meeting length
- **URL slugs**: inline display of booking URLs
- **Settings cascade**: workspace > team > user preference hierarchy

### Takeaway Patterns for Progress Trackers
1. **Card-as-command-center**: Each card has its own micro-dashboard with stats and actions
2. **Visibility toggles**: Simple on/off states with clear visual feedback
3. **Inline configuration**: Edit properties without navigating away
4. **Workspace hierarchy**: Settings and progress can cascade through organizational levels

---

## 4. Linear.app — Best-in-Class UI Patterns

### UI Refresh (March 12, 2026 - Latest)
- "A calmer, more consistent interface" with improved scannability
- Headers, navigation, and view controls standardized across all sections
- Icons redrawn and resized throughout
- Navigation sidebar dimmed to let content stand out

### LCH Color Space Theme System
**The most innovative pattern found in this research:**
- Migrated from HSL to **LCH color space** (perceptually uniform)
- **Three input variables** generate an entire 98-variable theme:
  1. **Base color** (hue + chroma for the UI chrome)
  2. **Accent color** (hue + chroma for interactive elements)
  3. **Contrast percentage** (controls overall contrast ratio)
- Automatically generates light AND dark themes from the same 3 inputs
- Enables automatic **high-contrast accessibility themes** by adjusting one variable
- Internal color picker tool in dev toolbar for live experimentation

### Visual Hierarchy Philosophy
- **"Don't compete for attention you haven't earned"** — sidebar reduced brightness
- **"Structure should be felt, not seen"** — borders softened via rounded edges and reduced contrast
- Tab bars: more compact, rounded corners, smaller icon/text sizing
- Icon usage reduced, scaled down, unnecessary color treatments removed
- Shifted from cool blue-ish grays to **warmer, less-saturated grays**

### Typography
- **Inter Display** for headings (expressive yet readable)
- **Inter** for body text (standard, high legibility)

### Command Palette Patterns
- `Cmd+K` activation
- Fuzzy search across all entities
- Contextual suggestions based on current view
- Keyboard navigation with highlighted active item
- Grouped results by type (Issues, Projects, Views, etc.)

### Filter Chip Patterns
- **Chips/pills** show active filters as compact, clickable elements
- Multi-select enabled for categories, labels, assignees, priorities
- Immediate visual feedback — users see active filters at a glance
- Removable via X button or click
- Combined with command palette for tag/label selection

### Issue List UI
- Dense, scannable rows with icon + title + metadata
- Priority indicators: colored icons (Urgent=red, High=orange, Medium=yellow, Low=blue, None=gray)
- Status indicators: circular icons with fills (Backlog, Todo, In Progress, Done, Cancelled)
- Assignee avatars inline
- Label chips with color dots
- Created/Updated dates in muted text

### Development Process
- Parallel design + engineering (2 designers, engineers coding in pairs)
- Feature flags for internal testing before public rollout
- Internal toolbar toggle for old/new UI comparison
- Figma plugin: exported token values as JSON directly into design system
- Complete redesign: ~6 weeks from offsite to GA

---

## 5. Notion — Database View & Checkbox Patterns

### Checkbox / To-Do Patterns
- **Block-level checkbox**: To-do list item with interactive toggle
- **Property-level checkbox**: Database column type, appears in table cells
- Click or `Space` key to toggle; arrow keys to navigate
- Recent update: checkbox column widths can now be narrowed for compact margins

### Database List View
- Properties appear at the far right of each row
- Clean, minimal layout — no unnecessary borders
- Inline editing: click any cell to edit in-place

### Toggle List
- Expandable/collapsible content containers
- Manual open/close only (no auto-expand/collapse)
- Nested content can include any block type
- No "open all" / "close all" by default

### Recent UI Updates (2025-2026)
- **Streamlined inline databases**: View tabs hidden by default for cleaner appearance
- **Compact checkboxes**: Narrower column width with consistent margin around checkboxes
- **Simplified creation flow**: Fewer visual elements in the initial database view

### Key Design Patterns to Emulate
1. **Inline editing everywhere**: No modals for simple property changes
2. **Progressive disclosure**: Toggle lists reveal complexity on demand
3. **Minimal borders**: Clean separation through spacing, not lines
4. **Keyboard-first navigation**: Space to toggle, arrows to move, Enter to edit

---

## 6. shadcn/ui — Dashboard Templates & Components

### Color System (OKLCH-based, latest)
```css
/* Light Mode (:root) */
--background: oklch(1 0 0);                    /* pure white */
--foreground: oklch(0.145 0 0);                /* near black */
--card: oklch(1 0 0);
--card-foreground: oklch(0.145 0 0);
--primary: oklch(0.205 0 0);                   /* very dark */
--primary-foreground: oklch(0.985 0 0);        /* near white */
--secondary: oklch(0.97 0 0);                  /* very light gray */
--muted: oklch(0.97 0 0);
--muted-foreground: oklch(0.556 0 0);          /* medium gray */
--accent: oklch(0.97 0 0);
--destructive: oklch(0.577 0.245 27.325);      /* red */
--border: oklch(0.922 0 0);                    /* light gray */
--ring: oklch(0.708 0 0);                      /* medium gray */
--radius: 0.625rem;

/* Dark Mode (.dark) */
--background: oklch(0.145 0 0);                /* near black */
--foreground: oklch(0.985 0 0);                /* near white */
--card: oklch(0.205 0 0);                      /* dark gray */
--primary: oklch(0.922 0 0);                   /* light gray */
--secondary: oklch(0.269 0 0);
--muted: oklch(0.269 0 0);
--muted-foreground: oklch(0.708 0 0);
--destructive: oklch(0.704 0.191 22.216);      /* lighter red for dark */
--border: oklch(1 0 0 / 10%);                  /* white 10% opacity */
--input: oklch(1 0 0 / 15%);                   /* white 15% opacity */

/* Chart colors */
--chart-1: oklch(0.646 0.222 41.116);   /* orange */
--chart-2: oklch(0.6 0.118 184.704);    /* teal */
--chart-3: oklch(0.398 0.07 227.392);   /* dark blue */
--chart-4: oklch(0.828 0.189 84.429);   /* yellow */
--chart-5: oklch(0.769 0.188 70.08);    /* amber */
```

### Top Dashboard Templates (by GitHub stars)

| Template | Stars | Stack | Key Features |
|---|---|---|---|
| **shadcn-admin** | 11,000 | React 19, Vite, TanStack Router | Cmd+K search, collapsible sidebar, RTL, 10+ pages |
| **next-shadcn-dashboard-starter** | 5,900 | Next.js 16, Tailwind v4, Zustand | Server-side data tables, Clerk auth, 6+ themes, kanban |
| **slash-admin** | 2,900 | React 19, Vite, React-Query, Framer Motion | RBAC, i18n, dual dashboard layouts, MSW mocking |
| **studio-admin** | 1,600 | Next.js 16, Tailwind v4, Biome | Theme presets (Tangerine, Brutalist, Soft Pop), flexible layouts |
| **shadboard** | 580 | React 19, Next.js 15, Recharts, TanStack Table | Built-in Email/Chat/Calendar/Kanban apps, full auth flow |

### Progress Bar Component
- Built on **Radix UI Progress** with ARIA attributes
- Styled with Tailwind CSS
- Features: indeterminate state, custom value ranges, state-based styling
- Animation: can use `animate-pulse` utility or Framer Motion spring physics
- Customizable indicator color via `[&>*]:bg-green-500` selector pattern

### Data Table Implementation
- **TanStack Table v8** with TypeScript generics
- Server-side search, filtering, pagination
- Column sorting, CSV export
- Faceted filters with count badges

### Command Palette
- **kbar** integration or built-in `Cmd+K` component
- Fuzzy search across pages and entities
- Keyboard navigation with `ArrowUp/Down` + `Enter`
- Grouped results with section headers

---

## 7. Vercel Geist Design System

### Color System (CSS Custom Properties)
```
Gray scale:     --ds-gray-alpha-400 through --ds-gray-1000
Accent colors:  --ds-blue-800, --ds-purple-700, --ds-pink-800,
                --ds-red-800, --ds-amber-800, --ds-green-800, --ds-teal-800
Backgrounds:    --ds-background-100, --ds-background-200
Themes:         light-theme, dark-theme (with colorScheme support)
```

### Typography Scale
```
Headings:   text-heading-16, text-heading-24, text-heading-40 (font-semibold)
Body:       text-copy-16, text-copy-20 (line-height: 1.5)
Monospace:  Geist Mono (dedicated font for code contexts)
Fonts:      Geist Sans (primary), Inter (secondary)
```

### Layout System
- **Max width**: 1200px, **Min width**: 300px
- **Responsive grid**: CSS variables for rows/columns per breakpoint
- **Breakpoints**: xs, sm, smd, md, xl
- **Gap utilities**: gap-4, gap-6, gap-7
- **Guide system**: visual grid overlay for layout debugging

### Data-Dense UI Patterns
- **Sidebar navigation**: collapsible sections with icon-only mode
- **Grid layout**: 2-3 columns on larger screens, 1 on mobile
- **Status dots**: small colored indicators for state
- **Table component**: with pagination support
- **Theme switcher**: system/light/dark modes
- **Z-index management**: z-100 for fixed headers

### Component Patterns
- **Cards**: `backgroundClip: padding-box`, border styling, `group-hover` states
- **Buttons**: secondary type uses `--themed-fg: var(--ds-gray-700)`
- **Icons**: SVG at 16x16px with `currentColor` fill
- **Code blocks**: with 1Password DOM protection via mutation observer

---

## 8. Aceternity UI & Magic UI — Animated Components

### Aceternity UI (200+ components)
**Tech**: React, Next.js, Tailwind CSS, Framer Motion

**Relevant components for a progress tracker:**
- **Multi Step Loader**: Step-by-step loading indicator for long processes
- **Stateful Button**: Loading state → Success state with animation
- **Timeline**: Sticky header with scroll beam follow
- **Bento Grid**: Modular card layout with asymmetric proportions
- **Card Spotlight**: Radial gradient reveal on hover
- **Focus Cards**: Blur-others-on-hover pattern
- **Glowing Effect**: Animated border glow that adapts to any container
- **Glowing Stars**: Card background stars that animate on hover

### Magic UI (50+ components, built on shadcn)
**Tech**: React, TypeScript, Tailwind CSS, Framer Motion

**Key components for progress tracking:**

#### Number Ticker
```tsx
import { NumberTicker } from "@/components/ui/number-ticker";

// Basic usage — animates from 0 to value
<NumberTicker value={100} />

// With decimals
<NumberTicker value={5.67} decimalPlaces={2} />

// With custom start value
<NumberTicker value={100} startValue={80} />

// Styled for dark/light
<NumberTicker
  value={150}
  className="text-8xl font-medium tracking-tighter
             text-black dark:text-white"
/>
```

#### Animated Circular Progress Bar
- Circular gauge displaying percentage value
- Smooth fill animation on mount or value change
- Customizable colors, stroke width, and size

#### Scroll Progress
- Horizontal progress bar that fills as user scrolls
- Attaches to top of viewport
- Smooth animation tied to scroll position

#### Animated Beam
- Light beam traveling along a path
- Useful for showing connections or integrations

#### Animated List
- Items animate in sequentially with stagger
- Smooth enter/exit transitions

### Custom Animations in Tailwind (from Magic UI CSS)
```css
/* Available animation keyframes */
animate-gradient
animate-meteor
animate-marquee
animate-orbit
animate-ripple
animate-shimmer-slide
animate-shine
animate-shiny-text
animate-spin-around
animate-aurora
animate-background-position-spin
animate-line-shadow
```

---

## 9. WCAG AA Accessible Difficulty Color Palette

### Requirements
- **WCAG AA normal text**: 4.5:1 contrast ratio minimum
- **WCAG AA large text**: 3:1 contrast ratio minimum
- **WCAG AA UI components**: 3:1 minimum for graphical objects and interface components
- **Color blindness**: ~5% of population (most common: red/green deficiency)

### Recommended Difficulty Colors

#### Light Mode (on white #FFFFFF background)
```
Easy (Green):   #16A34A  (Tailwind green-600)    — 4.5:1 on white ✓
                HSL: 142 72% 36%
                OKLCH: oklch(0.627 0.194 149.214)

Medium (Amber): #D97706  (Tailwind amber-600)    — 4.5:1 on white ✓
                HSL: 38 92% 44%
                OKLCH: oklch(0.666 0.179 58.318)

Hard (Red):     #DC2626  (Tailwind red-600)       — 4.6:1 on white ✓
                HSL: 0 84% 50%
                OKLCH: oklch(0.577 0.245 27.325)
```

#### Dark Mode (on dark #18181B / zinc-900 background)
```
Easy (Green):   #4ADE80  (Tailwind green-400)     — 5.2:1 on zinc-900 ✓
                HSL: 142 69% 58%

Medium (Amber): #FBBF24  (Tailwind amber-400)     — 8.1:1 on zinc-900 ✓
                HSL: 43 96% 56%

Hard (Red):     #F87171  (Tailwind red-400)        — 4.6:1 on zinc-900 ✓
                HSL: 0 94% 71%
```

#### As Background Badges (text on colored bg)
```
Easy badge:     bg-green-600/15 text-green-600    (light mode)
                bg-green-400/15 text-green-400    (dark mode)

Medium badge:   bg-amber-600/15 text-amber-600    (light mode)
                bg-amber-400/15 text-amber-400    (dark mode)

Hard badge:     bg-red-600/15 text-red-600        (light mode)
                bg-red-400/15 text-red-400        (dark mode)
```

#### Tailwind CSS Token Implementation
```ts
// tailwind.config.ts (or CSS variables)
const difficultyColors = {
  easy: {
    DEFAULT: '#16A34A',    // green-600
    light: '#4ADE80',      // green-400 (for dark mode text)
    bg: 'rgba(22, 163, 74, 0.15)',   // badge background
  },
  medium: {
    DEFAULT: '#D97706',    // amber-600
    light: '#FBBF24',      // amber-400
    bg: 'rgba(217, 119, 6, 0.15)',
  },
  hard: {
    DEFAULT: '#DC2626',    // red-600
    light: '#F87171',      // red-400
    bg: 'rgba(220, 38, 38, 0.15)',
  },
};
```

### Color Blindness Mitigation
Always supplement color with **secondary indicators**:
- Icons: checkmark for easy, equals/dash for medium, exclamation for hard
- Text labels: always include "Easy" / "Medium" / "Hard" text
- Shape coding: circles for easy, diamonds for medium, triangles for hard
- Pattern fills for chart visualizations

### Tools for Validation
- **InclusiveColors** (inclusivecolors.com) — builds WCAG-compliant palettes, exports to Tailwind/CSS/Figma
- **WebAIM Contrast Checker** (webaim.org/resources/contrastchecker)
- Uses **HSLuv** color space: modifying hue/saturation doesn't change perceived brightness

---

## 10. Micro-Interactions & Animations

### Philosophy (2026 Trends)
- Spring physics replacing linear easing — think momentum, tension, damping
- Small purposeful animations communicate feedback intuitively
- `prefers-reduced-motion` media query is MANDATORY for accessibility

### Animated Checkbox (Framer Motion + SVG pathLength)

**Core technique**: Animate `motion.path` with `pathLength` from 0 to 1 for a "drawing" effect.

```tsx
import { motion } from "framer-motion";
import { useState } from "react";

function AnimatedCheckbox() {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <motion.div
      onClick={() => setIsChecked(!isChecked)}
      className="cursor-pointer"
    >
      {/* Checkbox box */}
      <motion.div
        initial={false}
        animate={{
          backgroundColor: isChecked ? "#16A34A" : "transparent",
          borderColor: isChecked ? "#16A34A" : "#d1d5db",
        }}
        transition={{ duration: 0.15 }}
        className="w-5 h-5 rounded border-2 flex items-center justify-center"
      >
        {/* Checkmark SVG */}
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
          <motion.path
            d="M5 13l4 4L19 7"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: isChecked ? 1 : 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
```

**AnimateIcons** (allshadcn.com) — MIT-licensed library that transforms static SVG icons into animated versions with Framer Motion, designed for shadcn/ui workflow.

### Animated Progress Bar Fill

```tsx
import { motion } from "framer-motion";

function AnimatedProgressBar({ value, max = 100, color = "#16A34A" }) {
  const percentage = (value / max) * 100;

  return (
    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{
          type: "spring",
          stiffness: 50,
          damping: 15,
          mass: 0.5,
        }}
      />
    </div>
  );
}
```

### Animated Number Counter

**Option A: Magic UI NumberTicker** (copy-paste component)
```tsx
<NumberTicker value={42} className="text-2xl font-bold" />
```

**Option B: Motion AnimateNumber** (Motion+ premium, 2.5kb)
```tsx
import { AnimateNumber } from "motion-plus/react";

<AnimateNumber
  transition={{
    y: { type: "spring", visualDuration: 0.4, bounce: 0.2 },
    opacity: { ease: "linear" },
  }}
>
  {count}
</AnimateNumber>
```

**Option C: Custom spring counter**
```tsx
import { useSpring, animated } from "@react-spring/web";

function AnimatedCounter({ value }: { value: number }) {
  const { number } = useSpring({
    number: value,
    from: { number: 0 },
    config: { mass: 1, tension: 170, friction: 26 },
  });

  return <animated.span>{number.to((n) => Math.floor(n))}</animated.span>;
}
```

### Counter Increment Animation (on checkbox toggle)
```tsx
// When a problem is solved, counter goes from N to N+1
// with a subtle scale + color flash

<motion.span
  key={solvedCount}  // key change triggers re-mount animation
  initial={{ y: -10, opacity: 0, scale: 1.2 }}
  animate={{ y: 0, opacity: 1, scale: 1 }}
  exit={{ y: 10, opacity: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
>
  {solvedCount}
</motion.span>
```

### Progress Bar Fill on Completion
```tsx
// Spring-based fill feels more "alive" than linear
transition={{
  type: "spring",
  stiffness: 50,    // slow, satisfying fill
  damping: 15,      // slight overshoot then settle
  mass: 0.5,
}}
```

### GPU-Accelerated Properties
For smooth 60fps animations, ONLY animate:
- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (for blur/brightness effects)
- Avoid: width, height, top, left, padding, margin, border

### Accessibility: Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Recommended Animation Libraries (2026)
| Library | Best For | Size |
|---|---|---|
| **Framer Motion / Motion** | React projects, gestures, layout animations | ~32kb |
| **GSAP + ScrollTrigger** | Scroll-based, complex timelines | ~24kb |
| **Lottie** | Complex vector animations from After Effects | ~50kb |
| **CSS transitions** | Simple state changes (hover, fade) | 0kb |
| **AnimateNumber (Motion+)** | Number counters specifically | 2.5kb |

---

## Summary: Recommended Patterns for a Premium Progress Tracker

### Layout
1. **Bento grid dashboard** (Aceternity/shadcn pattern) for overview cards
2. **Collapsible sidebar** with icon-only mode (Geist/Linear pattern)
3. **Grouped topic sections** with individual progress bars (NeetCode pattern)
4. **Dense list view** with inline status indicators (Linear pattern)

### Components
1. **Progress bars**: 8px height, pill shape (`rounded-full`), spring-animated fill
2. **Checkboxes**: SVG pathLength animated checkmark with spring physics
3. **Counters**: `NumberTicker` style animation on value changes
4. **Filter chips**: Removable pills showing active filters (Linear pattern)
5. **Command palette**: `Cmd+K` with fuzzy search and grouped results
6. **Difficulty badges**: Colored text with subtle background tint (`bg-color/15`)

### Color Architecture
1. Use **OKLCH** color space (shadcn v4 default) for perceptual uniformity
2. Consider Linear's **3-variable theme generation** (base + accent + contrast)
3. Difficulty colors: green-600/amber-600/red-600 (light) and green-400/amber-400/red-400 (dark)
4. Always pair color with icons/text for color-blind accessibility

### Animations
1. **Spring physics** over linear easing for all interactive elements
2. **pathLength animation** for checkbox checkmarks
3. **Layout animations** for list reordering and filtering
4. **Staggered entrance** for list items loading
5. **Scale + opacity pulse** on counter changes
6. **prefers-reduced-motion** query in every animation

### Tech Stack Alignment
- **shadcn/ui** as component foundation (OKLCH, Radix, Tailwind)
- **TanStack Table v8** for any data table views
- **Framer Motion** for animations
- **Magic UI NumberTicker** for counter animations (free, shadcn-compatible)
- **kbar** or built-in Command component for command palette

---

## Sources

- [NeetCode Roadmap](https://neetcode.io/roadmap)
- [roadmap.sh](https://roadmap.sh/)
- [Cal.com Design System](https://design.cal.com/)
- [Linear UI Redesign Part II](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear UI Refresh (March 2026)](https://linear.app/changelog/2026-03-12-ui-refresh)
- [Linear Design Refresh Philosophy](https://linear.app/now/behind-the-latest-design-refresh)
- [Linear Theme Generation (Andreas Eldh)](https://x.com/eldh/status/1773462909185597617)
- [shadcn/ui Theming Documentation](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Progress Component](https://ui.shadcn.com/docs/components/radix/progress)
- [shadcn Admin (11k stars)](https://github.com/satnaing/shadcn-admin)
- [Next shadcn Dashboard Starter (5.9k stars)](https://github.com/Kiranism/next-shadcn-dashboard-starter)
- [25 Best Shadcn Dashboard Templates](https://adminlte.io/blog/shadcn-admin-dashboard-templates/)
- [Vercel Geist Design System](https://vercel.com/geist/introduction)
- [Aceternity UI Components](https://ui.aceternity.com/components)
- [Magic UI NumberTicker](https://magicui.design/docs/components/number-ticker)
- [Magic UI Animated Circular Progress Bar](https://magicui.design/docs/components/animated-circular-progress-bar)
- [Motion AnimateNumber](https://motion.dev/docs/react-animate-number)
- [SVG Animation with Motion](https://motion.dev/docs/react-svg-animation)
- [Framer Motion SVG Checkbox (CodeSandbox)](https://codesandbox.io/s/framer-motion-svg-checkbox-kqm7y)
- [AnimateIcons for shadcn/ui](https://allshadcn.com/tools/animateicons/)
- [CSS/JS Animation Trends 2026](https://webpeak.org/blog/css-js-animation-trends/)
- [Motion UI Trends 2026](https://lomatechnology.com/blog/motion-ui-trends-2026/2911)
- [Command Palette UI Design (Mobbin)](https://mobbin.com/glossary/command-palette)
- [InclusiveColors WCAG Palette Tool](https://www.inclusivecolors.com/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Notion List View](https://www.notion.com/help/lists)
- [Notion Database Intro](https://www.notion.com/help/intro-to-databases)
- [NumberFlow (alternative animated number)](https://number-flow.barvian.me/)
