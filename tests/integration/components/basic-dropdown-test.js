import { module, test, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, triggerEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { schedule } from '@ember/runloop';
import { registerDeprecationHandler } from '@ember/debug';
import { run } from '@ember/runloop';
import Component from 'sparkles-component';

let deprecations = [];

registerDeprecationHandler((message, options, next) => {
  deprecations.push(message);
  next(message, options);
});

module('Integration | Component | basic-dropdown', function(hooks) {
  hooks.beforeEach(() => deprecations = []);
  setupRenderingTest(hooks);

  test('Clicking on the trigger displays and hides the content passed to the `dd.Content` component', async function(assert) {
    assert.expect(3);

    await render(hbs`
      <BasicDropdown @foo="bar" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content>
          <div id="dropdown-is-opened">Content!</div>
        </dd.Content>
      </BasicDropdown>
    `);

    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is closed');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').exists('The dropdown is opened');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is closed again');
  });

  test('Its `toggle` action opens and closes the dropdown', async function (assert) {
    assert.expect(3);

    await render(hbs`
      <BasicDropdown @foo="bar" as |dropdown|>
        <button class="ember-basic-dropdown-trigger" onclick={{dropdown.actions.toggle}}></button>
        {{#if dropdown.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);

    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is closed');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').exists('The dropdown is opened');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is closed again');
  });

  test('The mousedown event with the right button doesn\'t open it', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        {{#if dd.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);

    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is closed');
    await triggerEvent('.ember-basic-dropdown-trigger', 'mousedown', { button: 2 });
    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is closed');
  });

  test('Its `open` action opens the dropdown', async function (assert) {
    assert.expect(3);

    await render(hbs`
      <BasicDropdown as |dropdown|>
        <button class="ember-basic-dropdown-trigger" onclick={{dropdown.actions.open}}></button>
        {{#if dropdown.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);

    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is closed');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').exists('The dropdown is opened');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').exists('The dropdown is still opened');
  });

  test('Its `close` action closes the dropdown', async function (assert) {
    assert.expect(3);

    await render(hbs`
      <BasicDropdown @initiallyOpened=true as |dropdown|>
        <button class="ember-basic-dropdown-trigger" onclick={{dropdown.actions.close}}></button>
        {{#if dropdown.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);

    assert.dom('#dropdown-is-opened').exists('The dropdown is opened');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is closed');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is still closed');
  });

  test('It can receive an onOpen action that is fired just before the component opens', async function (assert) {
    assert.expect(4);

    this.willOpen = function (dropdown, e) {
      assert.equal(dropdown.isOpen, false, 'The received dropdown has a `isOpen` property that is still false');
      assert.ok(dropdown.hasOwnProperty('actions'), 'The received dropdown has a `actions` property');
      assert.ok(!!e, 'Receives an argument as second argument');
      assert.ok(true, 'onOpen action was invoked');
    };
    await render(hbs`
      <BasicDropdown @onOpen={{willOpen}} as |dropdown|>
        <button class="ember-basic-dropdown-trigger" onclick={{dropdown.actions.open}}></button>
        {{#if dropdown.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
  });

  test('returning false from the `onOpen` action prevents the dropdown from opening', async function (assert) {
    assert.expect(2);

    this.willOpen = function () {
      assert.ok(true, 'willOpen has been called');
      return false;
    };
    await render(hbs`
      <BasicDropdown @onOpen={{willOpen}} as |dropdown|>
        <button class="ember-basic-dropdown-trigger" onclick={{dropdown.actions.open}}></button>
        {{#if dropdown.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is still closed');
  });

  test('It can receive an onClose action that is fired when the component closes', async function (assert) {
    assert.expect(7);

    this.willClose = function (dropdown, e) {
      assert.equal(dropdown.isOpen, true, 'The received dropdown has a `isOpen` property and its value is `true`');
      assert.ok(dropdown.hasOwnProperty('actions'), 'The received dropdown has a `actions` property');
      assert.ok(!!e, 'Receives an argument as second argument');
      assert.ok(true, 'onClose action was invoked');
    };
    await render(hbs`
      <BasicDropdown @onClose={{willClose}} as |dropdown|>
        <button class="ember-basic-dropdown-trigger" onclick={{dropdown.actions.toggle}}></button>
        {{#if dropdown.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);

    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is closed');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').exists('The dropdown is opened');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is now opened');
  });

  test('returning false from the `onClose` action prevents the dropdown from closing', async function (assert) {
    assert.expect(4);

    this.willClose = function () {
      assert.ok(true, 'willClose has been invoked');
      return false;
    };
    await render(hbs`
      <BasicDropdown @onClose={{willClose}} as |dropdown|>
        <button class="ember-basic-dropdown-trigger" onclick={{dropdown.actions.toggle}}></button>
        {{#if dropdown.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);

    assert.dom('#dropdown-is-opened').doesNotExist('The dropdown is closed');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').exists('The dropdown is opened');
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').exists('The dropdown is still opened');
  });

  test('It can be rendered already opened when the `initiallyOpened=true`', async function (assert) {
    assert.expect(1);

    await render(hbs`
      <BasicDropdown @initiallyOpened=true as |dropdown|>
        {{#if dropdown.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);

    assert.dom('#dropdown-is-opened').exists('The dropdown is opened');
  });

  test('Calling the `open` method while the dropdown is already opened does not call `onOpen` action', async function (assert) {
    assert.expect(1);
    let onOpenCalls = 0;
    this.onOpen = () => {
      onOpenCalls++;
    };

    await render(hbs`
      <BasicDropdown @onOpen={{onOpen}} as |dropdown|>
        <button class="ember-basic-dropdown-trigger" onclick={{dropdown.actions.open}}></button>
        {{#if dropdown.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);
    await click('.ember-basic-dropdown-trigger');
    await click('.ember-basic-dropdown-trigger');
    await click('.ember-basic-dropdown-trigger');
    assert.equal(onOpenCalls, 1, 'onOpen has been called only once');
  });

  test('Calling the `close` method while the dropdown is already opened does not call `onOpen` action', async function (assert) {
    assert.expect(1);
    let onCloseCalls = 0;
    this.onFocus = (dropdown) => {
      dropdown.actions.close();
    };
    this.onClose = () => {
      onCloseCalls++;
    };

    await render(hbs`
      <BasicDropdown @onClose={{onClose}} as |dropdown|>
        <button class="ember-basic-dropdown-trigger" onclick={{dropdown.actions.close}}></button>
        {{#if dropdown.isOpen}}
          <div id="dropdown-is-opened"></div>
        {{/if}}
      </BasicDropdown>
    `);
    await click('.ember-basic-dropdown-trigger');
    await click('.ember-basic-dropdown-trigger');
    await click('.ember-basic-dropdown-trigger');
    assert.equal(onCloseCalls, 0, 'onClose was never called');
  });

  test('It adds the proper class to trigger and content when it receives `horizontalPosition="right"`', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <BasicDropdown @horizontalPosition="right" as |dd|>
        <dd.Trigger>Press me</dd.Trigger>
        <dd.Content><h3>Content of the dropdown</h3></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-trigger').hasClass('ember-basic-dropdown-trigger--right', 'The proper class has been added');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--right', 'The proper class has been added');
  });

  test('It adds the proper class to trigger and content when it receives `horizontalPosition="center"`', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <BasicDropdown @horizontalPosition="center" as |dd|>
        <dd.Trigger>Press me</dd.Trigger>
        <dd.Content><h3>Content of the dropdown</h3></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-trigger').hasClass('ember-basic-dropdown-trigger--center', 'The proper class has been added');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--center', 'The proper class has been added');
  });

  skip('It prefers right over left when it receives "auto-right"', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <BasicDropdown @horizontalPosition="auto-right" as |dd|>
        <dd.Trigger>Press me</dd.Trigger>
        <dd.Content><h3>Content of the dropdown</h3></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-trigger').hasClass('ember-basic-dropdown-trigger--right', 'The proper class has been added');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--right', 'The proper class has been added');
  });

  test('It adds the proper class to trigger and content when it receives `verticalPosition="above"`', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <BasicDropdown @verticalPosition="above" as |dd|>
        <dd.Trigger>Press me</dd.Trigger>
        <dd.Content><h3>Content of the dropdown</h3></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-trigger').hasClass('ember-basic-dropdown-trigger--above', 'The proper class has been added');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--above', 'The proper class has been added');
  });

  test('It passes the `renderInPlace` property to the yielded content component', async function (assert) {
    assert.expect(1);

    await render(hbs`
      <BasicDropdown @renderInPlace=true as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-content').exists('The dropdown is rendered in place');
  });

  test('It adds a special class to both trigger and content when `renderInPlace=true`', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <BasicDropdown @renderInPlace=true as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-trigger').hasClass('ember-basic-dropdown-trigger--in-place', 'The trigger has a special `--in-place` class');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--in-place', 'The content has a special `--in-place` class');
  });

  test('When rendered in-place, the content still contains the --above/below classes', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <BasicDropdown @renderInPlace=true as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--below', 'The content has a class indicating that it was placed below the trigger');

    await render(hbs`
      <BasicDropdown @renderInPlace=true @verticalPosition="above" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--above', 'The content has a class indicating that it was placed above the trigger');
  });

  test('It adds a wrapper element when `renderInPlace=true`', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <BasicDropdown @renderInPlace=true as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown').exists();
    assert.dom('.ember-basic-dropdown-trigger').hasClass('ember-basic-dropdown-trigger--in-place', 'The trigger has a special `--in-place` class');
  });

  test('When rendered in-place, it prefers right over left with position "auto-right"', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <BasicDropdown @renderInPlace=true @horizontalPosition="auto-right" as |dd|>
        <dd.Trigger>Press me</dd.Trigger>
        <dd.Content><h3>Content of the dropdown</h3></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-trigger').hasClass('ember-basic-dropdown-trigger--right', 'The proper class has been added');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--right', 'The proper class has been added');
  });

  test('When rendered in-place, it applies right class for position "right"', async function (assert) {
    assert.expect(2);

    await render(hbs`
      <BasicDropdown @renderInPlace=true @horizontalPosition="right" as |dd|>
        <dd.Trigger>Press me</dd.Trigger>
        <dd.Content><h3>Content of the dropdown</h3></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-trigger').hasClass('ember-basic-dropdown-trigger--right', 'The proper class has been added');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--right', 'The proper class has been added');
  });

  test('It passes the `disabled` property as part of the public API, and updates is if it changes', async function (assert) {
    assert.expect(2);
    this.disabled = true;
    await render(hbs`
      <BasicDropdown @disabled={{this.disabled}} as |dd|>
        {{#if dd.disabled}}
          <div id="disabled-dropdown-marker">Disabled!</div>
        {{else}}
          <div id="enabled-dropdown-marker">Enabled!</div>
        {{/if}}
      </BasicDropdown>
    `);

    assert.dom('#disabled-dropdown-marker').exists('The public API of the component is marked as disabled');
    this.set('disabled', false);
    assert.dom('#enabled-dropdown-marker').exists('The public API of the component is marked as enabled');
  });

  test('It passes the `uniqueId` property as part of the public API', async function (assert) {
    assert.expect(1);
    this.disabled = true;

    await render(hbs`
      <BasicDropdown as |dd|>
        <div id="dropdown-unique-id-container">{{dd.uniqueId}}</div>
      </BasicDropdown>
    `);

    assert.dom('#dropdown-unique-id-container').hasText(/ember\d+/, 'It yields the uniqueId');
  });

  test('If the dropdown gets disabled while it\'s open, it closes automatically', async function (assert) {
    assert.expect(2);

    this.isDisabled = false;
    await render(hbs`
      <BasicDropdown @disabled={{isDisabled}} as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('#dropdown-is-opened').exists('The select is open');
    this.set('isDisabled', true);
    assert.dom('#dropdown-is-opened').doesNotExist('The select is now closed');
  });

  test('If the component\'s `disabled` property changes, the `registerAPI` action is called', async function (assert) {
    assert.expect(3);

    this.isDisabled = false;
    this.toggleDisabled = () => this.toggleProperty('isDisabled');
    this.registerAPI = (api) => schedule('actions', () => this.set('remoteController', api));
    await render(hbs`
      <BasicDropdown @disabled={{isDisabled}} @registerAPI={{action registerAPI}} as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
      </BasicDropdown>
      <button onclick={{action toggleDisabled}}>Toggle</button>
      {{#if remoteController.disabled}}
        <div id="is-disabled"></div>
      {{/if}}
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom('#is-disabled').doesNotExist('The select is enabled');
    this.set('isDisabled', true);
    assert.dom('#is-disabled').exists('The select is disabled');
    this.set('isDisabled', false);
    assert.dom('#is-disabled').doesNotExist('The select is enabled again');
  });


  test('It can receive `destination=id-of-elmnt` to customize where `#-in-element` is going to render the content', async function (assert) {
    assert.expect(1);

    await render(hbs`
      <BasicDropdown @destination="id-of-elmnt" as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content>Hello</dd.Content>
      </BasicDropdown>
      <div id="id-of-elmnt"></div>
    `);

    await click('.ember-basic-dropdown-trigger');
    assert.dom(this.element.querySelector('.ember-basic-dropdown-content').parentNode).hasAttribute('id', 'id-of-elmnt', 'The content has been rendered in an alternative destination');
  });

  // A11y
  test('By default, the `aria-owns` attribute of the trigger contains the id of the content', async function (assert) {
    assert.expect(1);

    await render(hbs`
      <BasicDropdown @renderInPlace=true as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);
    await click('.ember-basic-dropdown-trigger');
    let content = this.element.querySelector('.ember-basic-dropdown-content');
    assert.dom('.ember-basic-dropdown-trigger').hasAttribute('aria-owns', content.id, 'The trigger controls the content');
  });

  // Repositioning
  test('Firing a reposition outside of a runloop doesn\'t break the component', async function (assert) {
    //
    //
    //
    // I don't think this test is working really
    //
    //
    //
    assert.expect(1);

    await render(hbs`
      <BasicDropdown as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);
    await click('.ember-basic-dropdown-trigger');
    document.querySelector('#dropdown-is-opened').innerHTML = '<span>New content that will trigger a reposition</span>';
    return new Promise(resolve => {
      setTimeout(() => {
        assert.equal(deprecations.length, 0, 'No deprecation warning was raised');
        resolve();
      }, 100)
    });
  });

  test('The `reposition` public action returns an object with the changes', async function (assert) {
    assert.expect(4);
    let remoteController;
    this.saveAPI = (api) => remoteController = api;

    await render(hbs`
      <BasicDropdown @registerAPI={{action saveAPI}} as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);
    await click('.ember-basic-dropdown-trigger');

    let returnValue = run(() => remoteController.actions.reposition());
    assert.ok(returnValue.hasOwnProperty('hPosition'));
    assert.ok(returnValue.hasOwnProperty('vPosition'));
    assert.ok(returnValue.hasOwnProperty('top'));
    assert.ok(returnValue.hasOwnProperty('left'));
  });

  test('The user can pass a custom `calculatePosition` function to customize how the component is placed on the screen', async function (assert) {
    this.calculatePosition = function(triggerElement, dropdownElement, destinationElement, { dropdown }) {
      assert.ok(dropdown, 'dropdown should be passed to the component');
      return {
        horizontalPosition: 'right',
        verticalPosition: 'above',
        style: {
          top: 111,
          width: 100,
          height: 110
        }
      };
    };
    await render(hbs`
      <BasicDropdown @calculatePosition={{this.calculatePosition}} as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);
    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--above', 'The dropdown is above');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--right', 'The dropdown is in the right');
    assert.dom('.ember-basic-dropdown-content').hasAttribute('style', 'top: 111px;width: 100px;height: 110px', 'The style attribute is the expected one');
  });

  test('The user can use the `renderInPlace` flag option to modify how the position is calculated in the `calculatePosition` function', async function(assert) {
    assert.expect(4);
    this.calculatePosition = function(triggerElement, dropdownElement, destinationElement, { dropdown, renderInPlace }) {
      assert.ok(dropdown, 'dropdown should be passed to the component');
      if (renderInPlace) {
        return {
          horizontalPosition: 'right',
          verticalPosition: 'above',
          style: {
            top: 111,
            right: 222
          }
        };
      } else {
        return {
          horizontalPosition: 'left',
          verticalPosition: 'bottom',
          style: {
            top: 333,
            right: 444
          }
        };
      }
    };
    await render(hbs`
      <BasicDropdown @calculatePosition={{this.calculatePosition}} @renderInPlace=true as |dd|>
        <dd.Trigger>Click me</dd.Trigger>
        <dd.Content><div id="dropdown-is-opened"></div></dd.Content>
      </BasicDropdown>
    `);
    await click('.ember-basic-dropdown-trigger');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--above', 'The dropdown is above');
    assert.dom('.ember-basic-dropdown-content').hasClass('ember-basic-dropdown-content--right', 'The dropdown is in the right');
    assert.dom('.ember-basic-dropdown-content').hasAttribute('style', 'top: 111px;right: 222px', 'The style attribute is the expected one');
  });

  // Customization of inner components
  test('It allows to customize the trigger passing `@triggerComponent="my-custom-trigger"`', async function (assert) {
    this.owner.register('component:my-custom-trigger', class extends Component {});
    this.owner.register("template:components/my-custom-trigger", hbs`<span id="my-custom-trigger">My custom trigger</span>`);
    assert.expect(1);

    await render(hbs`
      <BasicDropdown @triggerComponent="my-custom-trigger" as |dd|>
        <dd.Trigger>Press me</dd.Trigger>
        <dd.Content><h3>Content of the dropdown</h3></dd.Content>
      </BasicDropdown>
    `);

    assert.dom('#my-custom-trigger').exists('The custom component has been rendered');
  });

  test('It allows to customize the content passing `@contentComponent="my-custom-content"`', async function (assert) {
    assert.expect(1);
    this.owner.register('component:my-custom-content', class extends Component { });
    this.owner.register("template:components/my-custom-content", hbs`<span id="my-custom-content">My custom content</span>`);
    await render(hbs`
      <BasicDropdown @contentComponent="my-custom-content" as |dd|>
        <dd.Trigger>Press me</dd.Trigger>
        <dd.Content><h3>Content of the dropdown</h3></dd.Content>
      </BasicDropdown>
    `);
    await click('.ember-basic-dropdown-trigger');
    assert.dom('#my-custom-content').exists('The custom component has been rendered');
  });
});
