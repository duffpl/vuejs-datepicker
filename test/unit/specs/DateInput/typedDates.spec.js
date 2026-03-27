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

  describe('invalidInput event', () => {
    it('emits invalidInput with the raw string on invalid input', () => {
      const input = wrapper.find('input')
      wrapper.vm.input.value = 'garbage'
      input.trigger('blur')
      expect(wrapper.emitted().invalidInput).toBeDefined()
      expect(wrapper.emitted().invalidInput[0][0]).toEqual('garbage')
    })

    it('does not emit invalidInput on valid input', () => {
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('blur')
      expect(wrapper.emitted().invalidInput).not.toBeDefined()
    })
  })

  describe('resetOnInvalidValue', () => {
    it('resets to initialValue on invalid input when resetOnInvalidValue is true', () => {
      const initial = new Date(2020, 0, 1)
      wrapper.setProps({
        resetOnInvalidValue: true,
        initialValue: initial
      })
      const input = wrapper.find('input')
      wrapper.vm.input.value = 'garbage'
      input.trigger('blur')
      expect(wrapper.emitted().typedDate).toBeDefined()
      expect(wrapper.emitted().typedDate[0][0].getTime()).toEqual(initial.getTime())
    })

    it('clears the field when resetOnInvalidValue is true but no initialValue', () => {
      wrapper.setProps({ resetOnInvalidValue: true })
      const input = wrapper.find('input')
      wrapper.vm.input.value = 'garbage'
      input.trigger('blur')
      expect(wrapper.emitted().clearDate).toBeDefined()
    })

    it('clears the field when resetOnInvalidValue is false (default)', () => {
      const input = wrapper.find('input')
      wrapper.vm.input.value = 'garbage'
      input.trigger('blur')
      expect(wrapper.emitted().clearDate).toBeDefined()
    })

    it('emits invalidInput before resetting to initialValue', () => {
      const initial = new Date(2020, 0, 1)
      wrapper.setProps({
        resetOnInvalidValue: true,
        initialValue: initial
      })
      const input = wrapper.find('input')
      wrapper.vm.input.value = 'bad'
      input.trigger('blur')
      expect(wrapper.emitted().invalidInput).toBeDefined()
      expect(wrapper.emitted().invalidInput[0][0]).toEqual('bad')
      expect(wrapper.emitted().typedDate).toBeDefined()
    })
  })

  describe('disabled date validation on typed input', () => {
    it('emits disabledDateInput when typed date is disabled', () => {
      wrapper.setProps({
        disabledDates: { from: new Date(2018, 0, 1) }
      })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('blur')
      expect(wrapper.emitted().disabledDateInput).toBeDefined()
      expect(wrapper.emitted().disabledDateInput[0][0]).toBeInstanceOf(Date)
      expect(wrapper.emitted().disabledDateInput[0][0].getDate()).toEqual(24)
      expect(wrapper.emitted().typedDate).not.toBeDefined()
    })

    it('does not emit disabledDateInput when typed date is not disabled', () => {
      wrapper.setProps({
        disabledDates: { from: new Date(2020, 0, 1) }
      })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('blur')
      expect(wrapper.emitted().disabledDateInput).not.toBeDefined()
      expect(wrapper.emitted().typedDate).toBeDefined()
    })

    it('resets to initialValue when disabled date typed and resetOnInvalidValue is true', () => {
      const initial = new Date(2017, 5, 15)
      wrapper.setProps({
        disabledDates: { from: new Date(2018, 0, 1) },
        resetOnInvalidValue: true,
        initialValue: initial
      })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('blur')
      expect(wrapper.emitted().disabledDateInput).toBeDefined()
      expect(wrapper.emitted().typedDate).toBeDefined()
      expect(wrapper.emitted().typedDate[0][0].getTime()).toEqual(initial.getTime())
    })

    it('clears when disabled date typed and no initialValue', () => {
      wrapper.setProps({
        disabledDates: { from: new Date(2018, 0, 1) }
      })
      const input = wrapper.find('input')
      wrapper.vm.input.value = '24.04.2018'
      input.trigger('blur')
      expect(wrapper.emitted().disabledDateInput).toBeDefined()
      expect(wrapper.emitted().clearDate).toBeDefined()
    })
  })
})
