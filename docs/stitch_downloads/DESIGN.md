---
name: Organic SaaS System
colors:
  surface: '#f3fcf3'
  surface-dim: '#d3dcd4'
  surface-bright: '#f3fcf3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf6ee'
  surface-container: '#e7f0e8'
  surface-container-high: '#e2eae2'
  surface-container-highest: '#dce5dd'
  on-surface: '#151d19'
  on-surface-variant: '#414845'
  inverse-surface: '#2a322d'
  inverse-on-surface: '#eaf3eb'
  outline: '#717975'
  outline-variant: '#c0c8c3'
  surface-tint: '#3e6658'
  primary: '#002218'
  on-primary: '#ffffff'
  primary-container: '#0e382c'
  on-primary-container: '#79a292'
  inverse-primary: '#a5d0be'
  secondary: '#306855'
  on-secondary: '#ffffff'
  secondary-container: '#b1ecd4'
  on-secondary-container: '#356d59'
  tertiary: '#151f1a'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a342f'
  on-tertiary-container: '#929c95'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1ecda'
  primary-fixed-dim: '#a5d0be'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#264e41'
  secondary-fixed: '#b4efd7'
  secondary-fixed-dim: '#99d3bb'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#14503e'
  tertiary-fixed: '#dae5dd'
  tertiary-fixed-dim: '#bec9c2'
  on-tertiary-fixed: '#141e19'
  on-tertiary-fixed-variant: '#3f4943'
  background: '#f3fcf3'
  on-background: '#151d19'
  surface-variant: '#dce5dd'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies an organic SaaS identity built on principles of calm precision, structural clarity, and understated natural elegance. Designed for high-trust software platforms, it merges functional corporate software reliability with an editorial, biological freshness inspired by Nordic and Japanese environmental design.

The aesthetic blends warm minimalism with tactile, physical finishes. Interfaces feel physical and intentional rather than clinical, replacing generic cold grays with botanical neutrals and soft sage undertones. Crisp linear geometry, disciplined whitespace, and deep botanical contrasts communicate stability, clarity, and authority.

Key principles:
- **Calm Authority**: Surfaces are restrained and unhurried; elements do not shout.
- **Organic Precision**: Pure geometric utility framed by earthy tints and refined radii.
- **Strict Semantic Integrity**: No emojis or decorative gimmicks; visual signaling relies exclusively on disciplined vector iconography, proportional typography, and deliberate negative space.

## Colors

The palette is anchored by botanical deep greens and atmospheric sage washes, creating an eye-resting working environment suited for prolonged use.

- **Primary (`#0E382C`)**: Deep Forest Green. Used for primary interactive triggers, key branded marks, primary buttons, and focused states. Imparts institutional weight, security, and focus.
- **Secondary (`#316956`)**: Muted Moss Green. Serves as interactive hover accents, supporting callouts, active indicator tags, and secondary action highlights.
- **Tertiary (`#DCE7DF`)**: Pale Sage Container. Used for subtle icon backdrops, tag pills, active border rings, and low-contrast surface highlights.
- **Neutral Primary (`#1E2621`)**: Dark Spruce Slate. The primary text color, delivering near-black readability while preserving the green-tinted atmospheric depth.
- **Surface Canvas (`#F2F5F3`)**: Soft Sage Ground. The primary viewport canvas backdrop, warmer and calmer than pure white or cold gray.
- **Surface Card (`#FFFFFF`)**: Pure White. Used exclusively for elevated content modules, login panels, dialogs, and primary structural containers.
- **Border Subtle (`#E4ECE7`)**: Sage-Tinted Line. Delicate, low-contrast boundary separating pure white cards and interactive inputs from the sage canvas.

## Typography

The typographic hierarchy pairs the soft, sculpted geometry of **Plus Jakarta Sans** for headlines with the neutral, engineered utility of **Inter** for core UI, body copy, and form inputs.

- **Headings**: Set tight with modest negative letter-spacing (`-0.015em` to `-0.02em`) to produce a confident, premium editorial tone.
- **Body & Labels**: Prioritize vertical rhythm and readability with open apertures and neutral proportions.
- **Copy Direction**: All user interface text strictly defaults to natural Portuguese (PT-BR), leveraging concise terminology (e.g., *Entrar*, *Endereço de e-mail*, *Senha*, *Esqueceu a senha?*, *Lembrar de mim*, *Continuar com Google*).

## Layout & Spacing

The layout model is structured on an 8px base rhythm with fixed content constraints for authentication and centered workflows:

