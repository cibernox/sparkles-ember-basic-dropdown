import Component, { tracked } from "sparkles-component";
const IS_TOUCH_DEVICE = Boolean(!!window && "ontouchstart" in window);

export default class BasicDropdownTrigger extends Component {
  _handleMouseDown = this._handleMouseDown.bind(this);
  _touchMoveHandler = this._touchMoveHandler.bind(this);

  @tracked('args.eventType')
  get eventType() {
    return this.args.eventType || 'mousedown';
  }

  didInsertElement() {
    this.triggerEl = document.querySelector(`[data-ebd-id="${this.args.dropdown.uniqueId}"]`);
    this._addMandatoryHandlers();
    this._addOptionalHandlers();
  }

  _addMandatoryHandlers() {
    // this.triggerEl.addEventListener("mousedown", this._handleMouseDown);
    if (IS_TOUCH_DEVICE) {
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

  _addOptionalHandlers() {
    if (this.args.onMouseEnter) {
      this.triggerEl.addEventListener('mouseenter', (e) => this.args.onMouseEnter(this.args.dropdown, e));
    }
    if (this.args.onMouseLeave) {
      this.triggerEl.addEventListener('mouseleave', (e) => this.args.onMouseLeave(this.args.dropdown, e));
    }
    if (this.args.onFocus) {
      this.triggerEl.addEventListener('focus', (e) => this.args.onFocus(this.args.dropdown, e));
    }
    if (this.args.onBlur) {
      this.triggerEl.addEventListener('blur', (e) => this.args.onBlur(this.args.dropdown, e));
    }
    if (this.args.onFocusIn) {
      this.triggerEl.addEventListener('focusin', (e) => this.args.onFocusIn(this.args.dropdown, e));
    }
    if (this.args.onFocusOut) {
      this.triggerEl.addEventListener('focusout', (e) => this.args.onFocusOut(this.args.dropdown, e));
    }
    if (this.args.onKeyUp) {
      this.triggerEl.addEventListener('keyup', (e) => this.args.onKeyUp(this.args.dropdown, e));
    }
  }

  _handleClick(e) {
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

  _handleMouseDown(e) {
    let { dropdown, onMouseDown, stopPropagation, eventType = "click" } = this.args;

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

  _handleKeyDown(e) {
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

  _touchMoveHandler() {
    this.hasMoved = true;
    document.removeEventListener('touchmove', this._touchMoveHandler);
  }

  _handleTouchEnd(e) {
    this.toggleIsBeingHandledByTouchEvents = true;
    let dropdown = this.get('dropdown');
    if (e && e.defaultPrevented || dropdown.disabled) {
      return;
    }
    if (!this.hasMoved) {
      // execute user-supplied onTouchEnd function before default toggle action;
      // short-circuit default behavior if user-supplied function returns `false`
      let onTouchEnd = this.get('onTouchEnd');
      if (onTouchEnd && onTouchEnd(dropdown, e) === false) {
        return;
      }
      dropdown.actions.toggle(e);
    }
    this.hasMoved = false;
    document.removeEventListener('touchmove', this._touchMoveHandler);
    // This next three lines are stolen from hammertime. This prevents the default
    // behaviour of the touchend, but synthetically trigger a focus and a (delayed) click
    // to simulate natural behaviour.
    e.target.focus();
    setTimeout(function () {
      if (!e.target) { return; }
      let event;
      try {
        event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, true, window);
      } catch (e) {
        event = new Event('click');
      } finally {
        e.target.dispatchEvent(event);
      }
    }, 0);
    e.preventDefault();
  }

  _stopTextSelectionUntilMouseup() {
    document.addEventListener('mouseup', this._mouseupHandler, true);
    document.body.classList.add('ember-basic-dropdown-text-select-disabled');
  }
}
