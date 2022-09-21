const KCP = {
    compare: function (e1, e2) {
        if (e1 == e2) {
            return 0;
        }
        return (e1 > e2) ? 1 : -1;
    },
    filter: function (data, category, sortBy, search) {
        let filteredData = data;
        if (data === null) {
            return filteredData;
        }
        if (!!category && category !== 'All') {
            filteredData = filteredData.filter(item => item.category === category);
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
    getParams: function(category, sortBy, search, modal, typeModal) {
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
    getRoute: function(category, sortBy, search, modal, typeModal) {
        const strParams = m.buildQueryString(KCP.getParams(category, sortBy, search, modal, typeModal));
        return `/?${strParams}`;
    },
    refreshRoute: function() {
        const s = KCP.State;
        m.route.set('/', KCP.getParams(s.category, s.sortBy, s.search, s.modal, s.typeModal));
    },

    State: {
        data: null,
        dataSelected: null,
        category: 'All',
        sortBy: 'Popularity',
        search: '',
        modal: null,
        typeModal: null,
    },

    Component: {
        searchBar: {
            view: function(vnode) {
                const value = vnode.attrs.value;
                return m('.container', [
                    m('h2', [
                        m('a', {
                            style: 'color:#666666!important;'
                            href: 'https://github.com/KaOS-Community-Packages'
                        }, 'KCP'),
                        m('input#searchbox.srch.right', {
                            type: 'text',
                            placeholder: 'Search',
                            value: value,
                            oninput: ev => {
                                ev.preventDefault();
                                KCP.State.search = ev.target.value;
                                KCP.refreshRoute(),
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
                const s = KCP.State;
                let cls = vnode.state.categories[label];
                if (label === vnode.attrs.current) {
                    cls += '.active';
                }
                const route = KCP.getRoute(label, s.sortBy, s.search, s.modal, s.typeModal);
                return m(`li.${cls}`, m(m.route.Link, {
                    selector: 'a',
                    href: route,
                }, label));
            };
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
                const s = KCP.state;
                let selector = label === vnode.attrs.current ? 'li.active' : 'li';
                const route = KCP.getRoute(s.category, label, s.search, s.modal, s.typeModal);
                return m(selector, m(m.route.Link, {
                    selector: 'a',
                    href: route,
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
                return '';
            },
        },
        list: {
            view: function(vnode) {
                return '';
            },
        },
        modal: {
            view: function(vnode) {
                return '';
            },
        },
    },

    Route: {
        '/': {
            view: function(vnode) {
                return '';
            },
        },
        '/:404': {
            view: function() {
                return m('h3.404', 'Page not found');
            },
        },
    },
};

const searchBar = document.querySelector('header.Hero');
const root      = document.querySelector('.wrapper');

m.mount(searchBar, KCP.Component.searchBar);
m.route(root, '/', KCP.Route);
