(function () {
    'use strict';

    var list = document.getElementById('publication-list-view');
    if (!list) return;

    function titleKey(title) {
        return title.trim().replace(/\s+/g, ' ').toLowerCase();
    }

    // Use the tree's labels and memberships as the source for the list view.
    var areas = {};
    ['structure', 'memory', 'efficiency', 'systems', 'foundation'].forEach(function (area) {
        var label = document.querySelector('.tree-label-' + area + ' strong');
        if (label) areas[area] = label.textContent.trim();
    });
    var memberships = new Map();
    document.querySelectorAll('.paper-leaf-node[data-title]').forEach(function (leaf) {
        var key = titleKey(leaf.getAttribute('data-title'));
        var tokens = memberships.get(key) || [];
        (leaf.getAttribute('data-branch') || '').split(/\s+/).forEach(function (area) {
            if (areas[area] && tokens.indexOf(area) === -1) tokens.push(area);
        });
        memberships.set(key, tokens);
    });

    // The list can show secondary areas without adding more nodes to the tree.
    var additionalListAreas = new Map([
        ['SkillZip: Contract-Preserving Graph Compression for Scalable Agent Skill Libraries', ['structure']],
        ['Trace Only What You Need: Structure-Aware On-Demand Hypergraph Memory for Long-Document Question Answering', ['memory']],
        ['PrivGemo: Privacy-Preserving Dual-Tower Graph Retrieval for Empowering LLM Reasoning with Memory Augmentation', ['structure']],
        ['HydraRAG: Structured Cross-Source Enhanced Large Language Model Reasoning', ['structure']],
        ['MemoTime: Memory-Augmented Temporal Knowledge Graph Enhanced Large Language Model Reasoning', ['structure']],
        ['Weaving Multi-Source Evidence for Biomedical Reasoning: The BioMedHop Benchmark and BioWeave Framework', ['systems']]
    ].map(function (entry) { return [titleKey(entry[0]), entry[1]]; }));

    var tooltip = document.createElement('div');
    tooltip.id = 'publication-area-tooltip';
    tooltip.className = 'publication-area-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
    var active = null;

    function hideTooltip() {
        if (active) active.removeAttribute('aria-describedby');
        active = null;
        tooltip.hidden = true;
    }

    function showTooltip(button) {
        hideTooltip();
        active = button;
        tooltip.textContent = button.getAttribute('aria-label');
        tooltip.hidden = false;
        button.setAttribute('aria-describedby', tooltip.id);
        var rect = button.getBoundingClientRect();
        var width = tooltip.offsetWidth;
        var height = tooltip.offsetHeight;
        var left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2,
            document.documentElement.clientWidth - width - 12));
        var top = rect.top - height - 8;
        if (top < 12) top = rect.bottom + 8;
        top = Math.max(12, Math.min(top, window.innerHeight - height - 12));
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    list.querySelectorAll('.publication-card-body').forEach(function (body) {
        var heading = body.querySelector('h3');
        var row = body.querySelector('.mt-3.flex');
        var card = body.parentElement;
        var visual = card.querySelector('.publication-visual');
        if (!heading || !row || !visual || visual.querySelector('.publication-image-header')) return;
        var venue = row.firstElementChild;
        if (!venue) return;
        var header = document.createElement('div');
        header.className = 'publication-image-header';
        var paperLink = card.querySelector('a[href]');
        var badge = document.createElement(paperLink ? 'a' : 'span');
        badge.className = 'publication-venue-label';
        badge.textContent = venue.textContent.trim();
        if (paperLink) {
            badge.href = paperLink.href;
            badge.target = '_blank';
            badge.rel = 'noopener noreferrer';
            badge.setAttribute('aria-label', badge.textContent + ': ' + heading.textContent.trim());
        }
        header.appendChild(badge);
        venue.remove();
        if (!row.children.length) row.remove();
        visual.classList.add('has-publication-header');
        visual.prepend(header);
        var key = titleKey(heading.textContent);
        var tokens = (memberships.get(key) || []).slice();
        (additionalListAreas.get(key) || []).forEach(function (area) {
            if (areas[area] && tokens.indexOf(area) === -1) tokens.push(area);
        });
        tokens = tokens.slice(0, 3);
        if (!tokens.length) return;
        var group = document.createElement('span');
        group.className = 'publication-areas';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'Research areas');
        tokens.forEach(function (area) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'publication-area-dot leaf-' + area;
            button.setAttribute('data-area', area);
            button.setAttribute('aria-label', areas[area]);
            button.addEventListener('mouseenter', function () { showTooltip(button); });
            button.addEventListener('mouseleave', function () {
                if (active === button && document.activeElement !== button) hideTooltip();
            });
            button.addEventListener('focus', function () { showTooltip(button); });
            button.addEventListener('blur', function () {
                if (active === button) hideTooltip();
            });
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                showTooltip(button);
            });
            group.appendChild(button);
        });
        header.appendChild(group);
    });

    document.addEventListener('pointerdown', function (event) {
        if (!event.target.closest('.publication-area-dot')) hideTooltip();
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') hideTooltip();
    });
    document.addEventListener('scroll', function () {
        if (!active) return;
        var rect = active.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) hideTooltip();
        else showTooltip(active);
    }, true);
    window.addEventListener('resize', hideTooltip);
}());
