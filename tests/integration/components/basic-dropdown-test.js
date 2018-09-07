import { module, test, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, triggerEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | basic-dropdown', function(hooks) {
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

});
