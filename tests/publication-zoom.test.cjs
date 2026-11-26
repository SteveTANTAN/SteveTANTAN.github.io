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
        window: { mediumZoom: () => zoom, matchMedia: () => ({ matches: mobile }) },
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
            clone = { src: source.src, setAttribute() {} };
            handlers.open({ target: source });
            handlers.opened({ target: source });
            return { clone, options };
        }
    };
}

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
