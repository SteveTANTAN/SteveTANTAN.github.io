const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const script = readFileSync(require('node:path').join(__dirname, '../assets/js/publication-zoom.js'), 'utf8');

function setup(filename = 'Hydra.png') {
    const source = {
        src: 'https://example.test/assets/img/' + filename,
        alt: filename,
        dataset: {},
        setAttribute() {},
        addEventListener() {}
    };
    const handlers = {};
    const requests = [];
    let active = source;
    let clone;
    const zoom = {
        on(name, handler) { handlers[name] = handler; },
        update() {},
        getZoomedImage() { return active; }
    };
    class DeferredImage {
        constructor() {
            requests.push(this);
            this.ready = new Promise((resolve, reject) => {
                this.finish = resolve;
                this.fail = reject;
            });
        }
        decode() { return this.ready; }
    }
    vm.runInNewContext(script, {
        URL,
        Image: DeferredImage,
        window: { mediumZoom: () => zoom, matchMedia: () => ({ matches: false }) },
        document: {
            documentElement: { clientWidth: 1280, clientHeight: 720 },
            querySelectorAll(selector) {
                return selector.startsWith('#publication-list-view') ? [source] : [clone];
            },
            querySelector() { return clone; }
        }
    });
    return {
        source, requests,
        open() {
            active = source;
            clone = { src: source.src, isConnected: true, setAttribute() {} };
            handlers.open({ target: source });
            return clone;
        },
        opened() { return handlers.opened({ target: source }); },
        close() {
            handlers.close();
            active = null;
            // Still connected while the closing animation runs.
        }
    };
}

test('HD loading starts after animation and swaps only after decoding', async () => {
    const app = setup();
    const clone = app.open();
    assert.equal(app.source.dataset.zoomSrc, undefined);
    assert.equal(app.requests.length, 0);
    const done = app.opened();
    assert.equal(app.requests.length, 1);
    assert.equal(clone.src, app.source.src);
    app.requests[0].finish();
    await done;
    assert.equal(clone.src, './assets/img/hd/Hydra.webp');
});

test('closing a preview prevents a pending HD replacement', async () => {
    const app = setup();
    const clone = app.open();
    const done = app.opened();
    app.close();
    app.requests[0].finish();
    await done;
    assert.equal(clone.src, app.source.src);
});

test('reopening the same image ignores the previous pending request', async () => {
    const app = setup();
    const oldClone = app.open();
    const oldDone = app.opened();
    app.close();
    const newClone = app.open();
    const newDone = app.opened();
    app.requests[0].finish();
    await oldDone;
    assert.equal(oldClone.src, app.source.src);
    assert.equal(newClone.src, app.source.src);
    app.requests[1].finish();
    await newDone;
    assert.equal(newClone.src, './assets/img/hd/Hydra.webp');
});

test('HD errors retain the thumbnail without an unhandled rejection', async () => {
    const app = setup();
    const clone = app.open();
    const done = app.opened();
    app.requests[0].fail(new Error('Image unavailable'));
    await done;
    assert.equal(clone.src, app.source.src);
});

test('MemoTime continues to use only its existing image', async () => {
    const app = setup('MemoTime.jpg');
    const clone = app.open();
    await app.opened();
    assert.equal(app.requests.length, 0);
    assert.equal(clone.src, app.source.src);
});
