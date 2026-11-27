const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const script = readFileSync(require('node:path').join(__dirname, '../assets/js/news-scroll.js'), 'utf8');

function setup() {
    const events = {};
    const frames = [];
    const track = { hidden: true };
    const thumb = { style: {} };
    const scroller = {
        clientHeight: 400, scrollHeight: 1600, scrollTop: 0, children: [{}, {}],
        addEventListener(name, handler) { events[name] = handler; }
    };
    const observed = [];
    let resize;
    const shell = {
        classList: { add() {} },
        querySelector(selector) {
            return { '.custom-scrollbar': scroller, '.news-scroll-indicator': track, '.news-scroll-thumb': thumb }[selector];
        }
    };
    vm.runInNewContext(script, {
        document: { querySelector: () => shell },
        window: { addEventListener(name, handler) { events[name] = handler; } },
        requestAnimationFrame(callback) { frames.push(callback); },
        ResizeObserver: class {
            constructor(callback) { resize = callback; }
            observe(element) { observed.push(element); }
        }
    });
    const flush = () => { while (frames.length) frames.shift()(); };
    flush();
    return { scroller, track, thumb, events, observed, resize, flush, frames };
}

test('indicator is visible before scrolling and tracks the full scroll range', () => {
    const app = setup();
    assert.equal(app.track.hidden, false);
    assert.equal(app.thumb.style.height, '100px');
    assert.equal(app.thumb.style.transform, 'translateY(0px)');
    for (const [scrollTop, offset] of [[600, 150], [1200, 300], [-80, 0], [1400, 300]]) {
        app.scroller.scrollTop = scrollTop;
        app.events.scroll();
        app.flush();
        assert.equal(app.thumb.style.transform, `translateY(${offset}px)`);
    }
});

test('resizes and content changes recalculate the thumb and hide it without overflow', () => {
    const app = setup();
    assert.equal(app.observed.length, 3);
    app.scroller.scrollHeight = 400;
    app.resize();
    app.flush();
    assert.equal(app.track.hidden, true);
    app.scroller.scrollHeight = 10000;
    app.resize();
    app.flush();
    assert.equal(app.track.hidden, false);
    assert.equal(app.thumb.style.height, '28px');
    app.scroller.clientHeight = 0;
    app.events.resize();
    app.flush();
    assert.equal(app.track.hidden, true);
});

test('scroll updates are batched into one animation frame', () => {
    const app = setup();
    app.events.scroll();
    app.events.scroll();
    app.events.resize();
    assert.equal(app.frames.length, 1);
});
