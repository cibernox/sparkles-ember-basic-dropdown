import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { render, click, focus, blur, triggerEvent, triggerKeyEvent } from '@ember/test-helpers';
import { run } from '@ember/runloop';

module('Integration | Component | basic-dropdown-content', function (hooks) {
  setupRenderingTest(hooks);

  // Basic rendering
  test('If it receives `@renderInPlace={{true}}`, it is rendered right here instead of elsewhere', async function (assert) {
    assert.expect(2);
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdown @renderInPlace={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);
    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-content').exists('It is rendered in the spot');
    assert.dom('#destination-el .ember-basic-dropdown-content').doesNotExist('It isn\'t rendered in the #ember-testing div');
  });

  test('It derives the ID of the content from the `uniqueId` property of of the dropdown', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdown @initiallyOpened={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content>Content</dd.Content>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-content').hasAttribute('id', /ember-basic-dropdown-content-ember\d+/, 'contains the expected ID');
  });

  test('If it receives `class="foo123"`, the rendered content will have that class along with the default one', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdown @initiallyOpened={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content class="foo123">Content</dd.Content>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-content').hasClass('foo123', 'The dropdown contains that class');
  });

  test('If it receives `dir="rtl"`, the rendered content will have the attribute set', async function (assert) {
    assert.expect(1);
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdown @initiallyOpened={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content dir="rtl">Content</dd.Content>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-content').hasAttribute('dir', 'rtl', 'The dropdown has `dir="rtl"`');
  });

  // Focus
  test('If it receives an `onFocusIn` action, it is invoked if a focusin event is fired inside the content', async function (assert) {
    assert.expect(3);
    this.onFocusIn = (dropdown, e) => {
      assert.ok(true, 'The action is invoked');
      assert.ok(dropdown.hasOwnProperty("uniqueId"), "receives the dropdown as 1st argument");
      assert.ok(e instanceof window.Event, 'the second argument is an event');
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdown @initiallyOpened={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content @onFocusIn={{this.onFocusIn}}><input type="text" id="test-input-focusin" /></dd.Content>
      </BasicDropdown>
    `);
    await focus('#test-input-focusin');
  });

  test('If it receives an `onFocusOut` action, it is invoked if a focusout event is fired inside the content', async function (assert) {
    assert.expect(3);
    this.onFocusOut = (dropdown, e) => {
      assert.ok(true, 'The action is invoked');
      assert.ok(dropdown.hasOwnProperty("uniqueId"), "receives the dropdown as 1st argument");
      assert.ok(e instanceof window.Event, 'the second argument is an event');
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdown @initiallyOpened={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content @onFocusOut={{this.onFocusOut}}><input type="text" id="test-input-focusin" /></dd.Content>
      </BasicDropdown>
    `);
    await focus('#test-input-focusin');
    await blur('#test-input-focusin');
  });

  // Mouseenter/leave
  test('If it receives an `onMouseEnter` action, it is invoked if a mouseenter event is fired on the content', async function (assert) {
    assert.expect(3);
    this.onMouseEnter = (dropdown, e) => {
      assert.ok(true, 'The action is invoked');
      assert.ok(dropdown.hasOwnProperty("uniqueId"), "receives the dropdown as 1st argument");
      assert.ok(e instanceof window.Event, 'the second argument is an event');
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdown @initiallyOpened={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content @onMouseEnter={{this.onMouseEnter}}>Content</dd.Content>
      </BasicDropdown>
    `);
    await triggerEvent('.ember-basic-dropdown-content', 'mouseenter');
  });

  test('If it receives an `onMouseLeave` action, it is invoked if a mouseleave event is fired on the content', async function (assert) {
    assert.expect(3);
    this.onMouseLeave = (dropdown, e) => {
      assert.ok(true, "The action is invoked");
      assert.ok(dropdown.hasOwnProperty("uniqueId"), "receives the dropdown as 1st argument");
      assert.ok(e instanceof window.Event, "the second argument is an event");
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdown @initiallyOpened={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content @onMouseLeave={{this.onMouseLeave}}>Content></dd.Content>
      </BasicDropdown>
    `);
    await triggerEvent('.ember-basic-dropdown-content', 'mouseleave');
  });

  // Keydown
  test('If it receives an `onKeyDown` action, it is invoked if a keydown event is fired on the content', async function (assert) {
    assert.expect(3);
    this.dropdown = { uniqueId: 'e123', isOpen: true, actions: { reposition() { } } };
    this.onKeyDown = (dropdown, e) => {
      assert.ok(e instanceof window.Event, "It receives the event as second argument");
      assert.ok(dropdown.hasOwnProperty("uniqueId"), "receives the dropdown as 1st argument");
      assert.equal(e.keyCode, 70, "the event is the keydown event");
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdown @initiallyOpened={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content @onKeyDown={{this.onKeyDown}}><input type="text" id="inner-input" /></dd.Content>
      </BasicDropdown>
    `);
    await focus('#inner-input');
    await triggerKeyEvent('#inner-input', 'keydown', 70);
  });

  // Repositining
  test('The component is repositioned immediately when opened', async function (assert) {
    assert.expect(1);
    this.dropdown = {
      uniqueId: 'e123',
      isOpen: true,
      actions: {
        reposition() {
          assert.ok(true, 'Reposition is invoked exactly once');
        }
      }
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdownContent @id="my-content" @dropdown={{this.dropdown}} @destination="destination-el">Lorem ipsum</BasicDropdownContent>
    `);
  });

  test('The component is not repositioned if closed', async function (assert) {
    assert.expect(0);
    this.dropdown = {
      uniqueId: 'e123',
      isOpen: false,
      actions: {
        reposition() {
          assert.ok(true, 'Reposition is invoked exactly once');
        }
      }
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdownContent @id="my-content" @dropdown={{this.dropdown}} @destination="destination-el">Lorem ipsum</BasicDropdownContent>
    `);
  });

  test('The component cancels events when receives `@preventScroll={{true}}`', async function (assert) {
    assert.expect(4);
    await render(hbs`
      <div id="destination-el"></div>
      <div id="outer-div" style="width: 100px; height: 100px; overflow: auto;">
        <div style="width: 200px; height: 200px;">content scroll test</div>
      </div>
      <BasicDropdown @initiallyOpened={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content @preventScroll={{true}}>
          <div id="inner-div" style="width: 100px; height: 100px; overflow: auto;">
            <div style="width: 200px; height: 200px;">content scroll test</div>
          </div>
        </dd.Content>
      </BasicDropdown>
    `);

    let innerScrollable = this.element.querySelector('#inner-div');
    let innerScrollableEvent = new WheelEvent('wheel', { deltaY: 4, cancelable: true, bubbles: true });
    run(() => innerScrollable.dispatchEvent(innerScrollableEvent));
    assert.strictEqual(innerScrollableEvent.defaultPrevented, false, 'The inner scrollable does not cancel wheel events.');

    innerScrollable.scrollTop = 4;
    let innerScrollableCanceledEvent = new WheelEvent('wheel', { deltaY: -10, cancelable: true, bubbles: true });
    run(() => innerScrollable.dispatchEvent(innerScrollableCanceledEvent));
    assert.strictEqual(innerScrollableCanceledEvent.defaultPrevented, true, 'The inner scrollable cancels out of bound wheel events.');
    assert.strictEqual(innerScrollable.scrollTop, 0, 'The innerScrollable was scrolled anyway.');

    let outerScrollable = this.element.querySelector('#outer-div');
    let outerScrollableEvent = new WheelEvent('wheel', { deltaY: 4, cancelable: true, bubbles: true });
    run(() => outerScrollable.dispatchEvent(outerScrollableEvent));
    assert.strictEqual(outerScrollableEvent.defaultPrevented, true, 'The outer scrollable cancels wheel events.');
  });

  test('The component is repositioned if the window scrolls', async function (assert) {
    assert.expect(1);
    let repositions = 0;
    this.dropdown = {
      uniqueId: 'e123',
      isOpen: true,
      actions: {
        reposition() {
          repositions++;
        }
      }
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdownContent @id="my-content" @dropdown={{this.dropdown}} @destination="destination-el">Lorem ipsum</BasicDropdownContent>
    `);
    run(() => window.dispatchEvent(new window.Event('scroll')));
    assert.equal(repositions, 2, 'The component has been repositioned twice');
  });

  test('The component is repositioned if the window is resized', async function (assert) {
    assert.expect(1);
    let repositions = 0;
    this.dropdown = {
      uniqueId: 'e123',
      isOpen: true,
      actions: {
        reposition() {
          repositions++;
        }
      }
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdownContent @id="my-content" @dropdown={{this.dropdown}} @destination="destination-el">Lorem ipsum</BasicDropdownContent>
    `);
    run(() => window.dispatchEvent(new window.Event('resize')));
    assert.equal(repositions, 2, 'The component has been repositioned twice');
  });

  test('The component is repositioned if the orientation changes', async function (assert) {
    assert.expect(1);
    let repositions = 0;
    this.dropdown = {
      uniqueId: 'e123',
      isOpen: true,
      actions: {
        reposition() {
          repositions++;
        }
      }
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdownContent @id="my-content" @dropdown={{this.dropdown}} @destination="destination-el">Lorem ipsum</BasicDropdownContent>
    `);
    run(() => window.dispatchEvent(new window.Event('orientationchange')));
    assert.equal(repositions, 2, 'The component has been repositioned twice');
  });

  test('The component is repositioned if the content of the dropdown changs', async function (assert) {
    assert.expect(1);
    let done = assert.async();
    let repositions = 0;
    this.dropdown = {
      uniqueId: 'e123',
      isOpen: true,
      actions: {
        reposition() {
          repositions++;
          if (repositions === 2) {
            assert.equal(repositions, 2, 'It was repositioned twice');
            done();
          }
        }
      }
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdownContent @id="my-content" @dropdown={{this.dropdown}} @destination="destination-el">
        <div id="content-target-div"></div>
      </BasicDropdownContent>
    `);
    run(() => {
      let target = document.getElementById('content-target-div');
      let span = document.createElement('SPAN');
      target.appendChild(span);
    });
  });

  test('A renderInPlace component is repositioned if the window scrolls', async function (assert) {
    assert.expect(1);
    let repositions = 0;
    this.dropdown = {
      uniqueId: 'e123',
      isOpen: true,
      actions: {
        reposition() {
          repositions++;
        }
      }
    };
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdownContent @id="my-content" @dropdown={{this.dropdown}} @destination="destination-el" @renderInPlace={{true}}>Lorem ipsum</BasicDropdownContent>
    `);
    run(() => window.dispatchEvent(new window.Event('scroll')));
    assert.equal(repositions, 2, 'The component has been repositioned twice');
  });

  // Overlay
  test('If it receives an `@overlay={{true}}` option, there is an overlay covering all the screen', async function (assert) {
    assert.expect(2);
    await render(hbs`
      <div id="destination-el"></div>
      <BasicDropdown @initiallyOpened={{true}} @destination="destination-el" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content @overlay={{true}}>Content</dd.Content>
      </BasicDropdown>
    `);
    assert.dom('.ember-basic-dropdown-overlay').exists('There is one overlay');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-overlay').doesNotExist('There is no overlay when closed');
  });
});
