(function () {
    'use strict';

    if (typeof window.mediumZoom !== 'function') return;

    const images = document.querySelectorAll('#publication-list-view .publication-visual > img');
    const highResolutionSources = {
        'KaleidoKV.webp': 'KaleidoKV.webp',
        'SkillZip.webp': 'SkillZip.webp',
        'BlindStep.webp': 'BlindStep.webp',
        'HyperAgent.jpg': 'HyperAgent.webp',
        'DocTrace.jpg': 'DocTrace.webp',
        'BioWave.jpg': 'BioWave.webp',
        'PrivGemo.jpg': 'PrivGemo.webp',
        'RGVQ.jpg': 'RGVQ.webp',
        'PRoH.png': 'PRoH.webp',
        'Hydra.png': 'Hydra.webp',
        'PoG_homepage.png': 'PoG.webp',
        'CIKM.jpg': 'CIKM.webp'
    };
    const previewSources = new WeakMap();
    let previewVersion = 0;
    // Avoid data-zoom-src: the library fetches it before the animation completes.
    // MemoTime deliberately retains its existing image at both sizes.
    images.forEach(function (image) {
        const filename = new URL(image.src).pathname.split('/').pop();
        if (highResolutionSources[filename]) {
            previewSources.set(image, './assets/img/hd/' + highResolutionSources[filename]);
        }
    });
    const zoom = window.mediumZoom(images, {
        margin: 24,
        background: 'rgba(255, 255, 255, 0.94)'
    });

    images.forEach(function (image) {
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
        image.setAttribute('aria-label', 'Enlarge ' + image.alt);
        image.setAttribute('aria-expanded', 'false');
        image.addEventListener('click', function (event) {
            // Keep image previews separate from the card's publication link.
            event.preventDefault();
            event.stopPropagation();
            zoom.toggle({ target: image });
        });
        image.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                zoom.toggle({ target: image });
            }
            if (event.key === 'Tab') zoom.close();
        });
    });

    zoom.on('open', function (event) {
        previewVersion += 1;
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;
        const mobile = window.matchMedia('(max-width: 767px)').matches;
        zoom.update({
            margin: mobile ? 12 : 0,
            container: mobile ? null : {
                width: width,
                height: height,
                left: width * 0.125,
                right: width * 0.125,
                top: height * 0.125,
                bottom: height * 0.125
            }
        });
        event.target.setAttribute('aria-expanded', 'true');
    });
    zoom.on('opened', async function (event) {
        // The library's visual clone should not duplicate the keyboard control.
        document.querySelectorAll('.medium-zoom-image--opened').forEach(function (clone) {
            clone.tabIndex = -1;
            clone.setAttribute('aria-hidden', 'true');
        });
        const source = previewSources.get(event.target);
        const preview = document.querySelector('body > .medium-zoom-image--opened');
        if (!source || !preview) return;

        const version = previewVersion;
        const fullResolution = new Image();
        fullResolution.decoding = 'async';
        fullResolution.src = source;
        try {
            await fullResolution.decode();
        } catch (_) {
            return; // Keep the visible thumbnail if the HD file cannot load.
        }
        if (version === previewVersion && preview.isConnected &&
            zoom.getZoomedImage() === event.target) {
            preview.src = source;
        }
    });
    zoom.on('close', function () {
        previewVersion += 1;
    });
    zoom.on('closed', function (event) {
        event.target.setAttribute('aria-expanded', 'false');
    });
})();
