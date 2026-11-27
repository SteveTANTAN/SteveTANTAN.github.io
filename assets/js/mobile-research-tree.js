(function () {
    'use strict';
    const dialog = document.getElementById('mobile-tree-dialog');
    const shell = document.querySelector('#publication-tree-view .research-tree-shell');
    if (!dialog || !shell || !dialog.showModal) return;
    const canvas = shell.querySelector('.research-tree-canvas');
    const detail = shell.querySelector('.research-tree-detail');
    const viewport = dialog.querySelector('.mobile-tree-viewport');
    const stage = dialog.querySelector('.mobile-tree-stage');
    const dock = dialog.querySelector('.mobile-tree-detail-dock');
    const mobile = window.matchMedia('(max-width: 1199px)');
    const zoomIn = dialog.querySelector('[data-tree-action="in"]');
    const zoomOut = dialog.querySelector('[data-tree-action="out"]');
    const closeButton = dialog.querySelector('[data-tree-action="close"]');
    let scale = 1;
    let savedScroll = 0;
    let savedBodyStyle = '';
    let returnFocus;
    let drag;
    let suppressClick = false;

    function setScale(next, root) {
        const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / scale;
        const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / scale;
        scale = Math.max(0.5, Math.min(1.5, next));
        stage.style.width = 1000 * scale + 'px';
        stage.style.height = 1000 * scale + 'px';
        canvas.style.transform = 'scale(' + scale + ')';
        zoomIn.disabled = scale >= 1.5;
        zoomOut.disabled = scale <= 0.5;
        viewport.scrollLeft = root ? (1000 * scale - viewport.clientWidth) / 2 : centerX * scale - viewport.clientWidth / 2;
        viewport.scrollTop = root ? 1000 * scale - viewport.clientHeight : centerY * scale - viewport.clientHeight / 2;
    }
    function open() {
        if (dialog.open || !mobile.matches) return;
        returnFocus = document.activeElement;
        savedScroll = window.scrollY;
        savedBodyStyle = document.body.style.cssText;
        document.body.style.position = 'fixed';
        document.body.style.top = -savedScroll + 'px';
        document.body.style.width = '100%';
        stage.appendChild(canvas);
        dock.appendChild(detail);
        dock.hidden = true;
        suppressClick = false;
        dialog.showModal();
        closeButton.focus({ preventScroll: true });
        requestAnimationFrame(function () { if (dialog.open) setScale(1, true); });
    }
    function close() { if (dialog.open) dialog.close(); }
    dialog.addEventListener('close', function () {
        canvas.style.removeProperty('transform');
        shell.appendChild(canvas);
        shell.appendChild(detail);
        canvas.classList.remove('has-tree-focus');
        canvas.querySelectorAll('.is-current, .is-related, .is-active').forEach(function (node) {
            node.classList.remove('is-current', 'is-related', 'is-active');
        });
        document.body.style.cssText = savedBodyStyle;
        window.scrollTo({ top: savedScroll, behavior: 'instant' });
        document.dispatchEvent(new CustomEvent('mobile-tree-close', { detail: { desktop: !mobile.matches } }));
        if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
        drag = null;
        viewport.classList.remove('is-dragging');
    });
    dialog.querySelectorAll('[data-tree-action]').forEach(function (button) {
        button.addEventListener('click', function () {
            const action = button.dataset.treeAction;
            if (action === 'close') close();
            else if (action === 'root') { dock.hidden = true; setScale(1, true); }
            else setScale(scale + (action === 'in' ? 0.15 : -0.15), false);
        });
    });
    mobile.addEventListener('change', function () { if (!mobile.matches) close(); });

    // Touch uses native two-axis scrolling; mouse dragging is an additional input path.
    viewport.addEventListener('pointerdown', function (event) {
        suppressClick = false;
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop, moved: false };
    });
    viewport.addEventListener('pointermove', function (event) {
        if (!drag || event.pointerId !== drag.id) return;
        if (event.buttons !== 1) { endDrag(); return; }
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < 6) return;
        drag.moved = true;
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add('is-dragging');
        viewport.scrollLeft = drag.left - dx;
        viewport.scrollTop = drag.top - dy;
        event.preventDefault();
    });
    function endDrag() {
        if (drag) suppressClick = drag.moved;
        drag = null;
        viewport.classList.remove('is-dragging');
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('dragstart', function (event) { event.preventDefault(); });
    viewport.addEventListener('click', function (event) {
        if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
    }, true);
    window.mobileResearchTree = {
        open: open,
        close: close,
        isMobile: function () { return mobile.matches; },
        isOpen: function () { return dialog.open; },
        showDetail: function () { dock.hidden = false; }
    };
}());