- **Desktop (≥ 1024px)**: Single centered authentication card bounded to a maximum width of `440px` (or `960px` for split-screen layouts featuring illustrative brand visuals on one flank), surrounded by generous canvas breathing margins.
- **Tablet (768px – 1023px)**: Centered card architecture with `2rem` outer page margins, retaining fixed card internal padding (`space-xl`).
- **Mobile (< 768px)**: Fluid card layout stretching across the screen with `margin: 1.25rem` outer margins, edge padding reduced to `space-lg` (24px) for maximum thumb reach and accessibility.
- **Rhythm**: Internal spacing inside cards adheres strictly to standard step intervals: 8px between label and input field, 16px between sibling form groups, 24px before the primary submission block, and 32px to 40px bounding header-to-form demarcations.

## Elevation & Depth

Visual hierarchy uses ambient organic lighting rather than heavy artificial shadows:

- **Flat/Canvas**: Background base `#F2F5F3` maintains zero elevation.
- **Card Containers (Level 1)**: White surfaces (`#FFFFFF`) sitting on `#F2F5F3` are defined by a dual-treatment:
  - Crisp boundary outline: `1px solid #E4ECE7`.
  - Ambient tint shadow: `0 8px 30px -4px rgba(14, 56, 44, 0.04), 0 2px 8px -2px rgba(14, 56, 44, 0.02)`.
- **Active Interactive Elements (Level 2 - Hover/Focus)**:
  - Input focus: `0 0 0 3px rgba(14, 56, 44, 0.12)`.
  - Button hover: `0 4px 14px -2px rgba(14, 56, 44, 0.20)`.
- **Flyouts & Dropdowns (Level 3)**:
  - Elevated overlays: `0 16px 40px -8px rgba(14, 56, 44, 0.08), 1px solid #E4ECE7`.

## Shapes

The shape system utilizes soft, organic curvature without sacrificing corporate structure:

- **Primary Cards & Modals**: Fixed at `24px` (`1.5rem`), producing friendly, tactile containers.
- **Interactive Inputs & Buttons**: Unified at `12px` (`0.75rem`) to fit comfortably within the parent container's 24px arc.
- **Small Badges & Pills**: `9999px` (full capsule) for operational status chips or secondary metadata.
- **Icon Enclosures**: Fixed at `8px` or `10px` for squircle-profile bounding containers.

## Components

### Buttons
- **Primary**: Background `#0E382C`, text `#FFFFFF`, border `none`, radius `12px`, padding `12px 20px`, typography `label-md`. On hover: background `#184D3D`, slight lift shadow. On active: scale `0.985`.
- **Secondary / Social OAuth**: Background `#FFFFFF`, text `#1E2621`, border `1px solid #E4ECE7`, radius `12px`, padding `11px 20px`. Displays crisp vector provider icon (e.g., Google `svg`) left-aligned, followed by centered Portuguese text (*Continuar com Google*). On hover: background `#F7FAF8`, border `#D0DCD4`.
- **Ghost / Tertiary**: Transparent background, text `#0E382C`, font weight `500`. On hover: subtle text-decoration or `#EBF1ED` background pill.

### Input Fields
- **Container**: Structural height `46px`, padding `0 14px`, background `#FFFFFF`, border `1px solid #E4ECE7`, radius `12px`, typography `body-md`.
- **Label**: Inter `label-sm`, color `#3A4740`, position above input with `6px` spacing.
- **Focus State**: Border `#0E382C`, ring `0 0 0 3px rgba(14, 56, 44, 0.1)`.
- **Placeholder**: Color `#8A9990`, Inter `body-md`.
- **Supporting Icons**: Precision line icons (18px stroke `1.5px`) in `#6C7D74`, positioned at `right: 14px` (e.g., visibility toggle eye for password field).

### Checkbox & Radio Buttons
- **Checkbox**: Dimensions `18px × 18px`, radius `5px`, border `1.5px solid #CBD8D0`, background `#FFFFFF`. On checked: background `#0E382C`, border `#0E382C`, with sharp white vector checkmark.
- **Label Text**: Inter `body-md`, `#1E2621`, left margin `8px`.

### Cards (Login Container)
- Background pure `#FFFFFF`, border `1px solid #E4ECE7`, border radius `24px`, inner padding `40px` (desktop) or `24px` (mobile). Top-aligned with logo vector, title (*Acessar sua conta*), and subtitle (*Entre com suas credenciais para continuar*).

### Divider
- Subtle `1px solid #E4ECE7` horizontal rule with centered badge overlay containing lowercase text (*ou continue com*), background `#FFFFFF`, color `#8A9990`.

### Iconography Rules
- Minimalist linear vectors (Lucide / Feather style), uniform `1.5px` or `1.75px` stroke weight, round caps and joins. Strict prohibition of emojis across labels, validation states, and tooltips.