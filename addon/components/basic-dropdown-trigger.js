import Component, { tracked } from "sparkles-component";

export default class BasicDropdownTrigger extends Component {
  _handleMouseDown = this._handleMouseDown.bind(this);

  @tracked('args.eventType')
  get eventType() {
    return this.args.eventType || 'mousedown';
  }

  didInsertElement() {
    super.didInsertElement(...arguments);
    this.triggerEl = document.querySelector(`[data-ebd-id="${this.args.dropdown.uniqueId}"]`);
    this.triggerEl.addEventListener('mousedown', this._handleMouseDown);
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
