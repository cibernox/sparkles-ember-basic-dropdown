import Component from 'sparkles-component';
import { DropdownApi } from './basic-dropdown';
import { getOwner } from '@ember/application';
import { scheduleOnce, join } from '@ember/runloop';
import { getScrollParent } from 'sparkles-ember-basic-dropdown/utils/calculate-position';
import {
  distributeScroll,
  getAvailableScroll,
  getScrollDeltas
} from 'sparkles-ember-basic-dropdown/utils/scroll-helpers';

const IS_TOUCH_DEVICE = Boolean(!!window && 'ontouchstart' in window);

interface BasicDropdownContentInnerArgs {
  id: string;
  dropdown: DropdownApi;
  preventScroll?: boolean
  onFocusIn?: (dropdown: DropdownApi, e: Event) => boolean | undefined;
  onFocusOut?: (dropdown: DropdownApi, e: Event) => boolean | undefined;
  onMouseEnter?: (dropdown: DropdownApi, e: MouseEvent) => boolean | undefined;
  onMouseLeave?: (dropdown: DropdownApi, e: MouseEvent) => boolean | undefined;
  onKeyDown?: (dropdown: DropdownApi, e: KeyboardEvent) => boolean | undefined;
}

export default class BasicDropdownContentInner extends Component<BasicDropdownContentInnerArgs> {
  private triggerElement: Element | null = null;
  private dropdownElement: Element | null = null;
  private scrollableAncestors: Element[] = [];
  private hasMoved = false;
  private mutationObserver: MutationObserver | null = null;
  private _removeScrollHandling?: Function;
  get animationEnabled() {
    let config = getOwner(this).resolveRegistration('config:environment');
    return config.environment !== 'test';
  }

  didInsertElement() {
    let { dropdown, id } = this.args;
    this.triggerElement = this.triggerElement || document.querySelector(`[data-ebd-id=${dropdown.uniqueId}]`);
    let dropdownElement = this.dropdownElement = document.getElementById(id);
    document.addEventListener('mousedown', this._handleRootMouseDown, true);
    if (IS_TOUCH_DEVICE) {
      document.addEventListener('touchstart', this._touchStartHandler, true);
      document.addEventListener('touchend', this._handleRootMouseDown, true);
    }
    if (dropdownElement) {
      const { onFocusIn, onFocusOut, onMouseEnter, onMouseLeave, onKeyDown } = this.args;
      if (onFocusIn) {
        dropdownElement.addEventListener('focusin', e => onFocusIn(dropdown, e));
      }
      if (onFocusOut) {
        dropdownElement.addEventListener('focusout', e => onFocusOut(dropdown, e));
      }
      if (onMouseEnter) {
        dropdownElement.addEventListener('mouseenter', e => onMouseEnter(dropdown, e));
      }
      if (onMouseLeave) {
        dropdownElement.addEventListener('mouseleave', e => onMouseLeave(dropdown, e));
      }
      if (onKeyDown) {
        dropdownElement.addEventListener('keydown', e => onKeyDown(dropdown, e));
      }
    }

    dropdown.actions.reposition();

    // Always wire up events, even if rendered in place.
    this.scrollableAncestors = this._getScrollableAncestors();
    this._addGlobalEvents();
    this._addScrollHandling();
    this._startObservingDomMutations();

    if (this.animationEnabled) {
      scheduleOnce('afterRender', this, this._animateIn);
    }
  }

  destroy() {
    this._removeGlobalEvents();
    if (this._removeScrollHandling) {
      this._removeScrollHandling();
    }
    this.scrollableAncestors = [];
    this._stopObservingDomMutations();
    document.removeEventListener('mousedown', this._handleRootMouseDown, true);
    if (IS_TOUCH_DEVICE) {
      document.removeEventListener("touchstart", this._touchStartHandler, true);
      document.removeEventListener("touchend", this._handleRootMouseDown, true);
    }
    if (this.animationEnabled && this.dropdownElement) {
      this._animateOut(this.dropdownElement);
    }
    this.dropdownElement = null;
  }

  private _handleRootMouseDown = (e: MouseEvent) => {
    if (
      this.hasMoved ||
      this.dropdownElement && this.dropdownElement.contains(e.target as Element) ||
      (this.triggerElement && this.triggerElement.contains(e.target as Element))
    ) {
      this.hasMoved = false;
      return;
    }

    if (dropdownIsValidParent(e.target as Element, this.args.id)) {
      this.hasMoved = false;
      return;
    }

    this.args.dropdown.actions.close(e, true);
  }

  private _touchStartHandler = () => {
    document.addEventListener('touchmove', this._touchMoveHandler, true);
  }

  private _touchMoveHandler = () => {
    this.hasMoved = true;
    document.removeEventListener('touchmove', this._touchMoveHandler, true);
  }

  // All ancestors with scroll (except the BODY, which is treated differently)
  private _getScrollableAncestors(): Element[] {
    let scrollableAncestors: Element[] = [];
    if (this.triggerElement) {
      let parent = this.triggerElement.parentNode;
      if (parent instanceof Element) {
        let nextScrollable: Element | null= getScrollParent(parent);
        while (nextScrollable && nextScrollable.tagName.toUpperCase() !== 'BODY' && nextScrollable.tagName.toUpperCase() !== 'HTML') {
          scrollableAncestors.push(nextScrollable);
          parent = nextScrollable.parentNode;
          nextScrollable = parent && getScrollParent(parent);
        }
      }
    }
    return scrollableAncestors;
  }

  private _addGlobalEvents() {
    window.addEventListener('resize', this._runloopAwareReposition);
    window.addEventListener('orientationchange', this._runloopAwareReposition);
  }

