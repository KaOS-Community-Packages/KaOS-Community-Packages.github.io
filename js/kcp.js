const KCP = {
    dataurl: 'helper/data.json',
    fetch: function (url, result) {
        return m.request({
            url: url,
            method: 'GET',
        })
            .then(response => result.data = response)
            .catch(response => result.error = response)
        ;
    },
    dataloaded: function (load) {
        return typeof load.data === 'object' && Array.isArray(load.data.packages);
    },
    dataFailed: function (load) {
        return typeof load.error === 'string';
    },
    refresh: async function (force) {
        const current = KCP.State.data;
        if (force || !KCP.dataloaded(current)  || KCP.dataFailed(current)) {
            current.data = undefined, current.error = undefined;
            await KCP.fetch(KCP.dataurl, current);
            if (!KCP.dataloaded(current) && !KCP.dataFailed(current)) {
                current.data = undefined, current.error = 'Failed to parse data';
            }
        }
        if (KCP.dataloaded(current)) {
            const broken = Array.isArray(current.data.broken_depends) ? current.data.broken_depends : [];
            current.data.packages.forEach( item => {
                for (const k of ['depends', 'make_depends', 'opt_depends']) {
                    if (Array.isArray(item[k])) {
                        for (const d of item[k]) {
                            if (broken.includes(d)) {
                                item.broken = true;
                                return;
                            }
                        }
                    }
                }
                item.broken = false;
            });
        }
        return current;
    },
    compare: function (e1, e2) {
        if (e1 == e2) {
            return 0;
        }
        return (e1 > e2) ? 1 : -1;
    },
    filter: function (category, sortBy, search) {
        const st = KCP.State;
        if (!KCP.dataloaded(st.data)) {
            return null;
        }
        let filteredData = [...st.data.data.packages];
        switch (category) {
            case '':
            case 'All':
                break;
            case 'Broken':
                filteredData = filteredData.filter(item => item.broken);
                break;
            default:
                filteredData = filteredData.filter(item => item.category === category);
        }
        if (!!search) {
            search = st.search.toLowerCase();
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
    item: function (name) {
        const data = KCP.State.data;
        if (!KCP.dataloaded(data)) {
            return null;
        }
        return data.data.packages.find(it => it.name === name);
    },
    dependType: function (name) {
        const data = KCP.State.data.data;
        if (data.broken_depends.includes(name)) {
            return 'broken';
        }
        return data.packages.map(it => it.name).includes(name) ? 'kcp' : 'kaos';
    },
    pagination: function(data, name) {
        if (!Array.isArray(data)) {
            return null;
        }
        const idx = data.findIndex(item => item.name === name);
        if (idx < 0) {
            return null;
        }
        return {
            index: idx + 1,
            total: data.length,
            prev: idx > 0 ? data[idx - 1].name : null,
            next: idx + 1 < data.length ? data[idx + 1].name : null,
        };
    },
    routeParams: function (params) {
        for (const k of ['category', 'sortBy', 'search', 'modal', 'typeModal']) {
            if (typeof params[k] === 'undefined') {
                params[k] = KCP.State[k];
            }
        }
        const out = {};
        if (!(['', 'All'].includes(params.category))) {
            out.category = params.category;
        }
        if (!(['', 'Popularity'].includes(params.sortBy))) {
            out.sort = params.sortBy;
        }
        if (!!params.search) {
            out.search = params.search;
        }
        if (!!params.modal) {
            out.modal = params.modal;
            if (params.typeModal === 'screenshot') {
                out.type = params.typeModal;
            }
        }
        return out;
    },
    refreshState: function (params) {
        const st = KCP.State;
        st.category  = params.category ? params.category : 'All';
        st.sortBy    = params.sort ? params.sort : 'Popularity';
        st.search    = params.search ? params.search : '';
        st.modal     = params.modal ? params.modal : '';
        st.typeModal = params.type ? params.type : '';
    },
    redirect: function (params) {
        m.route.set('/', KCP.routeParams(params));
    },

    State: {
        data: {},
        category: 'All',
        sortBy: 'Popularity',
        search: '',
        modal: '',
        typeModal: '',
        noticeViewed: false,
    },

    Component: {
        searchBar: {
            view: function(vnode) {
                const value = vnode.attrs.search;
                return m('#searchbar.Hero', m('.container', [
                    m('h2', [
                        m('a.searchbar', {
                            href: 'https://github.com/KaOS-Community-Packages'
                        }, 'KCP'),
                        m('input#searchbox', {
                            type: 'text',
                            placeholder: 'Search',
                            value: value,
                            onkeyup: ev => {
                                ev.preventDefault();
                                KCP.redirect({search: ev.target.value});
                            },
                        }),
                    ]),
                    m('h3', 'KaOS users maintained set of files to easily build extra packages.'),
                ]));
            },
        },
        filterItem: {
            view : function (vnode) {
                const attrs = vnode.attrs;
                if (attrs.current === attrs.item) {
                    return m('li.active', m('strong', attrs.item));
                }
                const params = {};
                params[attrs.type] = attrs.item;
                return m('li', m(m.route.Link, {
                    selector: 'a',
                    href: '/',
                    params: KCP.routeParams(params),
                }, attrs.item));
            },
        },
        categoryBar: {
            categories: [
                'All',
                'AudioVideo',
                'Development',
                'Education',
                'Game',
                'Graphics',
                'Library',
                'Network',
                'Office',
                'Science',
                'Settings',
                'System',
                'Utility',
                'Others',
                'Broken',
            ],
            view: function(vnode) {
                return m('ul#categorybar.filter', [
                    m('li', 'Categories:'),
                    vnode.state.categories.map(item => m(KCP.Component.filterItem, {
                        current: vnode.attrs.category,
                        item: item,
                        type: 'category'
                    })),
                ]);
            },
        },
        sortBar: {
            sorts: [
                'Popularity',
                'Updated',
                'Name',
            ],
            view: function(vnode) {
                return m('ul#sortbar.filter', [
                    m('li', 'Sort by:'),
                    vnode.state.sorts.map(item => m(KCP.Component.filterItem, {
                        current: vnode.attrs.sortBy,
                        item: item,
                        type: 'sortBy',
                    })),
                ]);
            },
        },
        listItem: {
            view: function(vnode) {
                const item = vnode.attrs.data;
                return m('li.item', m('div', [
                    m('span.item-image', m(m.route.Link, {
                        selector: 'a.image-zoom',
                        href: '/',
                        title: item.description,
                        params: KCP.routeParams({modal: item.name, typeModal: 'screenshot'}),
                    }, m('img', {
                        src: item.screenshot,
                        alt: item.name,
                        title: item.name,
                        loading: 'lazy',
                    }))),
                    m('.item-text', [
                        m('h2.item-title', m(m.route.Link, {
                            selector: 'a',
                            href: '/',
                            params: KCP.routeParams({modal: item.name, typeModal: 'detail'}),
                        }, item.name)),
                        m('p.item-description', item.description),
                    ]),
                ]));
            },
        },
        list: {
            view: function(vnode) {
                return m('ul.list', vnode.attrs.data.map(item => m(KCP.Component.listItem, {
                    data: item,
                })));
            },
        },
        modalImage: {
            view: function (vnode) {
                const item = vnode.attrs.data;
                return m('.modal-body', [
                    m('.modal-image', [
                        m('a.modal-expand', {
                            href: item.screenshot,
                            target: '_blank',
                            title: 'Expand the image',
                        }, 'Expand'),
                        m('img', {
                            src: item.screenshot,
                            loading: 'lazy',
                            alt: item.name,
                            title: item.name,
                        }),
                    ]),
                    m('.modal-text', `${item.name}: ${item.description}`),
                ]);
            },
        },
        depend: {
            view: function (vnode) {
                const name = vnode.attrs.name;
                const type = KCP.dependType(name);
                if (type === 'kcp') {
                    return m(m.route.Link, {
                        selector: 'a.depend-kcp',
                        title: name,
                        href: '/',
                        params: KCP.routeParams({modal: name, typeModal: ''}),
                    }, [
                        name,
                        ' ',
                    ]);
                }
                return type === 'broken' ? m('i.depend-broken', [
                    m('s', name),
                    ' ',
                ]) : m('b.depend-kaos', [
                    name,
                    ' ',
                ]);
            },
        },
        modalDetail: {
            view: function (vnode) {
                const item         = vnode.attrs.data;
                const branch       = item.pkgbuild_url.match(/.*\/(.*)\/PKGBUILD/)[1];
                const zipUrl       = `${item.upstrean_url}/archive/${branch}.zip`;
                const dep          = KCP.Component.depend;
                const description  = [
                    m('li', [m('strong', 'description:'), ' ', item.pkgdesc]),
                    m('li', [m('strong', 'url:'), ' ', m('a', {
                        target: '_blank',
                        href: item.upstream_url,
                    },item.upstream_url)]),
                    m('li', [m('strong', 'license:'), ' ', item.licenses.map(l => `'${l}'`).join(', ')]),
                ];
                if (Array.isArray(item.depends) && item.depends.length > 0) {
                    description.push(m('li', [m('strong', 'depends:'), ' ', item.depends.map(d => m(dep, {name: d}))]));
                }
                if (Array.isArray(item.make_depends) && item.make_depends.length > 0) {
                    description.push(m('li', [m('strong', 'make depends:'), ' ', item.make_depends.map(d => m(dep, {name: d}))]));
                }
                if (Array.isArray(item.opt_depends) && item.opt_depends.length > 0) {
                    description.push(m('li', [m('strong', 'opt depends:'), ' ', item.opt_depends.map(d => m(dep, {name: d}))]));
                }
                description.push(
                    m('li', [m('strong', 'created at:'), ' ', (new Date(item.created_at).toString())]),
                    m('li', [m('strong', 'updated at:'), ' ', (new Date(item.pushed_at).toString())])
                );
                return [
                    m('.modal-header', [
                        m('h2', [m('strong', item.name), ' ', item.remote_version]),
                        m('h4.github-link', m('a', {
                            href: item.html_url,
                            target: '_blank',
                        }, [
                            'View on github ',
                            m('img', {
                                src: 'images/github.png',
                                width: '14px',
                                height: '14px',
                            }),
                        ])),
                        m('hr'),
                    ]),
                    m('.modal-body', [
                        m('ul.package-description', description),
                        m('p'),
                        m('.how-to', [
                            m('h3', 'How to install?'),
                            m('hr'),
                        ]),
                        m('p', m('strong', 'KCP helper')),
                        m('.package-install', [
                            m('.package-instruction', m('p', [
                                'Searching or getting the needed files from KaOS Community Packages has been simplified with the addition of the package “kcp”.',
                                ' ',
                                'You can click the button to copy the required command kcp and paste it into your console.',
                                ' ',
                                m('strong', `kcp -i ${item.name}`),
                                '.',
                            ])),
                            m('.package-get', m('div', m('button.package-button', {
                                onclick: ev => navigator.clipboard.writeText(`kcp -i ${item.name}`),
                            }, 'Copy command'))),
                        ]),
                        m('p', m('strong', 'ZIP file')),
                        m('.package-install', [
                            m('.package-instruction', m('p', [
                                'Click the just downloaded package zip and extract file to your build folder.',
                                ' ',
                                'The call to start to build and install the needed dependencies is:',
                                ' ',
                                m('strong', 'makepkg -si'),
                                '.',
                            ])),
                            m('.package-get', m('a.package-button', {
                                href: zipUrl,
                                target: '_blank',
                            }, 'Download ZIP')),
                        ]),
                    ]),
                ];
            },
        },
        pagination: {
            view: function (vnode) {
                const pagination = vnode.attrs.pagination;
                return m('.pagination', [
                    !!pagination.prev ? m(m.route.Link, {
                        selector: 'a.arrow.left',
                        href: '/',
                        params: KCP.routeParams({modal: pagination.prev}),
                    }, '') : m('a.arrow.left.disabled', ''),
                    m('p.pagination-text', [pagination.index, '/', pagination.total]),
                    !!pagination.next ? m(m.route.Link, {
                        selector: 'a.arrow.right',
                        href: '/',
                        params: KCP.routeParams({modal: pagination.next}),
                    }, '') : m('a.arrow.right.disabled', ''),
                ]);
            },
        },
        modal: {
            view: function(vnode) {
                const attrs = vnode.attrs;
                const comp  = KCP.Component;
                return m('.modal-overlay', m('.modal-content', [
                    attrs.typeModal === 'screenshot' ? m(comp.modalImage, {data: attrs.data}) : m(comp.modalDetail, {data: attrs.data}),
                    m('.modal-footer', [
                        m('hr'),
                        attrs.pagination ? m(comp.pagination, {pagination: attrs.pagination}) : '',
                        m(m.route.Link, {
                            selector: 'span.modal-close',
                            href: '/',
                            params: KCP.routeParams({modal: '', typeModal: ''}),
                        }, '')
                    ]),
                ]));
            },
        },
        noticeBar: {
            view: function(vnode) {
                return m('#noticebar', m('p', [
                    'KaOS users maintained set of files to easily build extra packages. ',
                    m('strong', 'Use any of these files at your own risk.'),
                    m('br'),
                    'Make sure to check the correctness of any package, check for updates, and rebuild when changes in the KaOS repositories demands a rebuild of your package(s).',
                    m('br'),
                    m('button.ok', {
                        onclick: ev => KCP.State.noticeViewed = true,
                    }, 'I Understand'),
                ]));
            },
        },
    },

    Layout: {
        message: {
            view: function (vnode) {
                const attrs = vnode.attrs;
                const comp  = KCP.Component;
                return [
                    m(comp.searchBar, {search: attrs.search}),
                    m('.wrapper', [
                        m(comp.categoryBar, {category: attrs.category}),
                        m(comp.sortBar, {sortBy: attrs.sortBy}),
                        m('h3.message', attrs.isError ? m('span.error', attrs.message) : attrs.message),
                    ]),
                    m('.column-clear'),
                    attrs.noticeViewed ? '' : m(comp.noticeBar),
                ];
            },
        },
        list: {
            view: function (vnode) {
                const attrs = vnode.attrs;
                const comp  = KCP.Component;
                return [
                    m(comp.searchBar, {search: attrs.search}),
                    m('.wrapper', [
                        m(comp.categoryBar, {category: attrs.category}),
                        m(comp.sortBar, {sortBy: attrs.sortBy}),
                        m(comp.list, {data: attrs.data}),
                        m('.column-clear'),
                    ]),
                    attrs.modal ? m(comp.modal, attrs.modal) : '',
                    attrs.noticeViewed ? '' : m(comp.noticeBar),
                ];
            },
        },
    },

    Route: {
        '/': {
            view: function(vnode) {
                const st     = KCP.State
                const layout = KCP.Layout;
                const attrs  = vnode.attrs;

                KCP.refresh(attrs.force);
                KCP.refreshState(attrs);
                const params = {
                    search: st.search,
                    category: st.category,
                    sortBy: st.sortBy,
                    noticeViewed: st.noticeViewed,
                };
                if (!KCP.dataloaded(st.data)) {
                    const isError = KCP.dataFailed(st.data);
                    params.message = isError ? st.data.error : 'Loading...';
                    params.isError = isError;
                    return m(layout.message, params);
                }

                params.data = KCP.filter(st.category, st.sortBy, st.search);
                if (!!st.modal) {
                    const item       = KCP.item(st.modal);
                    const pagination = KCP.pagination(params.data, st.modal);
                    if (!!item) {
                        params.modal = {
                            data: item,
                            typeModal: st.typeModal,
                            pagination: pagination,
                        };
                    }
                }
                return m(layout.list, params);
            },
        },
        '/:404': {
            view: function(vnode) {
                const st = KCP.State;
                KCP.refreshState(vnode.attrs);
                return m(KCP.Layout.message, {
                    search: st.search,
                    category: st.category,
                    sortBy: st.sortBy,
                    noticeViewed: st.noticeViewed,
                    message: 'Page not found!',
                    isError: true,
                });
            },
        },
    },
};

const root = document.querySelector('main');

m.route(root, '/', KCP.Route);
