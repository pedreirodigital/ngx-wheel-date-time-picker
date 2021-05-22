import {
  Directive,
  ElementRef,
  forwardRef,
  HostBinding,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[wheelDateTimePicker]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePickerDirective),
      multi: true,
    },
  ],
})
export class DateTimePickerDirective implements OnInit, ControlValueAccessor {
  @HostBinding('class.focused') private isFocused: boolean;
  @Input('baseZIndex') baseZIndex = 0;
  @Input('format') format = 'dd/mm/yyyy hh:mm';
  @Input('stepTime') stepTime = 10;
  @Input('minDate') minDate;
  @Input('maxDate') maxDate;
  @Input('minDateToday') minDateToday = false;
  @Input('maxDateToday') maxDateToday = false;
  @HostBinding('attr.value') private _value: any = '20/05/2021 18:00';
  itemHeight = 24;
  itemsBefore = 6;
  lastDayFromMonth;
  containerClass = 'date-time-picker';
  timeoutToAutoClose;
  yearContainer;
  monthContainer;
  dayContainer;
  timeContainer;

  selectedYear;
  selectedMonth;
  selectedDay;
  selectedHour;

  eventClickOutside;
  hours = [];
  year = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];
  monthsInitials = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  monthsFullName = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  constructor(private el: ElementRef) {
    this.el.nativeElement.setAttribute('readonly', true);
  }

  ngOnInit() {
    this.generateHoursFromStep();

    if (this.minDateToday) {
      this.minDate = new Date();
    }
  }

  generateHoursFromStep() {
    this.hours = [...Array(1440 / this.stepTime)].map((value, index) => {
      let minutes = index * this.stepTime;
      let h = String(parseInt(String(minutes / 60)));
      if (h.length == 1) h = '0' + h;
      let m = String(minutes % 60);
      if (m.length == 1) m = '0' + m;
      return `${h}:${m}`;
    });
  }

  startDateTime(datetime) {
    try {
      //TODO Otimizar para usar regex
      if (
        datetime.length === 19 &&
        datetime.indexOf('-') !== -1 &&
        datetime.indexOf(':') !== -1
      ) {
        const [year, month, day] = datetime.split(' ').shift().split('-');
        const [hour, minute] = datetime.split(' ').pop().split(':');
        this.setDateTime(year, month, day, `${hour}:${minute}`);
      }
    } catch (err) {}
  }

  get unformatedDateTime() {
    const month =
      this.selectedMonth.length === 1
        ? `0${this.selectedMonth}`
        : this.selectedMonth;
    const day =
      String(this.selectedDay).length === 1
        ? `0${this.selectedDay}`
        : this.selectedDay;
    return `${this.selectedYear}-${month}-${day} ${this.selectedHour}`;
  }
  get formatedDateTime() {
    const month =
      this.selectedMonth.length === 1
        ? `0${this.selectedMonth}`
        : this.selectedMonth;
    const day =
      String(this.selectedDay).length === 1
        ? `0${this.selectedDay}`
        : this.selectedDay;
    return `${day}/${month}/${this.selectedYear} ${this.selectedHour}`;
  }

  setDateTime(year = null, month = null, day = null, hour = null) {
    this.selectedYear = year ? year : this.selectedYear;
    this.selectedMonth = month ? month : this.selectedMonth;
    this.selectedDay = day ? day : this.selectedDay;
    this.selectedHour = hour ? hour : this.selectedHour;

    if (
      this.selectedYear &&
      this.selectedMonth &&
      this.selectedDay &&
      this.selectedHour
    ) {
      this.rawValue = this.unformatedDateTime;
      this.value = this.formatedDateTime;
      this.el.nativeElement.value = this.formatedDateTime;
    }
  }

  @HostListener('focusin', ['$event']) onFocus(e) {
    this.renderDateTimePicker();
    this.startTimeout(2000);
    if (this.yearContainer) {
      this.goTo('yearContainer', this.selectedYear);
    }
    if (this.selectedMonth) {
      this.goTo('monthContainer', this.selectedMonth);
    }
    if (this.selectedDay) {
      this.goTo('dayContainer', this.selectedDay);
    }
    if (this.selectedHour) {
      this.goTo('timeContainer', this.selectedHour);
    }
  }

  get rootContainer() {
    return this.find(`.${this.containerClass}`);
  }

  disableScroll() {
    this.addClass(document.body, 'stop-scrolling');
  }

  enableScroll() {
    this.removeClass(document.body, 'stop-scrolling');
  }

  styleContainer: any = {
    background: 'rgba(250,250,250,1)',
    width: '430px',
    height: '290px',
    position: 'fixed',
    zIndex: String(1000 + this.baseZIndex),
    border: '1px solid silver',
    'box-shadow': '2px 2px 2px silver',
    'border-radius': '5px',
    overflow: 'hidden',
  };

  closeDateTimePicker() {
    if (this.rootContainer) {
      this.rootContainer.remove();
      this.el.nativeElement.blur();
      this.yearContainer.removeEventListener('mouseweel', () => {});
      this.monthContainer.removeEventListener('mouseweel', () => {});
      this.dayContainer.removeEventListener('mouseweel', () => {});
      this.timeContainer.removeEventListener('mouseweel', () => {});
    }
    this.enableScroll();
  }

  startTimeout(timer = 1000) {
    this.renewTimeout();
    this.timeoutToAutoClose = setTimeout(() => {
      this.closeDateTimePicker();
      clearTimeout(this.timeoutToAutoClose);
    }, timer);
  }
  renewTimeout() {
    if (this.timeoutToAutoClose) clearTimeout(this.timeoutToAutoClose);
  }

  renderDateTimePicker() {
    let container = this.newElement('div');

    if (this.rootContainer) {
      this.rootContainer.remove();
    }

    container.classList.add(this.containerClass);
    let elPosition = this.el.nativeElement.getBoundingClientRect();

    container.addEventListener('mouseleave', () => {
      this.startTimeout();
    });
    container.addEventListener('mouseenter', () => {
      this.renewTimeout();
    });

    const windowWidth = parseInt(String(window.innerWidth));
    const left = parseInt(elPosition.left);
    const width = parseInt(elPosition.width);
    const right = windowWidth - (left + width);

    (this.styleContainer.top = `${parseInt(
      elPosition.top + elPosition.height + 2
    )}px`),
      (this.styleContainer.left = `${left}px`);
    if (left + 410 > windowWidth) {
      delete this.styleContainer.left;
      this.styleContainer.right = `${right}px`;
    }
    container = this.style(container, this.styleContainer);

    this.renderYearContainer();
    container.append(this.yearContainer);
    this.renderMothContainer();
    container.append(this.monthContainer);
    this.renderDayContainer();
    container.append(this.dayContainer);
    this.renderTimeContainer();
    container.append(this.timeContainer);
    document.body.append(container);
    this.disableScroll();
  }

  renderYearContainer() {
    this.yearContainer = this.newElement('div');
    this.addClass(this.yearContainer, 'year-container');
    this.yearContainer.addEventListener('mousewheel', (e) => {
      this.whellContainer('yearContainer', e.deltaY < 0);
    });
  }

  renderMothContainer() {
    this.monthContainer = this.newElement('div');
    this.addClass(this.monthContainer, 'month-container');

    let innerContainer = this.newElement('div');
    this.monthContainer.addEventListener('mousewheel', (e) => {
      this.whellContainer('monthContainer', e.deltaY < 0);
    });
    this.addClass(innerContainer, 'dtp-container');

    let marginTop = this.itemsBefore * this.itemHeight;
    this.monthsInitials.forEach((m, index) => {
      let value: any = index + 1;
      if (String(value).length === 1) value = '0' + value;
      marginTop -= this.itemHeight;
      let el = this.newElement('p');
      el.classList.add('month');
      el.setAttribute('value', value);
      el.setAttribute('index', index);
      el.addEventListener('click', () => {
        this.goTo('monthContainer', value);
        this.goTo('dayContainer', this.selectedDay ? this.selectedDay : 1);
      });
      el.innerHTML = m;
      innerContainer.appendChild(el);
    });
    this.monthContainer.appendChild(innerContainer);
  }

  renderDayContainer() {
    if (!this.dayContainer) {
      this.dayContainer = this.newElement('div', 'day-container');
      this.dayContainer.addEventListener('mousewheel', (e) => {
        this.whellContainer('dayContainer', e.deltaY < 0);
      });
      let innerContainer = this.newElement('div', 'dtp-container');
      this.style(innerContainer, 'padding', '0px');

      const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
      let daysOfWeekContainer = this.newElement(
        'div',
        'days-of-week-container'
      );
      days.forEach((d) => {
        let dayOfWeek = this.newElement('div', 'day-of-week');
        dayOfWeek.innerHTML = d;
        daysOfWeekContainer.appendChild(dayOfWeek);
      });
      innerContainer.appendChild(daysOfWeekContainer);
      let daysContainer = this.newElement('div', 'weeks');
      innerContainer.appendChild(daysContainer);
      this.dayContainer.appendChild(innerContainer);
    } else {
      let month = parseInt(this.selectedMonth);
      this.lastDayFromMonth = new Date(this.selectedYear, month, 0).getDate();

      let weeksContainer = this.dayContainer.querySelector('.weeks');
      weeksContainer.innerHTML = '';
      let weeks = {};
      for (let day = 1; day <= this.lastDayFromMonth; day++) {
        let date = new Date(
          this.selectedYear,
          parseInt(this.selectedMonth) - 1,
          day
        );
        const week = this.getWeekOfYear(date);
        const dayofWeek = date.getDay();
        if (!weeks[week]) weeks[week] = {};
        if (!weeks[week][dayofWeek]) weeks[week][dayofWeek] = day;
      }

      Object.keys(weeks).forEach((week) => {
        let weekContainer = this.newElement('div', 'week');
        for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
          const day = weeks[week][dayOfWeek] || null;
          let dayContainer = this.newElement('div', 'day');
          dayContainer.setAttribute('value', day);
          this.style(dayContainer, 'float', 'left');
          this.style(dayContainer, 'width', '40px');
          this.style(dayContainer, 'height', '40px');
          this.style(dayContainer, 'textAlign', 'center');
          this.style(dayContainer, 'float', 'left');

          dayContainer.innerHTML = day || '';
          if (day) {
            let date = new Date(
              parseInt(this.selectedYear),
              parseInt(this.selectedMonth) - 1,
              parseInt(day),
              parseInt(this.selectedHour.split(':').shift()),
              parseInt(this.selectedHour.split(':').pop())
            );

            let afterMinDate = this.minDate ? date >= this.minDate : true;
            let breforeMaxDate = this.maxDate ? date <= this.maxDate : true;

            if (!afterMinDate || !breforeMaxDate) {
              this.addClass(dayContainer, 'disabled');
            } else {
              dayContainer.addEventListener('click', () => {
                this.goTo('dayContainer', day);
              });
            }
          } else {
            this.addClass(dayContainer, 'empty');
          }

          weekContainer.appendChild(dayContainer);
        }
        weeksContainer.appendChild(weekContainer);
      });
    }
  }

  getWeekOfYear(date) {
    const firstDayOfYear: any = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  renderTimeContainer() {
    this.timeContainer = this.newElement('div');
    this.timeContainer.classList.add('time-container');
    this.timeContainer.addEventListener('mousewheel', (e) => {
      this.whellContainer('timeContainer', e.deltaY < 0);
    });

    let innerContainer = this.newElement('div');

    innerContainer.classList.add('dtp-container');

    let marginTop = this.itemsBefore * this.itemHeight + this.itemHeight;
    let count = 0;

    this.hours.forEach((h) => {
      marginTop -= this.itemHeight;
      let el = this.newElement('p');
      el.classList.add('hour');
      el.setAttribute('value', h);
      el.setAttribute('marginTop', String(marginTop));
      el.setAttribute('index', String(count++));
      el.addEventListener('click', () => {
        this.goTo('timeContainer', h);
      });
      el.innerHTML = h;
      innerContainer.appendChild(el);
    });
    this.timeContainer.appendChild(innerContainer);
  }

  whellContainer(rootContainer, up) {
    if (rootContainer === 'yearContainer') {
      this.goTo(
        'yearContainer',
        up ? --this.selectedYear : ++this.selectedYear
      );
      this.goTo('monthContainer', this.selectedMonth);
      this.goTo('dayContainer', this.selectedDay);
    } else if (rootContainer === 'dayContainer') {
      let nextDay = parseInt(this.selectedDay);
      nextDay = up ? nextDay - 1 : nextDay + 1;

      if (nextDay <= 0) {
        this.whellContainer('monthContainer', true);
        this.goTo('dayContainer', this.lastDayFromMonth);
      } else if (nextDay > this.lastDayFromMonth) {
        this.whellContainer('monthContainer', false);
        this.goTo('dayContainer', 1);
      } else {
        this.goTo('dayContainer', nextDay);
      }
    } else {
      let container = this[rootContainer].querySelector('.dtp-container');
      let selectedIndex = parseInt(
        container.querySelector('.selected').getAttribute('index')
      );
      if (up) selectedIndex--;
      else selectedIndex++;

      let nextItem = container.querySelector(`[index="${selectedIndex}"]`);
      if (nextItem) {
        let value = nextItem.getAttribute('value');
        this.goTo(rootContainer, value);
        if (rootContainer === 'monthContainer') {
          this.goTo('dayContainer', 1);
        }
      } else {
        if (rootContainer === 'monthContainer') {
          if (selectedIndex === 12) {
            this.goTo('yearContainer', ++this.selectedYear);
            this.goTo('monthContainer', '01');
          } else {
            this.goTo('yearContainer', --this.selectedYear);
            this.goTo('monthContainer', '12');
          }
        }
      }
    }
  }

  async goTo(rootContainer, value, updateValue = true) {
    try {
      if (rootContainer !== 'yearContainer') {
        let container = this[rootContainer].querySelector('.dtp-container');
        let item = container.querySelector(`[value="${value}"]`);
        this.removeClassFromAllElements(container, `[value]`, 'selected');
        this.addClass(item, 'selected');

        let marginTop = item.getAttribute('marginTop');
        container.style.marginTop = `${marginTop}px`;

        if (rootContainer === 'monthContainer') {
          this.selectedMonth = value;
          this.renderDayContainer();
        } else if (rootContainer === 'dayContainer') {
          this.selectedDay = value;
        } else if (rootContainer === 'timeContainer') {
          this.selectedHour = value;
        }
      } else {
        this.selectedYear = value;
        this.find('.year-container').innerHTML = this.selectedYear;
      }
      this.setDateTime();

      this.setGradient();
    } catch (err) {
      console.error('Deu erro', rootContainer, value);
    }
  }

  setGradient() {}

  newElement(el, classString = 'class-string') {
    el = document.createElement(el);
    this.addClass(el, classString);
    return el;
  }

  padStart(text, length, character) {
    while (String(text).length < length) {
      text = character + text;
    }
    return text;
  }

  style(el, style, value = null) {
    if (el) {
      if (typeof style === 'string') {
        el.style.cssText = `${style}: ${value}`;
      } else {
        el.style.cssText = Object.keys(style)
          .map((key) => `${key}: ${style[key]}`)
          .join('; ');
      }
    }
    return el;
  }

  find(selector) {
    return document.querySelector(selector);
  }
  findAll(selector) {
    return document.querySelectorAll(selector);
  }

  addClass(el, value) {
    if (el) {
      el.classList.add(value);
    }
  }

  removeClass(el, value) {
    if (el) {
      el.classList.remove(value);
    }
  }

  removeClassFromAllElements(container, selector, classString) {
    container.querySelectorAll(selector).forEach((el) => {
      this.removeClass(el, classString);
    });
  }

  rawValue;

  /*CONTROL VALUE ACCESSOR*/
  set value(value) {
    this._value = value;
    this.onChange(this.rawValue);
    this.onTouched(this.rawValue);
  }

  onChange(value) {}

  onTouched(value) {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {}

  writeValue(obj: any): void {
    this.startDateTime(obj);
    this.value = obj;
  }
}

