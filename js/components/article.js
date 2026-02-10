/**
 * Article component - Reusable article structure
 * Used by Renderer across sections
 */
(function (global) {
    'use strict';

    function create(options) {
        var title = options.title || '';
        var content = options.content || '';
        var className = options.className || '';
        var id = options.id || '';

        var html = '<article class="article ' + (className) + '"' + (id ? ' id="' + id + '"' : '') + '>';
        if (title) html += '<h2 class="article-title">' + escapeHtml(title) + '</h2>';
        html += '<div class="article-content">' + content + '</div>';
        html += '</article>';
        return html;
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    global.ArticleComponent = { create: create };
})(typeof window !== 'undefined' ? window : this);
