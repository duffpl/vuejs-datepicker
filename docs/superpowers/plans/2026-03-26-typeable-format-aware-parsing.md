# Typeable Format-Aware Date Parsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix typed date input to parse dates using the component's `format` prop via moment.js instead of `Date.parse()`.

**Architecture:** Add a `toMomentFormat()` utility to convert the datepicker's format tokens to moment tokens. Replace `Date.parse()` with `moment(input, format, true)` in `DateInput.vue`. Move validation from keyup to blur by default, with a `validateOnKeyup` prop to restore legacy behavior. Add `parseFormat` prop for when `format` is a function.

**Tech Stack:** Vue 2, moment.js, Jest

---

### Task 1: Add `toMomentFormat` utility with tests

**Files:**
- Modify: `src/utils/DateUtils.js:244-252`
- Test: `test/unit/specs/DateUtils.spec.js`

- [ ] **Step 1: Write failing tests for `toMomentFormat`**

Add to the end of `test/unit/specs/DateUtils.spec.js`, before the closing:

```javascript
describe('toMomentFormat', () => {
  it('converts dd.MM.yyyy to DD.MM.YYYY', () => {
    expect(DateUtils.toMomentFormat('dd.MM.yyyy')).toEqual('DD.MM.YYYY')
  })

  it('converts yyyy-MM-dd to YYYY-MM-DD', () => {
    expect(DateUtils.toMomentFormat('yyyy-MM-dd')).toEqual('YYYY-MM-DD')
  })

  it('converts d/M/yy to D/M/YY', () => {
    expect(DateUtils.toMomentFormat('d/M/yy')).toEqual('D/M/YY')
  })

  it('converts dd MMM yyyy to DD MMM YYYY', () => {
    expect(DateUtils.toMomentFormat('dd MMM yyyy')).toEqual('DD MMM YYYY')
  })

  it('converts MMMM dd, yyyy to MMMM DD, YYYY', () => {
    expect(DateUtils.toMomentFormat('MMMM dd, yyyy')).toEqual('MMMM DD, YYYY')
  })

  it('strips D (day abbreviation) token', () => {
    expect(DateUtils.toMomentFormat('D dd MMM yyyy')).toEqual('DD MMM YYYY')
  })

  it('strips su (suffix) token', () => {
    expect(DateUtils.toMomentFormat('dsu MMMM yyyy')).toEqual('D MMMM YYYY')
  })

  it('handles D and su together', () => {
    expect(DateUtils.toMomentFormat('D dsu MMMM yyyy')).toEqual('D MMMM YYYY')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest --config test/unit/jest.conf.js test/unit/specs/DateUtils.spec.js --verbose`
Expected: FAIL — `DateUtils.toMomentFormat is not a function`

- [ ] **Step 3: Implement `toMomentFormat` in DateUtils.js**

Add the following function to the `utils` object in `src/utils/DateUtils.js`, right before the closing `}` of the `utils` object (before line 244):

```javascript
  /**
   * Converts the datepicker's format string to a moment.js compatible format string.
   * @param {String} format - datepicker format string
   * @return {String} moment.js format string
   */
  toMomentFormat (format) {
    // Step 1: Strip unparseable tokens (must happen before d->D conversion)
    // D is day abbreviation (Mon, Tue) — strip it but be careful not to strip
    // D that's part of other tokens. The component's D token is standalone or
    // preceded by a space/start-of-string, not part of dd/dsu.
    // Use the same negative lookahead as formatDate for D: D(?!e|é|i)
    let str = format
      .replace(/su/, '')
      .replace(/D(?!e|é|i)/, '')
      // Clean up any leading/trailing whitespace from stripping
      .replace(/\s+/g, ' ')
      .trim()

    // Step 2: Replace tokens longest-first to avoid partial matches
    str = str
      .replace(/dd/g, 'DD')
      .replace(/d/g, 'D')
      .replace(/yyyy/g, 'YYYY')
      .replace(/yy/g, 'YY')
    // Month tokens (MMMM, MMM, MM, M) are identical in both systems — no changes needed

    return str
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest --config test/unit/jest.conf.js test/unit/specs/DateUtils.spec.js --verbose`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/DateUtils.js test/unit/specs/DateUtils.spec.js
git commit -m "feat: add toMomentFormat utility for converting datepicker format tokens to moment.js tokens"
```

---

### Task 2: Add new props to `Datepicker.vue` and pass through to `DateInput`

**Files:**
- Modify: `src/components/Datepicker.vue:110-157` (props), `src/components/Datepicker.vue:1-31` (template)

- [ ] **Step 1: Add `parseFormat` and `validateOnKeyup` props to `Datepicker.vue`**

In `src/components/Datepicker.vue`, add these two props after the `typeable` prop (line 147):

```javascript
    parseFormat: {
      type: String,
      default: null
    },
    validateOnKeyup: {
      type: Boolean,
      default: false
    },
