import Component from 'sparkles-component';
const IS_TOUCH_DEVICE = Boolean(!!window && "ontouchstart" in window);

interface DropdownActions {
  open: Function;
  close: Function;
  toggle: Function;
  reposition: Function;
}

interface DropdownApi {
  uniqueId: string;
  isOpen: boolean;
  disabled: boolean;
  actions: DropdownActions
}

interface TriggerArgs {
  eventType?: string
  dropdown: DropdownApi,
  onMouseDown?: (dropdown: DropdownApi, e: MouseEvent) => boolean | undefined;
  onTouchEnd?: (dropdown: DropdownApi, e: TouchEvent) => boolean | undefined;
  onMouseEnter?: (dropdown: DropdownApi, e: MouseEvent) => boolean | undefined;
  onMouseLeave?: (dropdown: DropdownApi, e: MouseEvent) => boolean | undefined;
  onFocus?: (dropdown: DropdownApi, e: FocusEvent) => boolean | undefined;
  onBlur?: (dropdown: DropdownApi, e: FocusEvent) => boolean | undefined;
  onFocusIn?: (dropdown: DropdownApi, e: Event) => boolean | undefined;
  onFocusOut?: (dropdown: DropdownApi, e: Event) => boolean | undefined;
  onKeyDown?: (dropdown: DropdownApi, e: KeyboardEvent) => boolean | undefined;
  onKeyUp?: (dropdown: DropdownApi, e: KeyboardEvent) => boolean | undefined;
  isTouchDevice?: boolean,
  stopPropagation?: boolean
}

export default class BasicDropdownTrigger extends Component<TriggerArgs> {
  triggerEl: HTMLElement | null = null;
  toggleIsBeingHandledByTouchEvents = false;
  eventType = this.args.eventType || 'mousedown';
  _isTouchDevice = Object.hasOwnProperty.call(this.args, 'isTouchDevice') ? this.args.isTouchDevice : IS_TOUCH_DEVICE;
  _hasMoved = false;

  didInsertElement() {
    this.triggerEl = document.querySelector(`[data-ebd-id="${this.args.dropdown.uniqueId}"]`);
    this._addMandatoryHandlers();
    this._addOptionalHandlers();
  }

  private _addMandatoryHandlers() {
    if (this.triggerEl === null) {
      return;
    }
    if (this._isTouchDevice) {
      // If the component opens on click there is no need of any of this, as the device will
      // take care tell apart faux clicks from scrolls.
      this.triggerEl.addEventListener("touchstart", () => {
        document.addEventListener("touchmove", this._touchMoveHandler);
      });
      this.triggerEl.addEventListener("touchend", e => this._handleTouchEnd(e));
    }
    this.triggerEl.addEventListener("mousedown", e => this._handleMouseDown(e));
    this.triggerEl.addEventListener("click", e => this._handleClick(e));
    this.triggerEl.addEventListener('keydown', e => this._handleKeyDown(e));
  }

  private _addOptionalHandlers() {
    if (this.triggerEl === null) {
      return;
    }
    const { onMouseEnter, onMouseLeave, onFocus, onBlur, onFocusIn, onFocusOut, onKeyUp, dropdown } = this.args;
    if (onMouseEnter) {
      this.triggerEl.addEventListener("mouseenter", e => onMouseEnter(this.args.dropdown, e));
    }
    if (onMouseLeave) {
      this.triggerEl.addEventListener('mouseleave', (e) => onMouseLeave(dropdown, e));
    }
    if (onFocus) {
      this.triggerEl.addEventListener('focus', (e) => onFocus(dropdown, e));
    }
    if (onBlur) {
      this.triggerEl.addEventListener('blur', (e) => onBlur(dropdown, e));
    }
    if (onFocusIn) {
      this.triggerEl.addEventListener('focusin', (e) => onFocusIn(dropdown, e));
    }
    if (onFocusOut) {
      this.triggerEl.addEventListener('focusout', (e) => onFocusOut(dropdown, e));
    }
    if (onKeyUp) {
      this.triggerEl.addEventListener('keyup', (e) => onKeyUp(dropdown, e));
    }
  }

