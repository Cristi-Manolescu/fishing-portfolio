/**
 * content.data.js - Central content store
 * Uses strict asset directory structure with getAssetPath()
 * Text content loaded via fetch from assets/text/{section}/{category}.txt
 */
(function (global) {
    'use strict';

    var THEME = {
        'Acasa':       { hex: '#ff6701', barFilter: 'bar-shadow-acasa',   contactFilter: 'contact-shadow-acasa' },
        'Despre mine': { hex: '#367101', barFilter: 'bar-shadow-despre',  contactFilter: 'contact-shadow-despre' },
        'Partide':     { hex: '#efac45', barFilter: 'bar-shadow-partide', contactFilter: 'contact-shadow-partide' },
        'Galerie':     { hex: '#6b1c10', barFilter: 'bar-shadow-galerie', contactFilter: 'contact-shadow-galerie' },
        'Contact':     { hex: '#3891fb', barFilter: 'bar-shadow-contact', contactFilter: 'contact-shadow-contact' }
    };

    var SECTION_TO_THEME_KEY = {
        home: 'Acasa',
        about: 'Despre mine',
        sessions: 'Partide',
        gallery: 'Galerie',
        contact: 'Contact'
    };

    /** Section id -> bg filename mapping (Romanian asset names) */
    var BG_SECTION_MAP = {
        home: 'acasa',
        about: 'despre',
        despre: 'despre',
        sessions: 'partide',
        partide: 'partide',
        gallery: 'galerie',
        galerie: 'galerie',
        contact: 'contact'
    };

    /** Derive file base name: for lake/session use lake__session, else use category */
    function getFileBaseName(category) {
        var cat = String(category || '');
        if (cat.indexOf('/') !== -1) {
            return cat.replace(/\//g, '__');
        }
        return cat || '';
    }

    /**
     * Constructs asset URLs from the canonical directory structure.
     * Paths are relative to project root.
     *
     * @param {string} type - 'bg' | 'hero' | 'thumb' | 'full' | 'ui' | 'text'
     * @param {string} section - Section id (home, about, sessions, partide, gallery, contact)
     * @param {string} [category] - Sub-category (e.g. box, mv/s01, photos)
     * @param {string} [fileName] - File identifier (e.g. p01, p02 for thumbs/full)
     * @returns {string} Relative path to asset
     */
    function getAssetPath(type, section, category, fileName) {
        var isMobile = global.Device && global.Device.isMobile ? global.Device.isMobile() : (global.Device && global.Device.getLayoutWidth ? global.Device.getLayoutWidth() < (global.Device.BREAKPOINT || 768) : false);

        switch (type) {
            case 'bg': {
                var bgSection = BG_SECTION_MAP[section] || section;
                var bgDir = isMobile ? 'assets/bg-m/' : 'assets/bg/';
                return bgDir + bgSection + '.jpg';
            }
            case 'hero': {
                var cat = category || section;
                var baseName = getFileBaseName(cat);
                return 'assets/img/content/' + section + '/' + cat + '/hero/' + baseName + '__hero.avif';
            }
            case 'thumb': {
                var catT = category || section;
                var baseT = getFileBaseName(catT);
                var idx = fileName || 'p01';
                return 'assets/img/content/' + section + '/' + catT + '/thumbs/' + baseT + '__' + idx + '__thumb.avif';
            }
            case 'full': {
                var catF = category || section;
                var baseF = getFileBaseName(catF);
                var idxF = fileName || 'p01';
                return 'assets/img/content/' + section + '/' + catF + '/full/' + baseF + '__' + idxF + '__full.jpg';
            }
            case 'ui':
                return 'assets/img/ui/' + (fileName || '');
            case 'latest': {
                var latestDir = isMobile ? 'assets/img-m/ui/acasa/latest/' : 'assets/img/ui/acasa/latest/';
                var latestIdx = fileName || '01';
                return latestDir + 'latest-' + latestIdx + '__thumb.avif';
            }
            case 'text': {
                var textCat = (category || '').replace(/\//g, '_');
                if (!textCat || textCat === section) {
                    return 'assets/text/' + section + '.txt';
                }
                return 'assets/text/' + section + '/' + textCat + '.txt';
            }
            default:
                return '';
        }
    }

    /**
     * Load text content from assets/text/{section}/{category}.txt
     * @returns {Promise<string>}
     */
    function loadTextContent(section, category) {
        var path = getAssetPath('text', section, category || section);
        if (!path) return Promise.resolve('');

        return fetch(path)
            .then(function (res) { return res.ok ? res.text() : ''; })
            .catch(function () { return ''; });
    }

    var SITE_DATA = {
        home: {
            id: 'home',
            sectionId: 'home',
            title: 'Pescuit în Argeș',
            subtitle: 'Jurnalul meu de pescuit pe apele Argeșului',
            description: 'Bine ați venit! Explorează partidele mele de pescuit, echipamentul și galeria.',
            textSource: { section: 'acasa', category: 'acasa' },
            themeColor: '#1a3a4a',
            themeClass: 'theme-home',
            deepLinks: [
                { hash: 'about', label: 'Despre', desc: 'Bio și echipament' },
                { hash: 'sessions', label: 'Partide', desc: 'Lacuri și tripuri' },
                { hash: 'gallery', label: 'Galerie', desc: 'Foto și video' },
                { hash: 'contact', label: 'Contact', desc: 'Formular și social' }
            ]
        },

        about: {
            id: 'about',
            sectionId: 'despre',
            title: 'Despre mine',
            description: 'Pasiunea mea pentru pescuit și echipamentul pe care îl folosesc.',
            textSource: { section: 'despre', category: 'despre' },
            themeColor: '#2d4a2d',
            themeClass: 'theme-about',
            subSections: {
                box: { id: 'box', category: 'box', title: 'Box', description: '', textSource: { section: 'despre', category: 'despre_box' } },
                delfin: { id: 'delfin', category: 'delfin', title: 'Delfin', description: '', textSource: { section: 'despre', category: 'despre_delfin' } },
                delkim: { id: 'delkim', category: 'delkim', title: 'Delkim', description: '', textSource: { section: 'despre', category: 'despre_delkim' } },
                fma: { id: 'fma', category: 'fma', title: 'FMA', description: '', textSource: { section: 'despre', category: 'despre_fma' } },
                korda: { id: 'korda', category: 'korda', title: 'Korda', description: '', textSource: { section: 'despre', category: 'despre_korda' } },
                mblc: { id: 'mblc', category: 'mblc', title: 'MBLC', description: '', textSource: { section: 'despre', category: 'despre_mblc' } },
                mgs: { id: 'mgs', category: 'mgs', title: 'MGS', description: '', textSource: { section: 'despre', category: 'despre_mgs' } },
                venture: { id: 'venture', category: 'venture', title: 'Venture', description: '', textSource: { section: 'despre', category: 'despre_venture' } }
            }
        },

        sessions: {
            id: 'sessions',
            sectionId: 'partide',
            title: 'Partide de pescuit',
            description: 'Lacurile și partidele mele.',
            textSource: { section: 'partide', category: 'partide' },
            themeColor: '#3d3528',
            themeClass: 'theme-sessions',
            lakes: {
                mv: {
                    id: 'mv',
                    title: 'MV',
                    description: '',
                    textSource: { section: 'partide', category: 'mv' },
                    trips: {
                        s01: { id: 's01', lakeId: 'mv', category: 'mv/s01', title: 'Sesiune 01', date: '', descriptionText: '', textSource: { section: 'partide', category: 'mv_s01' }, imageCount: 4 }
                    }
                },
                ozone: {
                    id: 'ozone',
                    title: 'Ozone',
                    description: '',
                    textSource: { section: 'partide', category: 'ozone' },
                    trips: {
                        s01: { id: 's01', lakeId: 'ozone', category: 'ozone/s01', title: 'Sesiune 01', date: '', descriptionText: '', textSource: { section: 'partide', category: 'ozone_s01' }, imageCount: 5 }
                    }
                },
                teiu: {
                    id: 'teiu',
                    title: 'Teiu',
                    description: '',
                    textSource: { section: 'partide', category: 'teiu' },
                    trips: {
                        s01: { id: 's01', lakeId: 'teiu', category: 'teiu/s01', title: 'Sesiune 01', date: '', descriptionText: '', textSource: { section: 'partide', category: 'teiu_s01' }, imageCount: 3 }
                    }
                },
                varlaam: {
                    id: 'varlaam',
                    title: 'Varlaam',
                    description: '',
                    textSource: { section: 'partide', category: 'varlaam' },
                    trips: {
                        s01: { id: 's01', lakeId: 'varlaam', category: 'varlaam/s01', title: 'Sesiune 01', date: '', descriptionText: '', textSource: { section: 'partide', category: 'varlaam_s01' }, imageCount: 6 }
                    }
                }
            }
        },

        gallery: {
            id: 'gallery',
            sectionId: 'galerie',
            title: 'Galerie',
            description: 'Foto și video din partidele mele.',
            textSource: { section: 'galerie', category: 'galerie' },
            themeColor: '#4a3528',
            themeClass: 'theme-gallery',
            photos: { category: 'photos', count: 0, captions: [] },
            videos: { category: 'videos', items: [] }
        },

        contact: {
            id: 'contact',
            sectionId: 'contact',
            title: 'Contact',
            description: 'Trimite un mesaj sau găsește-mă pe rețelele sociale.',
            textSource: { section: 'contact', category: 'contact' },
            themeColor: '#2d3540',
            themeClass: 'theme-contact',
            socialLinks: [
                { platform: 'Instagram', url: '#', icon: 'ig' },
                { platform: 'Facebook', url: '#', icon: 'fb' }
            ]
        }
    };


    /**
     * Legacy compatibility: resolve dual asset (deprecated, use getAssetPath instead)
     */
    function getAsset(asset, isMobile) {
        if (asset === undefined || asset === null) return '';
        if (typeof asset === 'string') return asset;
        if (typeof asset === 'object') {
            var url = isMobile && asset['img-mobile'] ? asset['img-mobile'] : (asset.img || asset['img-mobile'] || '');
            return url || '';
        }
        return '';
    }

    global.SITE_DATA = SITE_DATA;
    global.THEME = THEME;
    global.SECTION_TO_THEME_KEY = SECTION_TO_THEME_KEY;
    global.getAssetPath = getAssetPath;
    global.loadTextContent = loadTextContent;
    global.getAsset = getAsset;
})(typeof window !== 'undefined' ? window : this);
