# Typeable Format-Aware Date Parsing

## Problem

When the `typeable` prop is enabled on the datepicker, typed input is validated using JavaScript's native `Date.parse()`. This ignores the component's `format` prop entirely. For example, if `format` is `'dd.MM.yyyy'`, typing `24.04.2018` fails because `Date.parse` interprets dots as MM.DD.YYYY (US format) and rejects day values > 12.

## Solution

Replace `Date.parse()` with `moment(input, formatString, true)` (strict mode) for parsing typed input. The component's format string tokens are mapped to moment's token format. Existing formatting logic (`DateUtils.formatDate`) remains untouched.

## Approach

**Moment.js for parsing only.** Moment is already available in the consuming project. Only the parsing path in `DateInput.vue` changes; all display formatting stays as-is.

## Design

### Token Mapping Utility

A function `toMomentFormat(formatStr)` added to `DateUtils.js` that converts the component's format tokens to moment.js tokens:

| Component Token | Moment Token | Notes |
|---|---|---|
| `dd` | `DD` | Zero-padded day |
| `d` | `D` | Day |
| `yyyy` | `YYYY` | Four-digit year |
| `yy` | `YY` | Two-digit year |
| `MMMM` | `MMMM` | No change |
| `MMM` | `MMM` | No change |
| `MM` | `MM` | No change |
| `M` | `M` | No change |
| `D` (day abbr) | Stripped | Not parseable |
| `su` (suffix) | Stripped | Not parseable |

Replacements are applied in this order: (1) strip unparseable tokens (`D` day abbreviation, `su` suffix) first, (2) then replace longest tokens before shorter ones (`dd` before `d`, `yyyy` before `yy`) to avoid partial matches. The component's `D` (day abbreviation) must be stripped before `d`→`D` conversion to avoid collision with moment's `D` (day number).

### New Props

Two new props on `DateInput.vue`, passed through from `Datepicker.vue`:

- **`parseFormat`** (`String`, default `null`) — Moment-compatible format string used when the `format` prop is a function. Ignored when `format` is a string (the string format is converted via `toMomentFormat` automatically). If `format` is a function and `parseFormat` is not provided, falls back to `Date.parse()`.

- **`validateOnKeyup`** (`Boolean`, default `false`) — When `true`, restores the legacy behavior of parsing/emitting on every keyup. When `false` (default), parsing and validation only happen on blur.

### Modified Methods in `DateInput.vue`

**`parseTypedDate(event)`** (called on keyup):
- Handles Escape/Enter to close calendar (unchanged).
- If `validateOnKeyup` is `false` (default): no further action, user types freely.
- If `validateOnKeyup` is `true`: runs parsing logic using moment (for backward compatibility).

**`inputBlurred()`** (called on blur):
1. Determines the parse format:
   - If `format` is a string: convert via `toMomentFormat()`.
   - If `format` is a function and `parseFormat` is provided: use `parseFormat` directly (already moment-compatible).
   - If `format` is a function and no `parseFormat`: fall back to `Date.parse()`.
2. Parses the input:
   - With moment format: `moment(input.value, momentFormat, true)`. If `.isValid()`, emit `typedDate` with `.toDate()`.
   - With `Date.parse` fallback: current behavior.
3. If parsing fails: call `clearDate()`, null out input and `typedDate`.

**`formattedValue` computed** — No changes. Already returns raw typed string when `typedDate` is set.

### Files Modified

- `src/utils/DateUtils.js` — add `toMomentFormat(formatStr)` function
- `src/components/DateInput.vue` — add props, import moment, rewrite `parseTypedDate` and `inputBlurred`
- `src/components/Datepicker.vue` — add `parseFormat` and `validateOnKeyup` props, pass through to `DateInput`

### Files Not Touched

- `DateUtils.formatDate()` — stays as-is
- Picker components (`PickerDay`, `PickerMonth`, `PickerYear`) — no changes
- Locale/translations — no changes

### Tests Updated

- `test/unit/specs/DateInput/typedDates.spec.js`:
  - Format-aware parsing with various format strings (e.g., `dd.MM.yyyy`, `yyyy-MM-dd`, `MM/dd/yyyy`)
  - Blur-only validation (default behavior)
  - `parseFormat` prop with function format
  - `validateOnKeyup` backward compatibility
  - Invalid input clearing on blur
