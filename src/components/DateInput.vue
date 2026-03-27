<template>
  <div :class="{'input-group' : bootstrapStyling}">
    <!-- Calendar Button -->
    <span v-if="calendarButton" class="vdp-datepicker__calendar-button" :class="{'input-group-prepend' : bootstrapStyling}" @click="showCalendar" v-bind:style="{'cursor:not-allowed;' : disabled}">
      <span :class="{'input-group-text' : bootstrapStyling}">
        <i :class="calendarButtonIcon">
          {{ calendarButtonIconContent }}
          <span v-if="!calendarButtonIcon">&hellip;</span>
        </i>
      </span>
    </span>
    <!-- Input -->
    <input
      :type="inline ? 'hidden' : 'text'"
      :class="computedInputClass"
      :name="name"
      :ref="refName"
      :id="id"
      :value="formattedValue"
      :open-date="openDate"
      :placeholder="placeholder"
      :clear-button="clearButton"
      :disabled="disabled"
      :required="required"
      :readonly="!typeable"
      @click="showCalendar"
      @keyup="parseTypedDate"
      @blur="inputBlurred"
      autocomplete="off">
    <!-- Clear Button -->
    <span v-if="clearButton && selectedDate" class="vdp-datepicker__clear-button" :class="{'input-group-append' : bootstrapStyling}" @click="clearDate()">
      <span :class="{'input-group-text' : bootstrapStyling}">
        <i :class="clearButtonIcon">
          <span v-if="!clearButtonIcon">&times;</span>
        </i>
      </span>
    </span>
    <slot name="afterDateInput"></slot>
  </div>
</template>
<script>
import moment from 'moment'
import { makeDateUtils } from '../utils/DateUtils'
export default {
  props: {
    selectedDate: Date,
    resetTypedDate: [Date],
    format: [String, Function],
    translation: Object,
    inline: Boolean,
    id: String,
    name: String,
    refName: String,
    openDate: Date,
    placeholder: String,
    inputClass: [String, Object, Array],
    clearButton: Boolean,
    clearButtonIcon: String,
    calendarButton: Boolean,
    calendarButtonIcon: String,
    calendarButtonIconContent: String,
    disabled: Boolean,
    required: Boolean,
    typeable: Boolean,
    parseFormat: String,
    validateOnKeyup: Boolean,
    initialValue: Date,
    resetOnInvalidValue: Boolean,
    disabledDates: Object,
    bootstrapStyling: Boolean,
    useUtc: Boolean
  },
  data () {
    const constructedDateUtils = makeDateUtils(this.useUtc)
    return {
      input: null,
      typedDate: false,
      utils: constructedDateUtils
    }
  },
  computed: {
    formattedValue () {
      if (!this.selectedDate) {
        return null
      }
      if (this.typedDate) {
        return this.typedDate
      }
      return typeof this.format === 'function'
        ? this.format(this.selectedDate)
        : this.utils.formatDate(new Date(this.selectedDate), this.format, this.translation)
    },

    computedInputClass () {
      if (this.bootstrapStyling) {
        if (typeof this.inputClass === 'string') {
          return [this.inputClass, 'form-control'].join(' ')
        }
        return {'form-control': true, ...this.inputClass}
      }
      return this.inputClass
    }
  },
  watch: {
    resetTypedDate () {
      this.typedDate = false
    }
  },
  methods: {
    showCalendar () {
      this.$emit('showCalendar')
    },
    getMomentFormat () {
      if (typeof this.format === 'string') {
        return this.utils.toMomentFormat(this.format)
      }
      if (this.parseFormat) {
        return this.parseFormat
      }
      return null
    },
    parseDateFromInput (value) {
      if (!value) {
        return null
      }
      const momentFormat = this.getMomentFormat()
      if (momentFormat) {
        const parsed = moment(value, momentFormat, true)
        return parsed.isValid() ? parsed.toDate() : null
      }
      const timestamp = Date.parse(value)
      return isNaN(timestamp) ? null : new Date(timestamp)
    },
    parseTypedDate (event) {
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
    inputBlurred () {
      if (this.typeable) {
        const inputValue = this.input.value
        if (inputValue) {
          const parsedDate = this.parseDateFromInput(inputValue)
          if (parsedDate) {
            if (this.utils.isDisabledDate(parsedDate, this.disabledDates)) {
              this.$emit('disabledDateInput', parsedDate)
              this.resetOrClear()
            } else {
              this.typedDate = inputValue
              this.$emit('typedDate', parsedDate)
            }
          } else {
            this.$emit('invalidInput', inputValue)
            this.resetOrClear()
          }
        }
      }

      this.$emit('closeCalendar')
    },
    resetOrClear () {
      if (this.resetOnInvalidValue && this.initialValue) {
        this.typedDate = false
        this.$emit('typedDate', this.initialValue)
      } else {
        this.clearDate()
        this.input.value = null
        this.typedDate = null
      }
    },
    clearDate () {
      this.$emit('clearDate')
    }
  },
  mounted () {
    this.input = this.$el.querySelector('input')
  }
}
// eslint-disable-next-line
;
</script>
