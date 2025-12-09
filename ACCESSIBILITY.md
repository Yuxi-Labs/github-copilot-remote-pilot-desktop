# Accessibility Guidelines

This document outlines the accessibility (a11y) features and improvements for the Remote Pilot Desktop application.

## Current Status

### ✅ Implemented Features

1. **Keyboard Navigation**
   - All interactive elements accessible via keyboard
   - Keyboard shortcuts documented (Ctrl+Shift+C for change approval, etc.)
   - Focus management in dialogs

2. **ARIA Labels**
   - Close buttons have `aria-label="Close"`
   - Status bar has `role="status"`
   - Dialogs have proper ARIA roles

3. **Semantic HTML**
   - Proper heading hierarchy (h1, h2, h3)
   - Button elements for interactive controls
   - Form elements with labels

4. **Color Contrast**
   - Text colors meet WCAG AA standards
   - Theme support (light/dark/system)

### 🔄 Areas for Improvement

1. **Screen Reader Support**
   - [ ] Add ARIA live regions for dynamic content (messages, notifications)
   - [ ] Add ARIA descriptions for complex UI elements
   - [ ] Test with NVDA/JAWS/VoiceOver

2. **Focus Management**
   - [ ] Trap focus within modal dialogs
   - [ ] Restore focus when closing dialogs
   - [ ] Skip links for navigation

3. **Keyboard Shortcuts**
   - [ ] Add help dialog (Ctrl+?) showing all shortcuts
   - [ ] Ensure no keyboard traps
   - [ ] Add more shortcuts for common actions

4. **Visual Indicators**
   - [x] Focus visible on all interactive elements
   - [ ] Loading states announced to screen readers
   - [ ] Error messages linked to form fields

5. **Alternative Text**
   - [ ] All icons have text alternatives
   - [ ] Code blocks have accessible labels
   - [ ] Images have alt text

## Testing Checklist

### Manual Testing
- [ ] Navigate entire app with keyboard only
- [ ] Test with screen reader (NVDA on Windows)
- [ ] Test in high contrast mode
- [ ] Test with 200% zoom
- [ ] Test with browser extensions (axe DevTools)

### Automated Testing
- [ ] Run axe-core accessibility tests
- [ ] Check color contrast ratios
- [ ] Validate HTML semantics
- [ ] Test ARIA implementation

## Accessibility Standards

We aim to meet **WCAG 2.1 Level AA** compliance:

- **Perceivable**: Information presented in ways users can perceive
- **Operable**: UI components and navigation must be operable
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for assistive technologies

## Quick Wins

1. Add focus trap to all modal dialogs
2. Add `aria-live="polite"` to message list for new messages
3. Add keyboard shortcut help dialog
4. Ensure all buttons have descriptive labels
5. Add loading state announcements

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [React Accessibility](https://react.dev/learn/accessibility)
- [Tauri Accessibility](https://tauri.app/v1/guides/features/accessibility)
