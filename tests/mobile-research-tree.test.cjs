const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const script = readFileSync(require('node:path').join(__dirname, '../assets/js/mobile-research-tree.js'), 'utf8');

function element() {
    const listeners = {};
    return {
        listeners, children: [], scrollLeft: 0, scrollTop: 0, isConnected: true,
        style: { cssText: '', removeProperty(key) { delete this[key]; } },
        classList: { add() {}, remove() {} },
        addEventListener(type, callback) { listeners[type] = callback; },
        appendChild(child) { child.parent = this; },
        focus() { this.focused = true; },
        setPointerCapture() {},
        querySelectorAll() { return []; }
    };
}
function setup() {
    const dialog = element();
    dialog.open = false;
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; dialog.listeners.close(); };
    const shell = element();
    const canvas = element();
    const detail = element();
    const viewport = Object.assign(element(), { clientWidth: 390, clientHeight: 700 });
    const stage = element();
    const dock = element();
    const buttons = Object.fromEntries(['in', 'out', 'root', 'close'].map(action => [action, Object.assign(element(), { dataset: { treeAction: action } })]));
    dialog.querySelector = selector => ({ '.mobile-tree-viewport': viewport, '.mobile-tree-stage': stage, '.mobile-tree-detail-dock': dock }[selector] || buttons[selector.match(/"(\w+)"/)[1]]);
    dialog.querySelectorAll = () => Object.values(buttons);
    shell.querySelector = selector => selector === '.research-tree-canvas' ? canvas : detail;
    const mobile = { matches: true, addEventListener(type, callback) { this.change = callback; } };
    const frames = [];
    const events = [];
    const focusTarget = element();
    const body = element();
    body.style.cssText = 'color: red;';
    const window = {
        scrollY: 1250,
        matchMedia: () => mobile,
        scrollTo(value) { this.restoredScroll = value.top; }
    };
    vm.runInNewContext(script, {
        window,
        document: {
            body, activeElement: focusTarget,
            getElementById: () => dialog,
            querySelector: () => shell,
            dispatchEvent(event) { events.push(event); }
        },
        requestAnimationFrame(callback) { frames.push(callback); },
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
    });
    const flush = () => { while (frames.length) frames.shift()(); };
    return { api: window.mobileResearchTree, window, body, dialog, shell, canvas, detail, stage, dock, viewport, mobile, buttons, events, focusTarget, flush };
}

test('mobile opens at roots and restores shared nodes, page scroll and focus on close', () => {
    const app = setup();
    app.api.open();
    app.flush();
    assert.equal(app.dialog.open, true);
    assert.equal(app.canvas.parent, app.stage);
    assert.equal(app.detail.parent, app.dock);
    assert.equal(app.viewport.scrollLeft, 305);
    assert.equal(app.viewport.scrollTop, 300);
    assert.equal(app.body.style.position, 'fixed');
    app.api.showDetail();
    assert.equal(app.dock.hidden, false);
    app.buttons.root.listeners.click();
    assert.equal(app.dock.hidden, true);
    app.api.close();
    assert.equal(app.canvas.parent, app.shell);
    assert.equal(app.detail.parent, app.shell);
    assert.equal(app.body.style.cssText, 'color: red;');
    assert.equal(app.window.restoredScroll, 1250);
    assert.equal(app.focusTarget.focused, true);
    assert.equal(app.events[0].detail.desktop, false);
});

test('zoom preserves the viewed center and stays within bounds', () => {
    const app = setup();
    app.api.open(); app.flush();
    app.buttons.in.listeners.click();
    assert.ok(Math.abs((app.viewport.scrollLeft + 195) / 1.15 - 500) < 0.01);
    for (let i = 0; i < 20; i++) app.buttons.in.listeners.click();
    assert.equal(app.stage.style.width, '1500px');
    assert.equal(app.buttons.in.disabled, true);
    for (let i = 0; i < 20; i++) app.buttons.out.listeners.click();
    assert.equal(app.stage.style.width, '500px');
    assert.equal(app.buttons.out.disabled, true);
});

test('desktop breakpoint restores the inline tree and desktop cannot open modal', () => {
    const app = setup();
    app.api.open(); app.flush();
    app.mobile.matches = false;
    app.mobile.change();
    assert.equal(app.dialog.open, false);
    assert.equal(app.events[0].detail.desktop, true);
    app.api.open();
    assert.equal(app.dialog.open, false);
});

test('drag pans without activating a leaf, while touch retains native scrolling', () => {
    const app = setup();
    app.api.open(); app.flush();
    const listeners = app.viewport.listeners;
    listeners.pointerdown({ pointerType: 'mouse', pointerId: 1, button: 0, clientX: 100, clientY: 100 });
    listeners.pointermove({ pointerId: 1, buttons: 1, clientX: 140, clientY: 125, preventDefault() {} });
    assert.equal(app.viewport.scrollLeft, 265);
    assert.equal(app.viewport.scrollTop, 275);
    listeners.pointerup();
    let prevented = false;
    listeners.click({ preventDefault() { prevented = true; }, stopPropagation() {} });
    assert.equal(prevented, true);
    listeners.pointerdown({ pointerType: 'touch' });
    listeners.pointermove({ pointerId: 2, buttons: 1, clientX: 200, clientY: 200 });
    assert.equal(app.viewport.scrollLeft, 265);
});
