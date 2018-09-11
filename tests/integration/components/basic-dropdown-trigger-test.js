import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { render, click, focus, blur, triggerEvent, triggerKeyEvent, tap } from '@ember/test-helpers';
// import { tapTrigger, nativeTap } from 'ember-basic-dropdown/test-support/helpers';
// import { render, triggerEvent, triggerKeyEvent, focus } from '@ember/test-helpers';
// import { run } from '@ember/runloop';
// import { set } from "@ember/object"

module('Integration | Component | basic-dropdown-trigger', function (hooks) {
  setupRenderingTest(hooks);

  test('It renders the given block in an elemnt with class `ember-basic-dropdown-trigger`, with no wrapper around', async function (assert) {
    assert.expect(2);
    await render(hbs`
      <div id="direct-parent">
        <BasicDropdown as |dd|>
          <dd.Trigger>Click me</dd.Trigger>
        </BasicDropdown>
      </div>
    `);

    assert.dom('#direct-parent > .ember-basic-dropdown-trigger').exists('The trigger is not wrapped');
    assert.dom('.ember-basic-dropdown-trigger').hasText('Click me', 'The trigger contains the given block');
  });

  // Attributes and a11y
  test('If it doesn\'t receive any tabindex, defaults to 0', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-trigger').hasAttribute('tabindex', '0', 'Has a tabindex of 0');
  });

  test('If it receives `tabindex=3`, the tabindex of the element is 3', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger tabindex=3>Click me</dd.Trigger>
      </BasicDropdown>
    `);

    assert.dom('.ember-basic-dropdown-trigger').hasAttribute('tabindex', '3', 'Has a tabindex of 3');
  });

  test("If it receives `tabindex={{null}}`, the trigger doesn't have a tabindex attribute", async function(assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger tabindex={{null}}>Click me</dd.Trigger>
      </BasicDropdown>
    `);

    assert.dom(".ember-basic-dropdown-trigger").doesNotHaveAttribute("tabindex");
  });

  test('If it receives `title=something`, if has that title attribute', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger title="foobar">Click me</dd.Trigger>
      </BasicDropdown>
    `);

    assert.dom('.ember-basic-dropdown-trigger').hasAttribute('title', 'foobar', 'Has the given title');
  });

  test('If it receives `id="some-id"`, if has that id', async function (assert) {
    assert.expect(1);
    this.dropdown = { uniqueId: 123 };
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger id="my-own-id">Click me</dd.Trigger>
      </BasicDropdown>
    `);

    assert.dom('.ember-basic-dropdown-trigger').hasAttribute('id', 'my-own-id', 'Has the given id');
  });

  test('If the dropdown is disabled, the trigger doesn\'t have tabindex attribute', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown @disabled={{true}} as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-trigger').doesNotHaveAttribute('tabindex', 'The component doesn\'t have tabindex');
  });

  test('If it belongs to a disabled dropdown, it gets an `aria-disabled=true` attribute for a11y', async function (assert) {
    assert.expect(2);
    this.disabled = true;
    await render(hbs`
      <BasicDropdown @disabled={{this.disabled}} as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-trigger').hasAttribute('disabled');
    this.set('disabled', false);
    assert.dom('.ember-basic-dropdown-trigger').doesNotHaveAttribute('disabled', 'It is NOT marked as disabled');
  });

  test('If it receives `ariaLabel="foo123"` it gets an `aria-label="foo123"` attribute', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger aria-label="foo123">Click me</dd.Trigger>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-trigger').hasAttribute('aria-label', 'foo123', 'the aria-label is set');
  });

  test('If the received dropdown is open, it has an `aria-expanded="true"` attribute', async function (assert) {
    assert.expect(2);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-trigger').doesNotHaveAttribute('aria-expanded');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-trigger').hasAttribute('aria-expanded', 'true', 'the aria-expanded is true');
  });

  test('If it has an `aria-owns` attribute pointing to the id of the content', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown @initiallyOpened={{true}} as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);
    let contentId = document.querySelector('.ember-basic-dropdown-content').id;
    assert.dom('.ember-basic-dropdown-trigger').hasAttribute('aria-owns', contentId);
  });

  test('If it does not receive an specific `role`, the default is `button`', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-trigger').hasAttribute('role', 'button');
  });

  test('The `aria-haspopup` attribute is not present by default', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-trigger').doesNotHaveAttribute('aria-haspopup');
  });

  // Custom actions
  test('If it receives an `onMouseEnter` action, it will be invoked when a mouseenter event is received', async function (assert) {
    assert.expect(2);
    this.onMouseEnter = (dropdown, e) => {
      assert.ok(dropdown.hasOwnProperty('uniqueId'), 'receives the dropdown as 1st argument');
      assert.ok(e instanceof window.Event, 'It receives the event as second argument');
    };
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger @onMouseEnter={{this.onMouseEnter}}>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    await triggerEvent('.ember-basic-dropdown-trigger', 'mouseenter');
  });

  test('If it receives an `onMouseLeave` action, it will be invoked when a mouseleave event is received', async function (assert) {
    assert.expect(2);
    this.onMouseLeave = (dropdown, e) => {
      assert.ok(dropdown.hasOwnProperty("uniqueId"), "receives the dropdown as 1st argument");
      assert.ok(e instanceof window.Event, 'It receives the event as second argument');
    };
    this.dropdown = { uniqueId: 123 };
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger @onMouseLeave={{this.onMouseLeave}}>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    await triggerEvent('.ember-basic-dropdown-trigger', 'mouseleave');
  });

  test('If it receives an `onFocus` action, it will be invoked when it get focused', async function (assert) {
    assert.expect(2);
    this.onFocus = (dropdown, e) => {
      assert.ok(dropdown.hasOwnProperty('uniqueId'), 'receives the dropdown as 1st argument');
      assert.ok(e instanceof window.Event, 'It receives the event as second argument');
    };
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger @onFocus={{this.onFocus}}>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    await focus('.ember-basic-dropdown-trigger');
  });

  test('If it receives an `onBlur` action, it will be invoked when it get blurred', async function (assert) {
    assert.expect(2);
    this.onBlur = (dropdown, e) => {
      assert.ok(dropdown.hasOwnProperty('uniqueId'), 'receives the dropdown as 1st argument');
      assert.ok(e instanceof window.Event, 'It receives the event as second argument');
    };
    this.dropdown = { uniqueId: 123 };
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger @onBlur={{this.onBlur}}>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    await focus('.ember-basic-dropdown-trigger');
    await blur('.ember-basic-dropdown-trigger');
  });

  test('If it receives an `onKeyDown` action, it will be invoked when a key is pressed while the component is focused', async function (assert) {
    assert.expect(3);
    this.onKeyDown = (dropdown, e) => {
      assert.ok(dropdown.hasOwnProperty('uniqueId'), "receives the dropdown as 1st argument");
      assert.ok(e instanceof window.Event, 'It receives the event as second argument');
      assert.equal(e.keyCode, 70, 'the event is the keydown event');
    };
    this.dropdown = { uniqueId: 123 };
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger @onKeyDown={{this.onKeyDown}}>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    await triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 70);
  });

  test('If it receives an `onKeyUp` action, it will be invoked when a key is pressed while the component is focused', async function (assert) {
    assert.expect(3);
    this.onKeyUp = (dropdown, e) => {
      assert.ok(dropdown.hasOwnProperty('uniqueId'), "receives the dropdown as 1st argument");
      assert.ok(e instanceof window.Event, 'It receives the event as second argument');
      assert.equal(e.keyCode, 70, 'the event is the keydown event');
    };
    this.dropdown = { uniqueId: 123 };
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger @onKeyUp={{this.onKeyUp}}>Click me</dd.Trigger>
      </BasicDropdown>
    `);
    await triggerKeyEvent('.ember-basic-dropdown-trigger', 'keyup', 70);
  });

  // Default behaviour
  test('mousedown DO NOT toggle the dropdown by default', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);
    await triggerEvent('.ember-basic-dropdown-trigger', 'mousedown');
    assert.dom(".ember-basic-dropdown-content").doesNotExist('The dropdown is closed');
  });

  test('click events toggle the dropdown by default', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);
    await triggerEvent('.ember-basic-dropdown-trigger', 'click');
    assert.dom(".ember-basic-dropdown-content").exists('The dropdown is open');
  });

  test('click events DO NOT toggle the dropdown if `@eventType="mousedown"` is passed', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger @eventType="mousedown">Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);
    await triggerEvent('.ember-basic-dropdown-trigger', 'click');
    assert.dom(".ember-basic-dropdown-content").doesNotExist('The dropdown is closed');
  });

  test('mousedown events toggle the dropdown if `@eventType="mousedown"` is passed', async function(assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger @eventType="mousedown">Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);
    await triggerEvent('.ember-basic-dropdown-trigger', 'mousedown');
    assert.dom('.ember-basic-dropdown-content').exists();
  });

  test('when `stopPropagation` is true the `click` event does not bubble', async function (assert) {
    assert.expect(1);
    this.handlerInParent = () => assert.ok(false, 'This should never be called');

    await render(hbs`
      <div onclick={{this.handlerInParent}}>
        <BasicDropdown as |dd|>
          <dd.Trigger @stopPropagation={{true}}>Click me</dd.Trigger>
          <dd.Content>Content</dd.Content>
        </BasicDropdown>
      </div>
    `);
    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-content').exists();
  });

  test('when `stopPropagation` is true and eventType is "mousedown", the `mousedown` event does not bubble', async function (assert) {
    assert.expect(1);
    this.handlerInParent = () => assert.ok(false, 'This should never be called');
    await render(hbs`
      <div onmousedown={{this.handlerInParent}}>
        <BasicDropdown as |dd|>
          <dd.Trigger @stopPropagation={{true}} @eventType="mousedown">Click me</dd.Trigger>
          <dd.Content>Content</dd.Content>
        </BasicDropdown>
      </div>
    `);
    await triggerEvent('.ember-basic-dropdown-trigger', 'mousedown');
    assert.dom('.ember-basic-dropdown-content').exists();
  });

  test('Pressing ENTER opens the dropdown', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);

    await triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 13);
    assert.dom('.ember-basic-dropdown-content').exists();
  });

  test('Pressing SPACE opens the dropdown', async function (assert) {
    assert.expect(2);
    this.handleKeydown = function(e) {
      assert.ok(e.defaultPrevented, 'The event is defaultPrevented');
    };
    await render(hbs`
      <div onkeydown={{this.handleKeydown}}>
        <BasicDropdown as |dd|>
          <dd.Trigger>Click me</dd.Trigger>
          <dd.Content>Content</dd.Content>
        </BasicDropdown>
      </div>
    `);

    await triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 32);
    assert.dom('.ember-basic-dropdown-content').exists();
  });

  test('Pressing ESC closes the dropdown if it is open', async function (assert) {
    assert.expect(2);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-content').exists();
    await triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 27);
    assert.dom('.ember-basic-dropdown-content').doesNotExist();
  });

  test('Pressing ENTER/SPACE/ESC does nothing of the onKeyDown action returns false', async function (assert) {
    assert.expect(3);
    this.onKeyDown = () => false;
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger @onKeyDown={{this.onKeyDown}}>Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);

    await triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 13);
    assert.dom('.ember-basic-dropdown-content').doesNotExist();
    await triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 32);
    assert.dom('.ember-basic-dropdown-content').doesNotExist();
    await triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 27);
    assert.dom('.ember-basic-dropdown-content').doesNotExist();
  });

  test('Tapping invokes the toggle action on the dropdown', async function (assert) {
    assert.expect(2);
    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);
    await tap('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-content').exists();
    await tap('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-content').doesNotExist();
  });

  test('Firing a mousemove between a touchstart and a touchend (touch scroll) doesn\'t fire the toggle action', async function(assert) {
    assert.expect(0);
    this.watchOpen = function() {
      assert.ok(false, 'The component must not be opened');
    };
    await render(hbs`
      <BasicDropdown @onOpen={{this.watchOpen}} as |dd|>
        <dd.Trigger @isTouchDevice={{true}}>Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);

    await triggerEvent('.ember-basic-dropdown-trigger', 'touchstart');
    await triggerEvent('.ember-basic-dropdown-trigger', 'touchmove');
    await triggerEvent('.ember-basic-dropdown-trigger', 'touchend');
  });

  // test('If its dropdown is disabled it won\'t respond to mouse, touch or keyboard event', async function (assert) {
  //   assert.expect(0);
  //   this.dropdown = {
  //     uniqueId: 123,
  //     disabled: true,
  //     actions: {
  //       toggle() {
  //         assert.ok(false, 'This action in not called');
  //       },
  //       open() {
  //         assert.ok(false, 'This action in not called');
  //       },
  //       close() {
  //         assert.ok(false, 'This action in not called');
  //       }
  //     }
  //   };
  //   await render(hbs`
  //     {{#basic-dropdown/trigger dropdown=dropdown isTouchDevice=true}}Click me{{/basic-dropdown/trigger}}
  //   `);
  //   clickTrigger();
  //   tapTrigger();
  //   triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 13);
  //   triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 32);
  //   triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 27);
  // });

  // // Focus
  // test('If it receives an `onFocusIn` action, it is invoked if a focusin event is fired on the trigger', async function (assert) {
  //   assert.expect(3);
  //   this.dropdown = { uniqueId: 123, isOpen: true, actions: { reposition() { } } };
  //   this.onFocusIn = (api, e) => {
  //     assert.ok(true, 'The action is invoked');
  //     assert.equal(api, this.dropdown, 'The first argument is the API');
  //     assert.ok(e instanceof window.Event, 'the second argument is an event');
  //   };
  //   await render(hbs`
  //     {{#basic-dropdown/trigger dropdown=dropdown onFocusIn=onFocusIn}}
  //       <input type="text" id="test-input-focusin" />
  //     {{/basic-dropdown/trigger}}
  //   `);
  //   await focus('#test-input-focusin');
  // });

  // test('If it receives an `onFocusIn` action, it is invoked if a focusin event is fired on the trigger', async function (assert) {
  //   assert.expect(3);
  //   this.dropdown = { uniqueId: 123, isOpen: true, actions: { reposition() { } } };
  //   this.onFocusOut = (api, e) => {
  //     assert.ok(true, 'The action is invoked');
  //     assert.equal(api, this.dropdown, 'The first argument is the API');
  //     assert.ok(e instanceof window.Event, 'the second argument is an event');
  //   };
  //   await render(hbs`
  //     {{#basic-dropdown/trigger dropdown=dropdown onFocusOut=onFocusOut}}
  //       <input type="text" id="test-input-focusout" />
  //     {{/basic-dropdown/trigger}}
  //   `);
  //   await focus('#test-input-focusout');
  // });

  // // Decorating and overriding default event handlers
  // test('A user-supplied onMouseDown action will execute before the default toggle behavior', async function (assert) {
  //   assert.expect(4);
  //   let userActionRanfirst = false;

  //   this.dropdown = {
  //     uniqueId: 123,
  //     actions: {
  //       toggle: () => {
  //         assert.ok(userActionRanfirst, 'User-supplied `onMouseDown` ran before default `toggle`');
  //       }
  //     }
  //   };

  //   let userSuppliedAction = (dropdown, e) => {
  //     assert.ok(true, 'The `userSuppliedAction()` action has been fired');
  //     assert.ok(e instanceof window.Event, 'It receives the event');
  //     assert.equal(dropdown, this.dropdown, 'It receives the dropdown configuration object');
  //     userActionRanfirst = true;
  //   };

  //   this.set('onMouseDown', userSuppliedAction);
  //   await render(hbs`
  //     {{#basic-dropdown/trigger onMouseDown=onMouseDown dropdown=dropdown}}Click me{{/basic-dropdown/trigger}}
  //   `);

  //   clickTrigger();
  // });

  // test('A user-supplied onMouseDown action, returning `false`, will prevent the default behavior', async function (assert) {
  //   assert.expect(1);

  //   this.dropdown = {
  //     uniqueId: 123,
  //     actions: {
  //       toggle: () => {
  //         assert.ok(false, 'Default `toggle` action should not run');
  //       }
  //     }
  //   };

  //   let userSuppliedAction = () => {
  //     assert.ok(true, 'The `userSuppliedAction()` action has been fired');
  //     return false;
  //   };

  //   this.set('onMouseDown', userSuppliedAction);
  //   await render(hbs`
  //     {{#basic-dropdown/trigger onMouseDown=onMouseDown dropdown=dropdown}}Click me{{/basic-dropdown/trigger}}
  //   `);

  //   clickTrigger();
  // });

  // test('A user-supplied onTouchEnd action will execute before the default toggle behavior', async function (assert) {
  //   assert.expect(4);
  //   let userActionRanfirst = false;

  //   this.dropdown = {
  //     uniqueId: 123,
  //     actions: {
  //       toggle: () => {
  //         assert.ok(userActionRanfirst, 'User-supplied `onTouchEnd` ran before default `toggle`');
  //       }
  //     }
  //   };

  //   let userSuppliedAction = (dropdown, e) => {
  //     assert.ok(true, 'The `userSuppliedAction` action has been fired');
  //     assert.ok(e instanceof window.Event, 'It receives the event');
  //     assert.equal(dropdown, this.dropdown, 'It receives the dropdown configuration object');
  //     userActionRanfirst = true;
  //   };

  //   this.set('onTouchEnd', userSuppliedAction);
  //   await render(hbs`
  //     {{#basic-dropdown/trigger onTouchEnd=onTouchEnd dropdown=dropdown isTouchDevice=true}}Click me{{/basic-dropdown/trigger}}
  //   `);
  //   tapTrigger();
  // });

  // test('A user-supplied onTouchEnd action, returning `false`, will prevent the default behavior', async function (assert) {
  //   assert.expect(1);

  //   this.dropdown = {
  //     uniqueId: 123,
  //     actions: {
  //       toggle: () => {
  //         assert.ok(false, 'Default `toggle` action should not run');
  //       }
  //     }
  //   };

  //   let userSuppliedAction = () => {
  //     assert.ok(true, 'The `userSuppliedAction` action has been fired');
  //     return false;
  //   };

  //   this.set('onTouchEnd', userSuppliedAction);
  //   await render(hbs`
  //     {{#basic-dropdown/trigger onTouchEnd=onTouchEnd dropdown=dropdown isTouchDevice=true}}Click me{{/basic-dropdown/trigger}}
  //   `);
  //   tapTrigger();
  // });

  // test('A user-supplied onKeyDown action will execute before the default toggle behavior', async function (assert) {
  //   assert.expect(4);
  //   let userActionRanfirst = false;

  //   this.dropdown = {
  //     uniqueId: 123,
  //     actions: {
  //       toggle: () => {
  //         assert.ok(userActionRanfirst, 'User-supplied `onKeyDown` ran before default `toggle`');
  //       }
  //     }
  //   };

  //   let userSuppliedAction = (dropdown, e) => {
  //     assert.ok(true, 'The `userSuppliedAction()` action has been fired');
  //     assert.ok(e instanceof window.Event, 'It receives the event');
  //     assert.equal(dropdown, this.dropdown, 'It receives the dropdown configuration object');
  //     userActionRanfirst = true;
  //   };

  //   this.set('onKeyDown', userSuppliedAction);
  //   await render(hbs`
  //     {{#basic-dropdown/trigger onKeyDown=onKeyDown dropdown=dropdown}}Click me{{/basic-dropdown/trigger}}
  //   `);
  //   triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 13); // Enter
  // });

  // test('A user-supplied onKeyDown action, returning `false`, will prevent the default behavior', async function (assert) {
  //   assert.expect(1);

  //   this.dropdown = {
  //     uniqueId: 123,
  //     actions: {
  //       toggle: () => {
  //         assert.ok(false, 'Default `toggle` action should not run');
  //       }
  //     }
  //   };

  //   let userSuppliedAction = () => {
  //     assert.ok(true, 'The `userSuppliedAction()` action has been fired');
  //     return false;
  //   };

  //   this.set('onKeyDown', userSuppliedAction);
  //   await render(hbs`
  //     {{#basic-dropdown/trigger onKeyDown=onKeyDown dropdown=dropdown}}Click me{{/basic-dropdown/trigger}}
  //   `);
  //   triggerKeyEvent('.ember-basic-dropdown-trigger', 'keydown', 13); // Enter
  // });

  // test('Tapping an SVG inside of the trigger invokes the toggle action on the dropdown', async function (assert) {
  //   assert.expect(2);
  //   this.dropdown = {
  //     actions: {
  //       uniqueId: 123,
  //       toggle(e) {
  //         assert.ok(true, 'The `toggle()` action has been fired');
  //         assert.ok(e instanceof window.Event && arguments.length === 1, 'It receives the event as first and only argument');
  //       }
  //     }
  //   };
  //   await render(hbs`
  //     {{#basic-dropdown/trigger dropdown=dropdown isTouchDevice=true}}<svg class="trigger-child-svg">Click me</svg>{{/basic-dropdown/trigger}}
  //   `);
  //   nativeTap('.trigger-child-svg');
  // });
});
