const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const script = readFileSync(require('node:path').join(__dirname, '../assets/js/publication-zoom.js'), 'utf8');

function setup(filename, mobile) {
    const source = {
        src: 'https://example.test/assets/img/' + filename,
        alt: filename,
        dataset: {},
        setAttribute() {},
        addEventListener() {}
    };
    const handlers = {};
    let options;
    let clone;
    const zoom = {
        on(name, handler) { handlers[name] = handler; },
        update(value) { options = value; }
    };
    vm.runInNewContext(script, {
        URL,
        Image: class { constructor() { throw new Error('Zoom must reuse the list image'); } },
        window: { mediumZoom: () => zoom, matchMedia: () => ({ matches: mobile }), scrollX: 0, scrollY: 400 },
        document: {
            documentElement: { clientWidth: mobile ? 390 : 1280, clientHeight: 844 },
            querySelectorAll(selector) {
                return selector.startsWith('#publication-list-view') ? [source] : [clone];
            }
        }
    });
    return {
        source,
        open() {
            clone = {
                src: source.src,
                setAttribute() {},
                getBoundingClientRect() { return { left: 160, top: 100, width: 960, height: 400 }; },
                style: {
                    cssText: 'width: 240px; height: 100px; transform: scale(4);',
                    setProperty(name, value) { this[name] = value; },
                    removeProperty(name) { delete this[name]; }
                },
                offsetWidth: 240
            };
            handlers.open({ target: source });
            handlers.opened({ target: source });
            return { clone, options };
        },
        close() { handlers.close(); }
    };
}

test('opened preview renders at actual dimensions and restores closing geometry', () => {
    const app = setup('Hydra.png', false);
    const { clone } = app.open();
    assert.equal(clone.style.transform, 'none');
    assert.equal(clone.style.transition, 'none');
    assert.equal(clone.style.width, '960px');
    assert.equal(clone.style.height, '400px');
    assert.equal(clone.style.top, '500px');
    assert.equal(clone.style.left, '160px');
    assert.equal(clone.style.maxHeight, 'none');
    app.close();
    assert.equal(clone.style.cssText, 'width: 240px; height: 100px; transform: scale(4);');
    assert.equal(clone.style.transform, '');
    assert.equal(clone.style.transition, undefined);
});

for (const mobile of [false, true]) {
    const platform = mobile ? 'mobile' : 'desktop';
    test(platform + ' reuses the list image for zoom without another request', () => {
        const app = setup('Hydra.png', mobile);
        assert.equal(app.source.src, mobile
            ? 'https://example.test/assets/img/Hydra.png'
            : './assets/img/hd/Hydra.webp');
        assert.equal(app.source.dataset.zoomSrc, undefined);
        const { clone, options } = app.open();
        assert.equal(clone.src, app.source.src);
        if (mobile) {
            assert.equal(options.margin, 12);
            assert.equal(options.container, null);
        } else {
            assert.equal(app.source.loading, 'eager');
            assert.equal(app.source.decoding, 'async');
            assert.equal(options.container.left, 1280 * 0.125);
            assert.equal(options.container.right, 1280 * 0.125);
        }
    });

    test(platform + ' leaves MemoTime unchanged', () => {
        const app = setup('MemoTime.jpg', mobile);
        assert.equal(app.source.src, 'https://example.test/assets/img/MemoTime.jpg');
        assert.equal(app.open().clone.src, app.source.src);
    });
}
