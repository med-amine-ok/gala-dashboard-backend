# DESIGN_SYSTEM.md
This document specifies the premium visual design system for the GALA Event Management System HR Admin Dashboard. It represents a custom, formal theme using refined colors, elegant typography, and consistent spacing designed to evoke a luxury hospitality feeling.

## 1. Color Palette
To avoid hardcoding colors, the tailwind configuration uses semantic names mapped to CSS variables.

### Base Surfaces
- `--color-surface-bg`: `#FAF9F6` (Alabaster / Warm White. Used for primary app background).
- `--color-surface-card`: `#FFFFFF` (Pure White. Used for content containers, cards, tables, and elevations).
- `--color-surface-sidebar`: `#171717` (Rich Charcoal / Black. Used for sidebar to establish a premium brand contrast).

### Primary Accents (Gold/Champagne)
- `--color-gold-primary`: `#B8964A` (Muted Gold. Used for branding accents, focus borders, active links, and primary buttons).
- `--color-gold-light`: `#F7F2E4` (Champagne Tint. Used for background active states, highlight badges, and focus rings).
- `--color-gold-hover`: `#9C7A2E` (Deep Gold. Used for hover and active state overrides).

### Typography Ink
- `--color-text-primary`: `#1A1A1A` (Near Black. Used for body text, headings, and high emphasis indicators).
- `--color-text-secondary`: `#666666` (Slate Gray. Used for subtitles, labels, and secondary context).
- `--color-text-muted`: `#999999` (Light Gray. Used for tables header labels and placeholder hints).

### Semantic Indicators
- `--color-success`: `#2E5A36` (Forest Green. Status: Approved, Paid, Checked In).
- `--color-success-bg`: `#EBF2EC` (Forest Tint. Badge backgrounds).
- `--color-warning`: `#B8964A` (Gold / Amber. Status: Pending, Waiting).
- `--color-warning-bg`: `#FAF5EB` (Gold Tint. Badge backgrounds).
- `--color-danger`: `#8B2635` (Deep Burgundy. Status: Rejected, Cancelled, Overlap).
- `--color-danger-bg`: `#F9ECEF` (Burgundy Tint. Badge backgrounds).

---

## 2. Typography
- **Headings & Logo/Wordmark**: Serif or Display font (e.g. **Playfair Display** or **Cormorant Garamond**).
  - Used for: Primary page titles, main dashboard numbers, logo text.
  - Characteristics: Refined elegance, medium to semi-bold weights, slightly increased tracking/letter-spacing for uppercase.
- **Body, UI Chrome, and Data Tables**: Sans-Serif (e.g. **Inter** or system UI stack).
  - Used for: Data-dense layouts, input elements, sidebar text, general navigation.
  - Characteristics: Maximum legibility, standard metrics.

---

## 3. Component & Layout Styles

### Sidebar Navigation
- Deep charcoal background (`#171717`).
- Active items use a left-edge gold accent indicator and text in white or gold.
- Inactive items use muted gray text/icons, with smooth transition to soft gold on hover.

### Elevated Cards
- Warm, pure white background (`#FFFFFF`).
- Very soft, warm-toned shadow (`box-shadow: 0 4px 20px -2px rgba(27, 24, 20, 0.04), 0 2px 8px -1px rgba(27, 24, 20, 0.02)`).
- Rounded corners at `12px` (`rounded-xl`).
- Accent headers: Optional top-border thin gold line for high-level summary cards.

### Forms & Input Controls
- Replaces standard blue focus rings with custom gold focus rings: `focus:ring-2 focus:ring-[#B8964A] focus:border-[#B8964A]`.
- Subtle validation indicators in Burgundy (`--color-danger`).

### Tables & Badges
- generous row paddings.
- Row-hover highlighting: very light warm gray (`#FAF9F6`).
- Status Badges use high-contrast text on soft semantic backgrounds:
  - **Approved/Paid/Checked-in**: Forest text on light green background.
  - **Pending**: Gold text on light gold background.
  - **Rejected/Cancelled/Failed**: Burgundy text on light burgundy background.