  private _removeGlobalEvents() {
    window.removeEventListener('resize', this._runloopAwareReposition);
    window.removeEventListener('orientationchange', this._runloopAwareReposition);
  }

  private _addScrollHandling() {
    if (this.args.preventScroll === true) {
      this._addPreventScrollEvent();
      this._removeScrollHandling = this._removePreventScrollEvent;
    } else {
      this._addScrollEvents();
      this._removeScrollHandling = this._removeScrollEvents;
    }
  }

  // These two functions wire up scroll handling if `args.preventScroll` is true.
  // These prevent all scrolling that isn't inside of the dropdown.
  private _addPreventScrollEvent() {
    document.addEventListener('wheel', this._wheelHandler, { capture: true, passive: false });
  }

  private _removePreventScrollEvent() {
    document.removeEventListener('wheel', this._wheelHandler, { capture: true });
  }

  private _wheelHandler = (event: WheelEvent) => {
    const element = this.dropdownElement;
    if (event.target === null) {
      return;
    }
    if (element !== null && element.contains(event.target as Element) || element === event.target) {
      // Discover the amount of scrollable canvas that is within the dropdown.
      const availableScroll = getAvailableScroll(event.target as Element, element);

      // Calculate what the event's desired change to that scrollable canvas is.
      let { deltaX, deltaY } = getScrollDeltas(event);

      // If the consequence of the wheel action would result in scrolling beyond
      // the scrollable canvas of the dropdown, call preventDefault() and clamp
      // the value of the delta to the available scroll size.
      if (deltaX < availableScroll.deltaXNegative) {
        deltaX = availableScroll.deltaXNegative;
        event.preventDefault();
      } else if (deltaX > availableScroll.deltaXPositive) {
        deltaX = availableScroll.deltaXPositive;
        event.preventDefault();
      } else if (deltaY < availableScroll.deltaYNegative) {
        deltaY = availableScroll.deltaYNegative;
        event.preventDefault();
      } else if (deltaY > availableScroll.deltaYPositive) {
        deltaY = availableScroll.deltaYPositive;
        event.preventDefault();
      }

      // Add back in the default behavior for the two good states that the above
      // `preventDefault()` code will break.
      // - Two-axis scrolling on a one-axis scroll container
      // - The last relevant wheel event if the scroll is overshooting

      // Also, don't attempt to do this if both of `deltaX` or `deltaY` are 0.
      if (event.defaultPrevented && (deltaX || deltaY)) {
        distributeScroll(deltaX, deltaY, event.target as Element, element);
      }
    } else {
      // Scrolling outside of the dropdown is prohibited.
      event.preventDefault();
    }
  }

  // These two functions wire up scroll handling if `args.preventScroll` is false.
  // These trigger reposition of the dropdown.
  private _addScrollEvents() {
    window.addEventListener('scroll', this._runloopAwareReposition);
    this.scrollableAncestors.forEach((el) => {
      el.addEventListener('scroll', this._runloopAwareReposition);
    });
  }

  private _removeScrollEvents() {
    window.removeEventListener('scroll', this._runloopAwareReposition);
    this.scrollableAncestors.forEach((el) => {
      el.removeEventListener('scroll', this._runloopAwareReposition);
    });
  }

  private _startObservingDomMutations() {
    if (this.dropdownElement !== null) {
      this.mutationObserver = new MutationObserver((mutations) => {
        if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
          this._runloopAwareReposition();
        }
      });
      this.mutationObserver.observe(this.dropdownElement, { childList: true, subtree: true });
    }
  }

  private _stopObservingDomMutations() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  private _animateIn() {
    console.log('_animateIn not yet implemented');
    // waitForAnimations(this.dropdownElement, () => {
      //   this.set('animationClass', this.get('transitionedInClass'));
      // });
  }

  private _animateOut(_dropdownElement: Element) {
      console.log('_animateOut not yet implemented');
    // let parentElement = this.get('renderInPlace') ? dropdownElement.parentElement.parentElement : dropdownElement.parentElement;
    // let clone = dropdownElement.cloneNode(true);
    // clone.id = `${clone.id}--clone`;
    // let transitioningInClass = this.get('transitioningInClass');
    // clone.classList.remove(...transitioningInClass.split(' '));
    // clone.classList.add(...this.get('transitioningOutClass').split(' '));
    // parentElement.appendChild(clone);
    // this.set('animationClass', transitioningInClass);
    // waitForAnimations(clone, function () {
    //   parentElement.removeChild(clone);
    // });
  }

  private _runloopAwareReposition = () => {
    join(this.args.dropdown.actions.reposition);
  }
}


function closestContent(el: Element): Element | null {
  let pointer: Element | null = el;
  while (pointer && (!pointer.classList || !pointer.classList.contains('ember-basic-dropdown-content'))) {
    pointer = pointer.parentElement;
  }
  return pointer;
}

/**
 * Evaluates if the given element is in a dropdown or any of its parent dropdowns.
 *
 * @param {HTMLElement} el
 * @param {String} dropdownId
 */
function dropdownIsValidParent(el: Element, dropdownId: string): boolean {
  let closestDropdown = closestContent(el);
  if (closestDropdown) {
    let trigger = document.querySelector(`[aria-owns=${closestDropdown.getAttribute('id')}]`);
    if (trigger === null) {
      return false;
    }
    let parentDropdown = closestContent(trigger);
    if (parentDropdown) {
      return parentDropdown.getAttribute("id") === dropdownId || dropdownIsValidParent(parentDropdown, dropdownId);
    } else {
      return false;
    }
  } else {
    return false;
  }
}
