import Component, { tracked } from "sparkles-component";
import { guidFor } from "@ember/object/internals";
import { getOwner } from "@ember/application";
import { DEBUG } from "@glimmer/env";
import calculatePosition, {
  PositionInformation
} from "sparkles-ember-basic-dropdown/utils/calculate-position";

interface DropdownActions {
  open: Function;
  close: Function;
  toggle: Function;
  reposition: (...args: any[]) => {};
}

export interface DropdownApi {
  uniqueId: string;
  isOpen: boolean;
  disabled: boolean;
  actions: DropdownActions
}

interface BasicDropdownArgs {
  calculatePosition?: Function
  destination?: string;
  initiallyOpened?: boolean;
  disabled?: boolean;
  horizontalPosition?: string;
  verticalPosition?: string;
  matchTriggerWidth?: boolean;
  renderInPlace?: boolean;
  otherStyles: object;
  onOpen?: (dropdown: DropdownApi, e: Event) => boolean | undefined;
  onClose?: (dropdown: DropdownApi, e: Event) => boolean | undefined;
  registerAPI?: (dropdown: DropdownApi) => void;
}

interface PositionChanges {
  [k: string]: any
}

const IGNORED_STYLE_ATTRS = ["top", "left", "right", "width", "height"];

export default class BasicDropdown extends Component<BasicDropdownArgs> {
  private calculatePosition = this.args.calculatePosition || calculatePosition;
  private _previousArgs: BasicDropdownArgs = this.args;
  private previousHorizontalPosition?: string;
  private previousVerticalPosition?: string;
  @tracked publicAPI: DropdownApi = {
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
  contentId = `ember-basic-dropdown-content-${this.publicAPI.uniqueId}`;
  destinationElement: Element | null = null;
  top = null;
  left = null;
  right = null;
  width = null;
  height = null;
  @tracked hPosition = null;
  @tracked vPosition = null;
  [k: string]: any;

  constructor(args: BasicDropdownArgs) {
    super(args);
    this._updateState({});
    this.contentId = `ember-basic-dropdown-content-${this.publicAPI.uniqueId}`;
  }

  get destination() {
    if (this.args.destination !== undefined) {
      return this.args.destination;
    }
    let config = getOwner(this).resolveRegistration('config:environment');
    if (config.environment === 'test') {
      if (DEBUG) {
        return requirejs('@ember/test-helpers/dom/get-root-element').default().id;
      }
    }
    return config['ember-basic-dropdown'] && config['ember-basic-dropdown'].destination || 'ember-basic-dropdown-wormhole';
  }

  didUpdate() {
    if (this.args.disabled && !this._previousArgs.disabled) {
      this._disable();
    } else if (this._previousArgs.disabled && !this.args.disabled) {
      this._enable();
    }
    this._previousArgs = this.args;
  }

  open(e: Event) {
    if (
      this.publicAPI.disabled ||
      this.publicAPI.isOpen ||
      (this.args.onOpen && this.args.onOpen(this.publicAPI, e) === false)
    ) {
      return;
    }
    this._updateState({ isOpen: true });
  }

  close(e: Event) {
    if (
      this.publicAPI.disabled ||
      !this.publicAPI.isOpen ||
      (this.args.onClose && this.args.onClose(this.publicAPI, e) === false)
    ) {
      return;
    }
    this.hPosition = null;
    this.vPosition = null;
    this.top = null;
    this.left = null;
    this.right = null;
    this.width = null;
    this.height = null;
    this._updateState({ isOpen: false });
  }

  toggle(e: Event) {
    if (this.publicAPI.isOpen) {
      this.close(e);
    } else {
      this.open(e);
    }
  }

  reposition() {
    if (!this.publicAPI.isOpen) {
      return;
    }
    let dropdownElement = document.getElementById(this.contentId);
    let triggerElement = document.querySelector(`[data-ebd-id=${this.publicAPI.uniqueId}]`);
    if (!dropdownElement || !triggerElement) {
      return;
    }

    this.destinationElement = this.destinationElement || document.getElementById(this.destination);

    let options = {
      horizontalPosition: this.args.horizontalPosition || 'auto',
      verticalPosition: this.args.verticalPosition || 'auto',
      matchTriggerWidth: this.args.matchTriggerWidth || false,
      previousHorizontalPosition: this.previousHorizontalPosition,
      previousVerticalPosition: this.previousVerticalPosition,
      renderInPlace: this.args.renderInPlace || false,
      dropdown: this
    };
    let positionData = this.calculatePosition(triggerElement, dropdownElement, this.destinationElement, options);
    return this._applyReposition(triggerElement, dropdownElement, positionData);
  }

  private _updateState(changes: object) {
    this.publicAPI = Object.assign({}, this.publicAPI, changes);
    if (this.args.registerAPI) {
      this.args.registerAPI(this.publicAPI);
    }
  }

  private _applyReposition(_trigger: Element, dropdown: Element, positions: PositionInformation) {
    let changes: PositionChanges = {
      hPosition: positions.horizontalPosition,
      vPosition: positions.verticalPosition,
      otherStyles: this.args.otherStyles || {}
    };

    if (positions.style) {
      if (positions.style.top !== undefined) {
        changes.top = `${positions.style.top}px`;
      }
      // The component can be aligned from the right or from the left, but not from both.
      if (positions.style.left !== undefined) {
        changes.left = `${positions.style.left}px`;
        changes.right = null;
        // Since we set the first run manually we may need to unset the `right` property.
        if (positions.style.right !== undefined) {
          positions.style.right = undefined;
        }
      } else if (positions.style.right !== undefined) {
        changes.right = `${positions.style.right}px`;
        changes.left = null;
      }
      if (positions.style.width !== undefined) {
        changes.width = `${positions.style.width}px`;
      }
      if (positions.style.height !== undefined) {
        changes.height = `${positions.style.height}px`;
      }

      Object.keys(positions.style).forEach((attr) => {
        if (IGNORED_STYLE_ATTRS.indexOf(attr) === -1) {
          if (changes[attr] !== positions.style[attr]) {
            changes.otherStyles[attr] = positions.style[attr];
          }
        }
      });
      if (this.top === null) {
        // Bypass Ember on the first reposition only to avoid flickering.
        let cssRules = [];
        for (let prop in positions.style) {
          if (positions.style[prop] !== undefined) {
            if (typeof positions.style[prop] === 'number') {
              cssRules.push(`${prop}: ${positions.style[prop]}px`)
            } else {
              cssRules.push(`${prop}: ${positions.style[prop]}`)
            }
          }
        }
        dropdown.setAttribute('style', cssRules.join(';'));
      }
    }
    for (let prop in changes) {
      this[prop] = changes[prop];
    }
    this.previousHorizontalPosition = positions.horizontalPosition;
    this.previousVerticalPosition = positions.verticalPosition;
    return changes;
  }

  private _disable() {
    if (this.publicAPI.isOpen) {
      this.publicAPI.actions.close();
    }
    this._updateState({ disabled: true });
  }

  private _enable() {
    this._updateState({ disabled: false });
  }
}
