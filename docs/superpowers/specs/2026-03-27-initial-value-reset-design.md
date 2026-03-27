# Initial Value Reset on Invalid Input

## Problem

When a user types an invalid date and leaves the field, the input is cleared. There's no way to reset to a known-good value, and no event is emitted to notify the consumer that invalid input was entered.

## Solution

Add `initialValue` and `resetOnInvalidValue` props so the component can reset to a fallback date on invalid input. Add an `invalidInput` event so consumers can react to parse failures.

## Design

### New Props

On both `Datepicker.vue` and `DateInput.vue`:

- **`initialValue`** (`Date`, default `null`) — The date to reset to when typed input is invalid and `resetOnInvalidValue` is `true`.
- **`resetOnInvalidValue`** (`Boolean`, default `false`) — When `true`: if `initialValue` is provided, reset to it on invalid input; if `initialValue` is not provided, clear the field (current behavior).

### New Event

- **`invalidInput`** — Emitted when typed input fails to parse on blur. Payload: the raw input string. Fires before any reset/clear logic. `DateInput` emits it, `Datepicker` listens and re-emits to the consumer.

### Modified Logic in `inputBlurred()`

Current invalid-input path:
```
clearDate() → null out input → null out typedDate
```

New invalid-input path:
```
emit('invalidInput', inputValue)
if resetOnInvalidValue && initialValue:
  emit('typedDate', initialValue) → set typedDate to false (triggers reformat via formattedValue)
else:
  clearDate() → null out input → null out typedDate  (unchanged)
```

### Files Modified

- `src/components/Datepicker.vue` — add `initialValue` and `resetOnInvalidValue` props, pass through to `DateInput`, listen for `invalidInput` and re-emit
- `src/components/DateInput.vue` — add `initialValue` and `resetOnInvalidValue` props, emit `invalidInput`, modify `inputBlurred`
- `test/unit/specs/DateInput/typedDates.spec.js` — add tests for reset behavior and `invalidInput` event
- `README.md` — add new props to props table, add `invalidInput` to events table
