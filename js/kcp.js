const KCP = {
    fetch: function(url, result) {
        return m.request({
            url: url,
            method: 'GET',
        })
            .then(response => result.data = response)
            .catch(response => result.error = response)
        ;
    },
    loadData: async function() {
        let result = {};
        await KCP.fetch('helper/data.json', result);
        if (!result.error) {
            KCP.State.data = result.data;
            KCP.State.dataloaded = true;
        }
    },
    compare: function (e1, e2) {
        if (e1 == e2) {
            return 0;
        }
        return (e1 > e2) ? 1 : -1;
    },
    filter: function (data, category, sortBy, search) {
        let filteredData = [...data.packages];
        if (data === null) {
            return filteredData;
        }
        switch (category) {
            case '':
            case 'All':
                break;
            case 'Broken':
                filteredData = filteredData.filter(item => Array.isArray(item.broken) && item.broken_depends.length > 0);
                break;
            default:
                filteredData = filteredData.filter(item => item.category === category);
                break;
        }
        if (!!search) {
            search = search.toLowerCase();
            filteredData = filteredData.filter(item => item.name.toLowerCase().includes(search) || item.description.toLowerCase().includes(search));
        }
        switch (sortBy) {
            case '':
            case 'Popularity':
                filteredData.sort((it1, it2) => {
                    const p1 = it1.stargazers_count, p2 = it2.stargazers_count;
                    return KCP.compare(p1, p2) * -1;
                });
                break;
            case 'Updated':
                filteredData.sort((it1, it2) => {
                    const d1 = it1.pushed_at, d2 = it2.pushed_at;
                    return KCP.compare(d1, d2) * -1;
                });
                break;
            case 'Name':
                filteredData.sort((it1, it2) => {
                    const n1 = it1.name, n2 = it2.name;
                    return KCP.compare(n1, n2);
                });
                break;
        }
        return filteredData;
    },
    getParams: function(data) {
        const s = KCP.State;
        const category  = typeof data.category === 'undefined' ? s.category : data.category;
        const sortBy    = typeof data.sortBy === 'undefined' ? s.sortBy : data.sortBy;
        const search    = typeof data.search === 'undefined' ? s.search : data.search;
        const modal     = typeof data.modal === 'undefined' ? s.modal : data.modal;
        const typeModal = typeof data.typeModal === 'undefined' ? s.typeModal : data.typeModal;
        const params = {};
        if (!!category && category !== 'All') {
            params.category = category;
        }
        if (!!sortBy) {
            params.sort = sortBy;
        }
        if (!!search) {
            params.search = search;
        }
        if (!!modal) {
            params.modal = modal;
            if (!!typeModal && typeModal === 'screenshot') {
                params.type = typeModal;
            }
        }
        return params;
    },
    getRoute: function(data) {
        const strParams = m.buildQueryString(KCP.getParams(data));
        return `/?${strParams}`;
    },
    refreshRoute: function() {
        const s = KCP.State;
        m.route.set('/', KCP.getParams({}));
    },

    State: {
        data: null,
        dataloaded: false,
        dataSelected: null,
        dataIndex: null,
        category: 'All',
        sortBy: 'Popularity',
        search: '',
        modal: null,
        typeModal: null,
        noticeViewed: false,
    },

    Component: {
        searchBar: {
            view: function(vnode) {
                const value = vnode.attrs.value;
                return m('.container', [
                    m('h2', [
                        m('a', {
                            style: 'color:#666666!important;',
                            href: 'https://github.com/KaOS-Community-Packages'
                        }, 'KCP'),
                        m('input#searchbox.srch.right', {
                            type: 'text',
                            placeholder: 'Search',
                            value: value,
                            oninput: ev => {
                                ev.preventDefault();
                                KCP.State.search = ev.target.value;
                                KCP.refreshRoute();
                            },
                        }),
                    ]),
                    m('h3', 'KaOS users maintained set of files to easily build extra packages.'),
                ]);
            },
        },
        categoryBar: {
            categories: {
                All: 'all',
                AudioVideo: 'AudioVideo',
                Development: 'Development',
                Education: 'Education',
                Game: 'Game',
                Graphics: 'Graphics',
                Library: 'Library',
                Network: 'Network',
                Office: 'Office',
                Science: 'Science',
                Settings: 'Settings',
                System: 'System',
                Utility: 'Utility',
                Others: 'Others',
                Broken: 'Broken',
            },
            viewItem: function(vnode, label) {
                let cls = vnode.state.categories[label];
                if (label === vnode.attrs.current) {
                    cls += '.active';
                }
                return m(`li.${cls}`, m(m.route.Link, {
                    selector: 'a',
                    href: '/',
                    params: KCP.getParams({category: label}),
                }, label));
            },
            view: function(vnode) {
                return m('ul.portfolio-categ.filter', [
                    m('li', 'Categories'),
                    Object.keys(vnode.state.categories).map(label => vnode.state.viewItem(vnode, label)),
                ]);
            },
        },
        sortBar: {
            sorts: [
                'Popularity',
                'Updated',
                'Name',
            ],
            viewItem: function(vnode, label) {
                let selector = label === vnode.attrs.current ? 'li.active' : 'li';
                return m(selector, m(m.route.Link, {
                    selector: 'a',
                    href: '/',
                    params: KCP.getParams({sortBy: label}),
                }, label));
            },
            view: function(vnode) {
                return m('ul.portfolio-sort.filter', [
                    m('li', 'Sort by:'),
                    vnode.state.sorts.map(label => vnode.state.viewItem(vnode, label)),
                ]);
            },
        },
        item: {
            view: function(vnode) {
                const item        = vnode.attrs.data;
                const paramImg    = KCP.getParams({modal: item.name, typeModal: 'screenshot'});
                const paramDetail = KCP.getParams({modal: item.name});
                return m('li.portfolie-item2', m('div', [
                    m('span.image-block', m(m.route.Link, {
                        selector: 'a.image-zoom',
                        href: '/',
                        params: paramImg,
                        title: item.description,
                    }, [
                        m('img', {
                            width: 170,
                            height: 130,
                            alt: item.name,
                            title: item.name,
                            src: item.screenshot,
                            loading: 'lazy',
                        }),
                        m('.home-portfolio.text', [
                            m('h2.post-title-portfolio', m(m.route.Link, {
                                selector: 'a',
                                href: '/',
                                params: paramDetail,
                                title: item.description,
                            }, item.name)),
                            m('p.post-subtitle-portfolio', item.description),
                        ]),
                    ])),
                ]));
            },
        },
        list: {
            view: function(vnode) {
                return m('ul.portfolio-area', vnode.attrs.data.map(item => m(KCP.Component.item, {
                    data: item,
                })));
            },
        },
        modal: {
            viewImg: function(item) {
                return m('.modal-body', [
                    m('.modal-img', [
                        m('a', {
                            href: item.screenshot,
                            target: '_blank',
                            title: 'Expand the image',
                        }, 'Expand'),
                        m('img', {
                            src: item.screenshot,
                            loading: 'lazy',
                        }),
                    ]),
                    m('.modal-txt', m('p', `${item.name}: ${item.description}`)),
                ]);
            },
            viewDetail: function(item) {
                const branch = item.pkgbuild_url.match(/.*\/(.*)\/PKGBUILD$/)[1];
                const zipUrl = `${item.upstrean_url}/archive/${branch}.zip`;
                let body     = [
                    m('li', [m('strong', 'description:'), ' ', item.pkgdesc]),
                    m('li', [m('strong', 'url:'), ' ', item.upstrean_url]),
                    m('li' [m('strong', 'license:'), ' ', item.licenses.map(l => `'${l}'`).join(', ')]),
                ];
                if (Array.isArray(item.depends) && item.depends.length > 0) {
                    body.push(m('li', [m('strong', 'depends:'), ' ', item.depends.join(', ')]));
                }
                if (Array.isArray(item.make_depends) && item.make_depends.length > 0) {
                    body.push(m('li', [m('strong', 'make depends:'), ' ', item.make_depends.join(', '), m('br')]));
                }
                if (Array.isArray(item.make_depends) && item.make_depends.length > 0) {
                    body.push(m('li', [m('strong', 'make_depends:'), ' ', item.make_depends.join(', '), m('br')]));
                }
                body.push(
                    m('li', [m('strong', 'created at:'), ' ', new Date(item.created_at)]),
                    m('li', [m('strong', 'updated at:'), ' ', new Date(item.updated_at)]),
                );
                return [
                    m('.modal-header', [
                        m('h2', [
                            m('strong', item.name),
                            ' ',
                            item.remote_version,
                        ]),
                        m('h4.github-link', m('a', {
                            href: item.html_url,
                            target: '_blank',
                        }, [
                            'view on github ',
                            m('img', {
                                src: 'images/github.png',
                                width: 22,
                                height: 22,
                            }),
                        ])),
                    ]),
                    m('.modal-body', [
                        m('ul', body),
                        m('p'),
                        m('h3', 'How to install?'),
                        m('hr'),
                        m('ul', [
                            m('strong', 'KCP helper'),
                            m('li.ui-state-default', m('table', m('tbody', m('tr', [
                                m('td[width="75%"]', `Searching or getting the needed files from KaOS Community Packages has been simplified with the addition of the package “kcp”. You can click the button to copy the required command kcp and paste it into your console. (kcp -i ${item.name})`),
                                m('td[width="5%"]'),
                                m('td[width="20%"]', {
                                    style: 'vertical-align:mid;',
                                }, m('button.btn.button.big', {
                                    onclick: () => navigator.clipboard.writeText(`kcp -i ${item.name}`),
                                }, 'Copy command')),
                            ])))),
                            m('strong', 'ZIP file'),
                            m('li.ui-state-default', m('table', m('tbody', m('tr', [
                                m('td[width="75%"]', [
                                    'Click the just downloaded package zip and extract file to your build folder. The call to start to build and install the needed dependencies is ',
                                    m('strong', 'makepkg -si'),
                                    '.'
                                ]),
                                m('td[width="5%"]'),
                                m('td[width="20%"]', {
                                    style: 'vertical-align:mid;',
                                }, m('a.button.big', {
                                    href: zipUrl,
                                    target: '_blank',
                                }, 'Download ZIP')),
                            ])))),
                        ]),
                    ]),
                ];
            },
            viewPagination: function (vnode) {
                const attrs = vnode.attrs;
                const index = attrs.index;
                if (!index || index <= 0) {
                    return '';
                }
                const prev  = attrs.prev;
                const next  = attrs.next;
                const total = attrs.total;
                const type  = attrs.type;
                return m('.pagination', [
                    !!prev ? m(m.route.Link, {
                        selector: 'a.arrow.left',
                        route: '/',
                        params: KCP.getParams({modal: prev, typeModal: type}),
                    }) : m('a.arrow.left.disabled'),
                    m('p.text', [index, '/', total]),
                    !!next ? m(m.route.Link, {
                        selector: 'a.arrow.right',
                        route: '/',
                        params: KCP.getParams({modal: next, typeModal: type}),
                    }) : m('a.arrow.right.disabled'),
                ]);
            },
            view: function(vnode) {
                return m('.modal-overlay', m('.modal-content', [
                    vnode.attrs.type === 'screenshot' ? vnode.state.viewImg(vnode.attrs.data) : vnode.state.viewDetail(vnode.attrs.data),
                    m('.modal-footer', [
                        vnode.state.viewPagination(vnode),
                        m(m.route.Link, {
                            selector: 'button.button_close',
                            href: '/',
                            params: KCP.getParams({modal: '', typeModal: ''}),
                        }, 'Close')
                    ]),
                ]));
            },
        },
        noticeBar: {
            view: function(vnode) {
                return m(KCP.State.noticeViewed ? '.notice.hidden' : '.notice', m('p', [
                    'KaOS users maintained set of files to easily build extra packages. ',
                    m('b', 'Use any of these files at your own risk'),
                    m('br'),
                    'Make sure to check the correctness of any package, check for updates, and rebuild when changes in the KaOS repositories demands a rebuild of your package(s).',
                    m('br'),
                    m('a', {
                        href: '',
                        onclick: (ev) => {
                            ev.preventDefault();
                            KCP.State.noticeViewed = true;
                            //document.getElementById('notice').classList.add('hidden');
                        },
                    }, 'I Understand'),
                ]));
            },
        },
    },

    Route: {
        '/': {
            filter: function(vnode) {
                const s = KCP.State;
                const a = vnode.attrs;
                if (!s.dataloaded) {
                    return;
                }
                s.dataFiltered = KCP.filter(s.data, s.category, s.sortBy, s.search);
                s.category     = a.category;
                s.sortBy       = a.sortBy;
                s.search       = a.search;
                s.modal        = a.modal;
                s.typeModal    = a.type;
                if (!!s.modal) {
                    s.dataSelected = s.data.packages.find(p => p.name === s.modal);
                    s.dataIndex    = s.dataFiltered.findIndex(p => p.name === s.modal);
                    if (s.dataIndex < 0) {
                        s.dataIndex = null;
                    }
                } else {
                    s.dataIndex    = null;
                    s.dataSelected = null;
                }
            },
            oninit: function (vnode) {
                console.log(vnode.attrs);
                const s = KCP.State;
                if (!s.dataloaded) {
                    KCP.loadData().then(() => vnode.state.filter(vnode));
                }
            },
            view: function(vnode) {
                const s = KCP.State
                const c = KCP.Component;
                if (!s.dataloaded) {
                    return '';
                }
                let modal = '';
                if (!!s.modal) {
                    const params = {
                        type: s.typeModal,
                        data: s.dataSelected,
                        total: s.filteredData.length,
                    };
                    if (!isNaN(s.dataIndex) && s.dataIndex >= 0) {
                        params.index = s.dataIndex;
                        if (s.dataIndex > 0) {
                            params.prev = s.filteredData[s.dataIndex - 1].name;
                        }
                        if (s.dataIndex < s.filteredData.length - 1) {
                            params.next = s.filteredData[s.dataIndex + 1].name;
                        }
                    }
                    modal = m(c.modal, params);
                }
                return [
                    m(c.searchBar, {value: s.search}),
                    m(c.categoryBar, {current: s.category}),
                    m(c.sortBar, {current: s.sortBy}),
                    m(c.list, {data: s.dataFiltered}),
                    modal,
                    m(c.noticeBar),
                ];
            },
        },
        '/:404': {
            view: function() {
                return m('h3.404', 'Page not found');
            },
        },
    },
};

//const searchBar = document.querySelector('header.Hero');
//const noticeBar = document.getElementById('#notice');
const root = document.querySelector('main');

//m.mount(searchBar, KCP.Component.searchBar);
//m.mount(noticeBar, KCP.Component.noticeBar);
m.route(root, '/', KCP.Route);
