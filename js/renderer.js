/**
 * renderer.js - Reusable Renderer
 * Uses getAssetPath() for canonical asset URLs
 * Loads text from assets/text/{section}/{category}.txt via fetch
 */
(function (global) {
    'use strict';

    var Article = global.ArticleComponent;
    var Parallax = global.ParallaxComponent;
    var ScrollSnap = global.ScrollSnapComponent;
    var getAssetPath = global.getAssetPath;
    var loadTextContent = global.loadTextContent;
    var Device = global.Device;

    function isMobile() {
        return Device && Device.isMobile ? Device.isMobile() : false;
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function escapeAttr(str) {
        if (!str) return '';
        return String(str).replace(/"/g, '&quot;');
    }

    /**
     * Resolve asset path via getAssetPath (device-aware)
     */
    function assetPath(type, section, category, fileName) {
        return getAssetPath ? getAssetPath(type, section, category, fileName) : '';
    }

    /**
     * Render using Article structure
     */
    function renderArticle(data) {
        return Article && Article.create ? Article.create({
            title: data.title,
            content: data.content || data.description || '',
            className: data.className || ''
        }) : '<article><h2>' + escapeHtml(data.title) + '</h2><div>' + (data.content || data.description || '') + '</div></article>';
    }

    /**
     * Render with Parallax layer
     */
    function renderParallax(html, depth) {
        return Parallax && Parallax.createLayer ? Parallax.createLayer(html, depth) : '<div class="parallax-layer">' + html + '</div>';
    }

    /**
     * Render with Scroll Snap section
     */
    function renderScrollSnap(html, id) {
        return ScrollSnap && ScrollSnap.createSnapSection ? ScrollSnap.createSnapSection(html, id) : '<div data-snap>' + html + '</div>';
    }

    /**
     * Main render entry - async when text fetch is used
     */
    function render(resolved, targetId) {
        var target = document.getElementById(targetId || 'app');
        if (!target) return Promise.resolve();

        return resolveAndRender(resolved).then(function (html) {
            if (global.Screen2Component && global.Screen2Component.destroy) {
                global.Screen2Component.destroy(target);
            }
            target.innerHTML = html;
            attachListeners(target, resolved);
        }).catch(function (err) {
            console.error('Renderer error:', err);
            target.innerHTML = '<section class="view view-notfound"><div class="view-content"><h1>Eroare la încărcare</h1><p><a href="#home">Înapoi</a></p></div></section>';
        });
    }

    function resolveAndRender(resolved) {
        if (resolved.type === 'notfound') return Promise.resolve(renderNotFound());
        switch (resolved.type) {
            case 'section':
                if (resolved.section === 'home') return renderHome(resolved.data);
                if (resolved.section === 'about') return renderAbout(resolved.data);
                if (resolved.section === 'sessions') return renderSessions(resolved.data);
                if (resolved.section === 'gallery') return renderGallery(resolved.data);
                if (resolved.section === 'contact') return renderContact(resolved.data);
                break;
            case 'about-gear':
                return renderAboutGear(resolved.data, resolved.parent);
            case 'lake':
                return renderLake(resolved.data, resolved.parent);
            case 'trip':
                return renderTrip(resolved.data, resolved.lake);
        }
        return Promise.resolve(renderNotFound());
    }

    function renderHome(data) {
        var Screen2 = global.Screen2Component;
        var links = (data.deepLinks || []).map(function (d) {
            return '<a href="#' + d.hash + '" class="deep-link-card">' +
                '<span class="deep-link-title">' + escapeHtml(d.label) + '</span>' +
                '<span class="deep-link-desc">' + escapeHtml(d.desc) + '</span></a>';
        }).join('');
        return loadText(data).then(function (text) {
            var tickerText = (text || data.description || '').trim();
            var screen2Html = Screen2 && Screen2.create ? Screen2.create({ tickerText: tickerText }) : '';
            return renderArticle({
                title: '',
                content: screen2Html +
                    '<div class="deep-links">' + links + '</div>',
                className: 'view-home'
            });
        });
    }

    function loadText(data) {
        var src = data && data.textSource;
        if (!src || !loadTextContent) return Promise.resolve('');
        return loadTextContent(src.section, src.category);
    }

    function renderAbout(data) {
        var gearLinks = data.subSections ? Object.keys(data.subSections).map(function (key) {
            var gear = data.subSections[key];
            return '<a href="#about/' + key + '" class="sub-link">' + escapeHtml(gear.title) + '</a>';
        }).join('') : '';
        return loadText(data).then(function (text) {
            var desc = text || data.description;
            return renderArticle({
                title: data.title,
                content: '<p>' + escapeHtml(desc) + '</p><nav class="sub-nav">' + gearLinks + '</nav>',
                className: 'view-about'
            });
        });
    }

    function renderAboutGear(data, parent) {
        var section = parent.sectionId || 'despre';
        var category = data.category || data.id;
        var heroPath = assetPath('hero', section, category);

        return loadText(data).then(function (text) {
            var desc = text || data.description;
            return '<section class="view view-about-gear">' +
                '<a href="#about" class="back-link">← Înapoi la ' + escapeHtml(parent.title) + '</a>' +
                renderArticle({
                    title: data.title,
                    content: '<p>' + escapeHtml(desc) + '</p>' +
                        (heroPath ? '<img src="' + escapeAttr(heroPath) + '" alt="' + escapeHtml(data.title) + '" class="gear-image">' : ''),
                    className: 'view-about-gear'
                }) + '</section>';
        });
    }

    function renderSessions(data) {
        var lakeLinks = data.lakes ? Object.keys(data.lakes).map(function (key) {
            var lake = data.lakes[key];
            return '<a href="#sessions/' + key + '" class="sub-link">' + escapeHtml(lake.title) + '</a>';
        }).join('') : '';
        return loadText(data).then(function (text) {
            var desc = text || data.description;
            return renderArticle({
                title: data.title,
                content: '<p>' + escapeHtml(desc) + '</p><nav class="sub-nav lakes">' + lakeLinks + '</nav>',
                className: 'view-sessions'
            });
        });
    }

    function renderLake(data, parent) {
        var tripLinks = data.trips && Object.keys(data.trips).length > 0
            ? Object.keys(data.trips).map(function (key) {
                var trip = data.trips[key];
                return '<a href="#sessions/' + data.id + '/' + key + '" class="sub-link">' + escapeHtml(trip.title) + '</a>';
            }).join('')
            : '<p>Nicio partidă înregistrată încă.</p>';
        return loadText(data).then(function (text) {
            var desc = text || data.description;
            return '<section class="view view-lake">' +
                '<a href="#sessions" class="back-link">← Înapoi la ' + escapeHtml(parent.title) + '</a>' +
                renderArticle({
                    title: data.title,
                    content: '<p>' + escapeHtml(desc) + '</p><nav class="sub-nav trips">' + tripLinks + '</nav>',
                    className: 'view-lake'
                }) + '</section>';
        });
    }

    function renderTrip(data, lake) {
        var section = 'partide';
        var category = data.category || (lake.id + '/' + data.id);
        var heroPath = assetPath('hero', section, category);

        var thumbnails = '';
        var count = data.imageCount || 0;
        if (count > 0) {
            for (var i = 0; i < count; i++) {
                var idx = 'p' + (i < 9 ? '0' + (i + 1) : (i + 1));
                var thumbPath = assetPath('thumb', section, category, idx);
                var fullPath = assetPath('full', section, category, idx);
                thumbnails += '<button type="button" class="gallery-thumb" data-index="' + i + '" data-full="' + escapeAttr(fullPath) + '">' +
                    '<img src="' + escapeAttr(thumbPath) + '" alt="Thumbnail ' + (i + 1) + '"></button>';
            }
        }

        var galleryHtml = thumbnails
            ? '<div class="trip-gallery"><div class="trip-hero"><img src="' + escapeAttr(heroPath) + '" alt="' + escapeHtml(data.title) + '" id="trip-full-image"></div>' +
            '<div class="trip-thumbs" role="tablist">' + thumbnails + '</div></div>'
            : '<div class="trip-hero"><img src="' + escapeAttr(heroPath) + '" alt="' + escapeHtml(data.title) + '"></div>';

        return loadText(data).then(function (text) {
            var desc = text || data.descriptionText;
            return '<section class="view view-trip">' +
                '<a href="#sessions/' + lake.id + '" class="back-link">← Înapoi la ' + escapeHtml(lake.title) + '</a>' +
                '<div class="view-content">' +
                '<h1>' + escapeHtml(data.title) + '</h1>' +
                '<p class="trip-date">' + escapeHtml(data.date) + '</p>' + galleryHtml +
                '<div class="trip-description"><p>' + escapeHtml(desc) + '</p></div></div></section>';
        });
    }

    function renderGallery(data) {
        var photos = '';
        var photosData = data.photos;
        if (photosData) {
            var section = 'gallery';
            var cat = photosData.category || 'photos';
            var count = photosData.count || 0;
            var captions = photosData.captions || [];
            for (var i = 0; i < count; i++) {
                var idx = 'p' + (i < 9 ? '0' + (i + 1) : (i + 1));
                var thumbP = assetPath('thumb', section, cat, idx);
                var fullP = assetPath('full', section, cat, idx);
                photos += '<div class="gallery-item"><img src="' + escapeAttr(thumbP) + '" alt="' + escapeHtml(captions[i] || '') + '" data-full="' + escapeAttr(fullP) + '"></div>';
            }
        }
        if (!photos) photos = '<p>Nicio fotografie încă.</p>';

        var videos = '';
        var videosData = data.videos;
        if (videosData && videosData.items && videosData.items.length > 0) {
            videos = videosData.items.map(function (v) {
                var thumbV = assetPath('thumb', 'gallery', videosData.category || 'videos', v.id);
                return '<div class="gallery-item video"><video src="' + escapeAttr(v.src || '') + '" poster="' + escapeAttr(thumbV) + '" controls></video><p>' + escapeHtml(v.caption || '') + '</p></div>';
            }).join('');
        }
        if (!videos) videos = '<p>Niciun video încă.</p>';

        return loadText(data).then(function (text) {
            var desc = text || data.description;
            return renderArticle({
                title: data.title,
                content: '<p>' + escapeHtml(desc) + '</p>' +
                    '<div class="gallery-tabs"><button type="button" class="gallery-tab active" data-tab="photos">Foto</button>' +
                    '<button type="button" class="gallery-tab" data-tab="videos">Video</button></div>' +
                    '<div class="gallery-panel active" id="gallery-photos">' + photos + '</div>' +
                    '<div class="gallery-panel" id="gallery-videos">' + videos + '</div>',
                className: 'view-gallery'
            });
        });
    }

    function renderContact(data) {
        var social = (data.socialLinks || []).map(function (s) {
            return '<a href="' + escapeAttr(s.url) + '" class="social-link" target="_blank" rel="noopener">' + escapeHtml(s.platform) + '</a>';
        }).join('');
        return loadText(data).then(function (text) {
            var desc = text || data.description;
            return renderArticle({
                title: data.title,
                content: '<p>' + escapeHtml(desc) + '</p>' +
                    '<form class="contact-form" id="contact-form">' +
                    '<input type="text" name="name" placeholder="Nume" required>' +
                    '<input type="email" name="email" placeholder="Email" required>' +
                    '<textarea name="message" placeholder="Mesaj" rows="4"></textarea>' +
                    '<button type="submit">Trimite</button></form>' +
                    '<div class="social-links">' + social + '</div>',
                className: 'view-contact'
            });
        });
    }

    function renderNotFound() {
        return '<section class="view view-notfound"><div class="view-content"><h1>Pagina nu a fost găsită</h1><p><a href="#home">Înapoi la prima pagină</a></p></div></section>';
    }

    function attachListeners(app, resolved) {
        if (resolved.section === 'home' && global.Screen2Component && global.Screen2Component.init) {
            global.Screen2Component.init(app);
        }
        app.querySelectorAll('.gallery-thumb').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var full = this.dataset.full;
                var img = app.querySelector('#trip-full-image');
                if (img && full) {
                    img.src = full;
                    app.querySelectorAll('.gallery-thumb').forEach(function (b) { b.classList.remove('active'); });
                    this.classList.add('active');
                }
            });
        });
        app.querySelectorAll('.gallery-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var tabName = this.dataset.tab;
                app.querySelectorAll('.gallery-tab').forEach(function (t) { t.classList.remove('active'); });
                app.querySelectorAll('.gallery-panel').forEach(function (p) { p.classList.remove('active'); });
                this.classList.add('active');
                var panel = app.querySelector('#gallery-' + tabName);
                if (panel) panel.classList.add('active');
            });
        });
        app.querySelectorAll('.gallery-item img[data-full]').forEach(function (img) {
            img.addEventListener('click', function () {
                var full = this.dataset.full;
                if (full) window.open(full, '_blank');
            });
        });
        var form = app.querySelector('#contact-form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                alert('Formularul a fost trimis! (demo)');
            });
        }
    }

    global.Renderer = {
        render: render,
        renderArticle: renderArticle,
        renderParallax: renderParallax,
        renderScrollSnap: renderScrollSnap,
        assetPath: assetPath
    };
})(typeof window !== 'undefined' ? window : this);
