import Component, { tracked } from "sparkles-component";
import { guidFor } from "@ember/object/internals";
import { scheduleOnce } from "@ember/runloop";
import { getOwner } from "@ember/application";
import { DEBUG } from "@glimmer/env";

export default class BasicDropdown extends Component {
  @tracked publicAPI = {
    uniqueId: guidFor(this),
    isOpen: this.args.initiallyOpened || false,
    disabled: this.args.disabled || false,
    actions: {
      open: this.open.bind(this),
      close: this.close.bind(this),
      toggle: this.toggle.bind(this),
      reposition: this.reposition.bind(this)
    }
  };
  get destination() {
    if (this.args.destination !== undefined) {
      return this.args.destination;
    }
    // let config = getOwner(this).resolveRegistration('config:environment');
    // debugger;
    // if (config.environment === 'test') {
      if (DEBUG) {
        let id;
        if (requirejs.has('@ember/test-helpers/dom/get-root-element')) {
          try {
            id = requirejs('@ember/test-helpers/dom/get-root-element').default().id;
          } catch (ex) {
            id = document.querySelector('#ember-testing > .ember-view').id;
          }
        } else {
          id = document.querySelector('#ember-testing > .ember-view').id;
        }
        return id;
      }
    // }
    // return config['ember-basic-dropdown'] && config['ember-basic-dropdown'].destination || 'ember-basic-dropdown-wormhole';
  }

  open(e) {
    if (
      this.publicAPI.disabled ||
      this.publicAPI.isOpen ||
      (this.args.onOpen && this.args.onOpen(this.publicAPI, e) === false)
    ) {
      return;
    }
    this._updateState({ isOpen: true });
    scheduleOnce('afterRender', this.publicAPI.actions.reposition);
  }

  close(e) {
    if (
      this.publicAPI.disabled ||
      !this.publicAPI.isOpen ||
      (this.args.onClose && this.args.onClose(this.publicAPI, e) === false)
    ) {
      return;
    }
    this._updateState({ isOpen: false });
  }

  toggle(e) {
    if (this.publicAPI.isOpen) {
      this.close(e);
    } else {
      this.open(e);
    }
  }

  reposition() {
    // if (!this.publicAPI.isOpen) {
    //   return;
    // }
    // let dropdownElement = document.getElementById(this._dropdownId);
    // let triggerElement = document.querySelector(`[data-ebd-id=${this.publicAPI.uniqueId}-trigger]`);
    // if (!dropdownElement || !triggerElement) {
    //   return;
    // }

    // this.destinationElement = this.destinationElement || document.getElementById(this.get("destination"));
    // let options = this.getProperties("horizontalPosition", "verticalPosition", "matchTriggerWidth", "previousHorizontalPosition", "previousVerticalPosition", "renderInPlace");
    // options.dropdown = this;
    // let positionData = this.get("calculatePosition")(triggerElement, dropdownElement, this.destinationElement, options);
    // return this.applyReposition(triggerElement, dropdownElement, positionData);
  }

  _updateState(changes) {
    this.publicAPI = Object.assign({}, this.publicAPI, changes);
  }
}
