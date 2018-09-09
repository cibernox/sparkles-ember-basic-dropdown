import Component from 'sparkles-component';
import { getOwner } from '@ember/application';
import { scheduleOnce, join } from "@ember/runloop";
import { getScrollParent } from '../utils/calculate-position';

const IS_TOUCH_DEVICE = Boolean(!!window && 'ontouchstart' in window);

export default class BasicDropdownContentInner extends Component {
  _handleRootMouseDown = this._handleRootMouseDown.bind(this);
  get animationEnabled() {
    let config = getOwner(this).resolveRegistration('config:environment');
    return config.environment !== 'test';
  }

  didInsertElement() {
    let { dropdown, id } = this.args;
    this.triggerElement = this.triggerElement || document.querySelector(`[data-ebd-id=${dropdown.uniqueId}]`);
    this.dropdownElement = document.getElementById(id);
    document.addEventListener('mousedown', this._handleRootMouseDown, true);
    if (IS_TOUCH_DEVICE) {
      document.addEventListener('touchstart', this.touchStartHandler, true);
      document.addEventListener('touchend', this._handleRootMouseDown, true);
    }
    if (this.args.onFocusIn) {
      this.dropdownElement.addEventListener('focusin', e =>
        this.args.onFocusIn(dropdown, e)
      );
    }
    if (this.args.onFocusOut) {
      this.dropdownElement.addEventListener('focusout', e => {
        this.args.onFocusOut(dropdown, e)
      });
    }
    if (this.args.onMouseEnter) {
      this.dropdownElement.addEventListener('mouseenter', e =>
        this.args.onMouseEnter(dropdown, e)
      );
    }
    if (this.args.onMouseLeave) {
      this.dropdownElement.addEventListener('mouseleave', e =>
        this.args.onMouseLeave(dropdown, e)
      );
    }
    if (this.args.onKeyDown) {
      this.dropdownElement.addEventListener('keydown', e =>
        this.args.onKeyDown(dropdown, e)
      );
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
    this._removeScrollHandling();
    this.scrollableAncestors = [];
    this._stopObservingDomMutations();
    document.removeEventListener('mousedown', this._handleRootMouseDown, true);
    if (IS_TOUCH_DEVICE) {
      document.removeEventListener("touchstart", this.touchStartHandler, true);
      document.removeEventListener("touchend", this._handleRootMouseDown, true);
    }
    if (this.animationEnabled) {
      this._animateOut(this.dropdownElement);
    }
    this.dropdownElement = null;
  }

  _handleRootMouseDown(e) {
    if (this.hasMoved || this.dropdownElement.contains(e.target) || this.triggerElement && this.triggerElement.contains(e.target)) {
      this.hasMoved = false;
      return;
    }

    if (dropdownIsValidParent(e.target, this.args.id)) {
      this.hasMoved = false;
      return;
    }

    this.args.dropdown.actions.close(e, true);
  }

  // All ancestors with scroll (except the BODY, which is treated differently)
  _getScrollableAncestors() {
    let scrollableAncestors = [];
    if (this.triggerElement) {
      let nextScrollable = getScrollParent(this.triggerElement.parentNode);
      while (nextScrollable && nextScrollable.tagName.toUpperCase() !== 'BODY' && nextScrollable.tagName.toUpperCase() !== 'HTML') {
        scrollableAncestors.push(nextScrollable);
        nextScrollable = getScrollParent(nextScrollable.parentNode);
      }
    }
    return scrollableAncestors;
  }

  _addGlobalEvents() {
    window.addEventListener('resize', this._runloopAwareReposition);
    window.addEventListener('orientationchange', this._runloopAwareReposition);
  }

  _removeGlobalEvents() {
    window.removeEventListener('resize', this._runloopAwareReposition);
    window.removeEventListener('orientationchange', this._runloopAwareReposition);
  }

  _addScrollHandling() {
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
  _addPreventScrollEvent() {
    document.addEventListener('wheel', this.wheelHandler, { capture: true, passive: false });
  }

  _removePreventScrollEvent() {
    document.removeEventListener('wheel', this.wheelHandler, { capture: true, passive: false });
  }

  // These two functions wire up scroll handling if `args.preventScroll` is false.
  // These trigger reposition of the dropdown.
  _addScrollEvents() {
    window.addEventListener('scroll', this._runloopAwareReposition);
    this.scrollableAncestors.forEach((el) => {
      el.addEventListener('scroll', this._runloopAwareReposition);
    });
  }

  _removeScrollEvents() {
    window.removeEventListener('scroll', this._runloopAwareReposition);
    this.scrollableAncestors.forEach((el) => {
      el.removeEventListener('scroll', this._runloopAwareReposition);
    });
  }

  _startObservingDomMutations() {
    this.mutationObserver = new MutationObserver((mutations) => {
      if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
        this._runloopAwareReposition();
      }
    });
    this.mutationObserver.observe(this.dropdownElement, { childList: true, subtree: true });
  }

  _stopObservingDomMutations() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  _animateIn() {
    console.log('_animateIn not yet implemented');
    // waitForAnimations(this.dropdownElement, () => {
      //   this.set('animationClass', this.get('transitionedInClass'));
      // });
    }

  _animateOut(dropdownElement) {
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

  _runloopAwareReposition() {
    join(this.args.dropdown.actions.reposition);
  }
}


function closestContent(el) {
  while (el && (!el.classList || !el.classList.contains('ember-basic-dropdown-content'))) {
    el = el.parentElement;
  }
  return el;
}

/**
 * Evaluates if the given element is in a dropdown or any of its parent dropdowns.
 *
 * @param {HTMLElement} el
 * @param {String} dropdownId
 */
function dropdownIsValidParent(el, dropdownId) {
  let closestDropdown = closestContent(el);
  if (closestDropdown) {
    let trigger = document.querySelector(`[aria-owns=${closestDropdown.attributes.id.value}]`);
    let parentDropdown = closestContent(trigger);
    return parentDropdown && parentDropdown.attributes.id.value === dropdownId || dropdownIsValidParent(parentDropdown, dropdownId);
  } else {
    return false;
  }
}