  private _handleClick(e: MouseEvent) {
    let { dropdown, stopPropagation, eventType = 'click' } = this.args;
    if (!dropdown || dropdown.disabled) {
      return;
    }
    if (eventType === 'click') {
      if (stopPropagation) {
        e.stopPropagation();
      }
      if (this.toggleIsBeingHandledByTouchEvents) {
        // Some devises have both touchscreen & mouse, and they are not mutually exclusive
        // In those cases the touchdown handler is fired first, and it sets a flag to
        // short-circuit the mouseup so the component is not opened and immediately closed.
        this.toggleIsBeingHandledByTouchEvents = false;
        return;
      }
      dropdown.actions.toggle(e);
    }
  }

  private _handleMouseDown = (e: MouseEvent) => {
    let { dropdown, onMouseDown, stopPropagation, eventType = 'click' } = this.args;

    if (dropdown.disabled || (onMouseDown && onMouseDown(dropdown, e) === false)) {
      return;
    }
    if (eventType === 'mousedown') {
      if (e.button !== 0) { return; }
      if (stopPropagation) {
        e.stopPropagation();
      }
      this._stopTextSelectionUntilMouseup();
      if (this.toggleIsBeingHandledByTouchEvents) {
        // Some devises have both touchscreen & mouse, and they are not mutually exclusive
        // In those cases the touchdown handler is fired first, and it sets a flag to
        // short-circuit the mouseup so the component is not opened and immediately closed.
        this.toggleIsBeingHandledByTouchEvents = false;
        return;
      }
      dropdown.actions.toggle(e);
    }
  }

  private _handleMouseup = () => {
    document.removeEventListener('mouseup', this._handleMouseup, true);
    document.body.classList.remove('ember-basic-dropdown-text-select-disabled');
  }

  private _handleKeyDown(e: KeyboardEvent) {
    let { dropdown, onKeyDown } = this.args;
    if (dropdown.disabled || (onKeyDown && onKeyDown(dropdown, e) === false)) {
      return;
    }
    if (e.keyCode === 13) {  // Enter
      dropdown.actions.toggle(e);
    } else if (e.keyCode === 32) { // Space
      e.preventDefault(); // prevents the space to trigger a scroll page-next
      dropdown.actions.toggle(e);
    } else if (e.keyCode === 27) {
      dropdown.actions.close(e);
    }
  }

  private _touchMoveHandler = () => {
    this._hasMoved = true;
    document.removeEventListener('touchmove', this._touchMoveHandler);
  }

  private _handleTouchEnd = (e: TouchEvent) => {
    this.toggleIsBeingHandledByTouchEvents = true;
    let { dropdown } = this.args;
    if (e && e.defaultPrevented || dropdown.disabled) {
      return;
    }
    if (!this._hasMoved) {
      // execute user-supplied onTouchEnd function before default toggle action;
      // short-circuit default behavior if user-supplied function returns `false`
      if (this.args.onTouchEnd && this.args.onTouchEnd(dropdown, e) === false) {
        return;
      }
      dropdown.actions.toggle(e);
    }
    this._hasMoved = false;
    document.removeEventListener('touchmove', this._touchMoveHandler);
    // This next three lines are stolen from hammertime. This prevents the default
    // behaviour of the touchend, but synthetically trigger a focus and a (delayed) click
    // to simulate natural behaviour.
    if (e.target instanceof HTMLElement) {
      e.target.focus();
    }
    setTimeout(function () {
      if (!e.target) { return; }
      let event: Event;
      try {
        event = document.createEvent('MouseEvents');
        (event as MouseEvent).initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 1, null);
      } catch (e) {
        event = new Event('click');
      }
      e.target.dispatchEvent(event);
    }, 0);
    e.preventDefault();
  }

  private _stopTextSelectionUntilMouseup() {
    document.addEventListener('mouseup', this._handleMouseup, true);
    document.body.classList.add('ember-basic-dropdown-text-select-disabled');
  }
}
