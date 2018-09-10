import Component, { tracked } from "sparkles-component";

export default class BasicDropdownTrigger extends Component {
  _handleMouseDown = this._handleMouseDown.bind(this);

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
    this.triggerEl.addEventListener("mousedown", this._handleMouseDown);
    // if (this.get("isTouchDevice")) {
    //   // If the component opens on click there is no need of any of this, as the device will
    //   // take care tell apart faux clicks from scrolls.
    //   this.element.addEventListener("touchstart", () => {
    //     document.addEventListener("touchmove", this._touchMoveHandler);
    //   });
    //   this.element.addEventListener("touchend", e =>
    //     this.send("handleTouchEnd", e)
    //   );
    // }
    // this.element.addEventListener("mousedown", e =>
    //   this.send("handleMouseDown", e)
    // );
    // this.element.addEventListener("click", e => {
    //   if (!this.get("isDestroyed")) {
    //     this.send("handleClick", e);
    //   }
    // });
    // this.element.addEventListener("keydown", e =>
    //   this.send("handleKeyDown", e)
    // );
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

  _handleMouseDown(e) {
    if (
      this.args.dropdown.disabled ||
      (this.args.onMouseDown && this.args.onMouseDown(this.args.dropdown, e) === false)
    ) {
      return;
    }
    if (this.eventType === 'mousedown') {
      if (e.button !== 0) { return; }
      if (this.args.stopPropagation) {
        e.args.stopPropagation();
      }
      // this.stopTextSelectionUntilMouseup();
      // if (this.toggleIsBeingHandledByTouchEvents) {
      //   // Some devises have both touchscreen & mouse, and they are not mutually exclusive
      //   // In those cases the touchdown handler is fired first, and it sets a flag to
      //   // short-circuit the mouseup so the component is not opened and immediately closed.
      //   this.toggleIsBeingHandledByTouchEvents = false;
      //   return;
      // }
      this.args.dropdown.actions.toggle(e);
    }
  }
}
