(function () {
    'use strict';

    const shell = document.querySelector('.news-scroll-shell');
    if (!shell) return;
    const scroller = shell.querySelector('.custom-scrollbar');
    const track = shell.querySelector('.news-scroll-indicator');
    const thumb = shell.querySelector('.news-scroll-thumb');
    if (!scroller || !track || !thumb) return;

    let pending = false;
    function update() {
        pending = false;
        const height = scroller.clientHeight;
        const range = scroller.scrollHeight - height;
        track.hidden = height === 0 || range <= 1;
        if (track.hidden) return;

        const thumbHeight = Math.min(height, Math.max(28, height * height / scroller.scrollHeight));
        // Clamp elastic overscroll so the indicator stays inside its track on iOS.
        const progress = Math.max(0, Math.min(1, scroller.scrollTop / range));
        thumb.style.height = thumbHeight + 'px';
        thumb.style.transform = 'translateY(' + progress * (height - thumbHeight) + 'px)';
    }
    function scheduleUpdate() {
        if (pending) return;
        pending = true;
        requestAnimationFrame(update);
    }

    shell.classList.add('has-scroll-indicator');
    scroller.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('load', scheduleUpdate);
    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(scheduleUpdate);
        observer.observe(scroller);
        Array.from(scroller.children).forEach(function (child) { observer.observe(child); });
    }
    if (document.fonts) document.fonts.ready.then(scheduleUpdate);
    scheduleUpdate();
}());
