# Disabled Date Validation for Typed Input

## Problem

When a user types a date that parses successfully but falls on a disabled date, the component accepts it. Disabled dates are only enforced in the calendar picker UI, not for typed input.

## Solution

After parsing typed input, validate the resulting date against `disabledDates`. If disabled, treat it similarly to invalid input: emit a `disabledDateInput` event (distinct from `invalidInput`), then reset or clear based on `resetOnInvalidValue`/`initialValue`.

## Design

### Extract `isDisabledDate` to `DateUtils.js`

Move the disabled date checking logic from `PickerDay.vue` (lines 239-279) into a standalone function in `DateUtils.js`:

```
isDisabledDate(date, disabledDates)
```

Takes a Date and the `disabledDates` config object. Returns `true` if the date is disabled. Handles: `to`, `from`, `dates`, `ranges`, `days`, `daysOfMonth`, `customPredictor`.

`PickerDay.vue` calls `this.utils.isDisabledDate(date, this.disabledDates)` instead of its own method.

### Pass `disabledDates` to `DateInput`

- Add `disabledDates: Object` prop to `DateInput.vue`
- Pass `:disabledDates="disabledDates"` from `Datepicker.vue` template

### Validate in `inputBlurred`

After a typed date parses successfully, before emitting `typedDate`:

1. Check `this.utils.isDisabledDate(parsedDate, this.disabledDates)`
2. If disabled:
   - Emit `disabledDateInput` with the parsed Date object
   - If `resetOnInvalidValue && initialValue`: emit `typedDate(initialValue)`, set `typedDate` to `false`
   - Else: `clearDate()`, null out input and typedDate

### New Event: `disabledDateInput`

- Emitted from `DateInput`, re-emitted from `Datepicker`
- Payload: the parsed Date object (so the consumer knows which date was attempted)

### Files Modified

- `src/utils/DateUtils.js` — add `isDisabledDate(date, disabledDates)` function
- `src/components/PickerDay.vue` — delegate to `this.utils.isDisabledDate()`
- `src/components/DateInput.vue` — add `disabledDates` prop, validate after parsing
- `src/components/Datepicker.vue` — pass `disabledDates` to `DateInput`, re-emit `disabledDateInput`
- `test/unit/specs/DateUtils.spec.js` — tests for `isDisabledDate`
- `test/unit/specs/DateInput/typedDates.spec.js` — tests for disabled date rejection
- `test/unit/specs/PickerDay/disabledDates.spec.js` — verify no regression after refactor
- `README.md` — add `disabledDateInput` to events table