```

- [ ] **Step 2: Pass the new props through to `DateInput` in the template**

In the `<date-input>` section of the template (around line 3-29), add these two bindings after `:typeable="typeable"`:

```html
      :parseFormat="parseFormat"
      :validateOnKeyup="validateOnKeyup"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Datepicker.vue
git commit -m "feat: add parseFormat and validateOnKeyup props to Datepicker, pass through to DateInput"
```

---

### Task 3: Add new props to `DateInput.vue`

**Files:**
- Modify: `src/components/DateInput.vue:44-66` (props)

- [ ] **Step 1: Add props to `DateInput.vue`**

In `src/components/DateInput.vue`, add these two props after the `typeable` prop (line 63):

```javascript
    parseFormat: String,
    validateOnKeyup: Boolean,
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DateInput.vue
git commit -m "feat: add parseFormat and validateOnKeyup props to DateInput"
```

---

### Task 4: Rewrite `parseTypedDate` and `inputBlurred` methods with tests

**Files:**
- Modify: `src/components/DateInput.vue:41-154` (script section)
- Modify: `test/unit/specs/DateInput/typedDates.spec.js`

- [ ] **Step 1: Write failing tests for format-aware blur parsing**

Replace the entire contents of `test/unit/specs/DateInput/typedDates.spec.js` with:

```javascript
import DateInput from '@/components/DateInput.vue'
import {shallow} from '@vue/test-utils'
import {en} from '@/locale'

describe('DateInput typed dates', () => {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(DateInput, {
      propsData: {
        format: 'dd.MM.yyyy',
        translation: en,
        typeable: true
      }
    })
  })

  describe('blur-only validation (default)', () => {
    it('does not emit typedDate on keyup by default', () => {
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('keyup')
      expect(wrapper.emitted().typedDate).not.toBeDefined()
    })

    it('parses a valid date on blur using dd.MM.yyyy format', () => {
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('blur')
      expect(wrapper.emitted().typedDate).toBeDefined()
      expect(wrapper.emitted().typedDate[0][0]).toBeInstanceOf(Date)
      expect(wrapper.emitted().typedDate[0][0].getFullYear()).toEqual(2018)
      expect(wrapper.emitted().typedDate[0][0].getMonth()).toEqual(3) // April = 3
      expect(wrapper.emitted().typedDate[0][0].getDate()).toEqual(24)
    })

    it('clears an invalid date on blur', () => {
      const input = wrapper.find('input')
      wrapper.vm.input.value = 'not a date'
      input.trigger('blur')
      expect(wrapper.emitted().clearDate).toBeDefined()
    })

    it('clears a date that does not match the format on blur', () => {
      const input = wrapper.find('input')
      wrapper.vm.input.value = '2018-04-24'
      input.trigger('blur')
      expect(wrapper.emitted().clearDate).toBeDefined()
    })
  })

  describe('format-aware parsing with various formats', () => {
    it('parses yyyy-MM-dd format', () => {
      wrapper.setProps({ format: 'yyyy-MM-dd' })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '2018-04-24'
      input.trigger('blur')
      expect(wrapper.emitted().typedDate).toBeDefined()
      expect(wrapper.emitted().typedDate[0][0].getFullYear()).toEqual(2018)
      expect(wrapper.emitted().typedDate[0][0].getMonth()).toEqual(3)
      expect(wrapper.emitted().typedDate[0][0].getDate()).toEqual(24)
    })

    it('parses MM/dd/yyyy format', () => {
      wrapper.setProps({ format: 'MM/dd/yyyy' })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '04/24/2018'
      input.trigger('blur')
      expect(wrapper.emitted().typedDate).toBeDefined()
      expect(wrapper.emitted().typedDate[0][0].getDate()).toEqual(24)
    })

    it('parses dd MMM yyyy format', () => {
      wrapper.setProps({ format: 'dd MMM yyyy' })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24 Apr 2018'
      input.trigger('blur')
      expect(wrapper.emitted().typedDate).toBeDefined()
      expect(wrapper.emitted().typedDate[0][0].getMonth()).toEqual(3)
    })
  })

  describe('parseFormat prop with function format', () => {
    it('uses parseFormat when format is a function', () => {
      wrapper.setProps({
        format: (date) => date.toLocaleDateString(),
        parseFormat: 'DD.MM.YYYY'
      })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('blur')
      expect(wrapper.emitted().typedDate).toBeDefined()
      expect(wrapper.emitted().typedDate[0][0].getDate()).toEqual(24)
    })

    it('falls back to Date.parse when format is a function and no parseFormat', () => {
      wrapper.setProps({
        format: (date) => date.toLocaleDateString()
      })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '2018-04-24'
      input.trigger('blur')
      expect(wrapper.emitted().typedDate).toBeDefined()
    })
  })

  describe('validateOnKeyup backward compatibility', () => {
    it('emits typedDate on keyup when validateOnKeyup is true', () => {
      wrapper.setProps({ validateOnKeyup: true })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('keyup')
      expect(wrapper.emitted().typedDate).toBeDefined()
      expect(wrapper.emitted().typedDate[0][0]).toBeInstanceOf(Date)
    })

    it('does not emit on keyup when validateOnKeyup is false', () => {
      wrapper.setProps({ validateOnKeyup: false })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('keyup')
      expect(wrapper.emitted().typedDate).not.toBeDefined()
    })
  })

  describe('escape and enter handling', () => {
    it('blurs input when escape is pressed', () => {
      const input = wrapper.find('input')
      const blurSpy = jest.spyOn(input.element, 'blur')
      input.trigger('keyup', {keyCode: 27})
      expect(blurSpy).toBeCalled()
    })

    it('blurs input when enter is pressed', () => {
      const input = wrapper.find('input')
      const blurSpy = jest.spyOn(input.element, 'blur')
      input.trigger('keyup', {keyCode: 13})
      expect(blurSpy).toBeCalled()
    })
  })

  describe('typeable=false', () => {
    it('does not parse on blur when typeable is false', () => {
      wrapper.setProps({ typeable: false })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('blur')
      expect(wrapper.emitted().typedDate).not.toBeDefined()
    })
  })

  describe('formattedValue', () => {
    it('returns raw typed string when typedDate is set', () => {
      const dateString = '24.04.2018'
      wrapper.vm.input.value = dateString
      wrapper.setData({ typedDate: dateString })
      wrapper.setProps({ selectedDate: new Date(2018, 3, 24) })
      expect(wrapper.vm.formattedValue).toEqual(dateString)
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest --config test/unit/jest.conf.js test/unit/specs/DateInput/typedDates.spec.js --verbose`
Expected: FAIL — most tests will fail because `parseTypedDate`/`inputBlurred` still use `Date.parse()`

- [ ] **Step 3: Implement the new `parseTypedDate` and `inputBlurred` methods**

In `src/components/DateInput.vue`, add the moment import after the existing import line (line 42):

```javascript
import moment from 'moment'
```

Then add a `getMomentFormat` method and rewrite `parseTypedDate` and `inputBlurred`. Replace the entire `methods` block (lines 103-146) with:

```javascript
  methods: {
    showCalendar () {
      this.$emit('showCalendar')
    },
    /**
     * Get the moment-compatible format string for parsing.
     * Returns null if no format can be determined.
     * @return {String|null}
     */
    getMomentFormat () {
      if (typeof this.format === 'string') {
        return this.utils.toMomentFormat(this.format)
      }
      if (this.parseFormat) {
        return this.parseFormat
      }
      return null
    },
    /**
     * Parse input value as a date using moment or Date.parse fallback.
     * Returns a Date object if valid, or null if invalid.
     * @param {String} value
     * @return {Date|null}
     */
    parseDateFromInput (value) {
      if (!value) {
        return null
      }
      const momentFormat = this.getMomentFormat()
      if (momentFormat) {
        const parsed = moment(value, momentFormat, true)
        return parsed.isValid() ? parsed.toDate() : null
      }
      // Fallback to Date.parse when format is a function with no parseFormat
      const timestamp = Date.parse(value)
      return isNaN(timestamp) ? null : new Date(timestamp)
    },
    /**
     * Attempt to parse a typed date
     * @param {Event} event
     */
    parseTypedDate (event) {
      // close calendar if escape or enter are pressed
      if ([
        27, // escape
        13 // enter
      ].includes(event.keyCode)) {
        this.input.blur()
      }

      if (this.typeable && this.validateOnKeyup) {
        const parsedDate = this.parseDateFromInput(this.input.value)
        if (parsedDate) {
          this.typedDate = this.input.value
          this.$emit('typedDate', parsedDate)
        }
      }
    },
    /**
     * Parse and validate the typed date on blur.
     * If invalid, clear the date.
     */
    inputBlurred () {
      if (this.typeable) {
        const inputValue = this.input.value
        if (inputValue) {
          const parsedDate = this.parseDateFromInput(inputValue)
          if (parsedDate) {
            this.typedDate = inputValue
            this.$emit('typedDate', parsedDate)
          } else {
            this.clearDate()
            this.input.value = null
            this.typedDate = null
          }
        }
      }

      this.$emit('closeCalendar')
    },
    /**
     * emit a clearDate event
     */
    clearDate () {
      this.$emit('clearDate')
    }
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest --config test/unit/jest.conf.js test/unit/specs/DateInput/typedDates.spec.js --verbose`
Expected: All tests PASS

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `npx jest --config test/unit/jest.conf.js --verbose`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/DateInput.vue test/unit/specs/DateInput/typedDates.spec.js
git commit -m "feat: format-aware typed date parsing using moment.js

Replace Date.parse() with moment(input, format, true) for typed input
validation. Parsing now respects the format prop. Validation moved to
blur by default, with validateOnKeyup prop for backward compatibility."
```
