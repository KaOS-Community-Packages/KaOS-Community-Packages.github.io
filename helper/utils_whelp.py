#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from subprocess import Popen, PIPE
import re
import json
import os
import sys
import ast
import datetime

def read_json(filepath):
    data = []
    with open(filepath) as data_file:
        data = json.load(data_file)
    return data

def write_json(data, filepath):
    with open(filepath, 'w') as data_file:
        json.dump(data, data_file)

def index_list_by_name(data):
    index = {}
    for item in data:
        index[item['name']] = item
    return index

def get_item(data, nama):
    return list(item for item in data if item['name'] == name)


def update_remote_repo():
    os.system('kcp -u')

def get_kcp_path():
    return os.path.join(os.environ.get('HOME'), '.config', 'kcp', 'kcp.json')

def print_title(*argv):
    print("==================================")
    for message in argv:
        print(message)
    print("==================================")

local_file = 'data.json'
kcp_file   = get_kcp_path()

def synchronize():
    print_title('Refresh KCP database…')
    update_remote_repo()

    data_local   = read_json(local_file)
    data_remote  = read_json(kcp_file)['packages']
    index_local  = index_list_by_name(data_local)
    index_remote = index_list_by_name(data_remote)

    print_title('Update local database…')
    created = 0
    updated = 0
    deleted = 0
    new_data = []
    for item in data_local:
        if item['name'] in data_remote:
            updated += 1
            print('Update: %s' % item['name'])
            new_item                = data_remote[item[name]].copy()
            new_item['category']    = item['category']
            new_item['pkgdesc']     = new_item['description']
            new_item['description'] = item['description']
            new_item['screenshot']  = item['screenshot']
            new_item.pop('local_version', None)
            new_data.append(new_item)
        else:
            deleted += 1
            print('Del: %s' % item['name'])
    for item in data_remote:
        created += 1
        print('Add: %s' % item['name'])
        new_item               = item.copy()
        new_item['category']   = 'others'
        new_item['pkgdesc']    = item['description']
        new_item['screenshot'] = 'images/big.png'
        new_data.append(new_item)

    print_title('Save local database…')
    write_json(data, local_file)

def set_value(name, var, value):
    data_local = read_json(kcp_file)

    try:
        list_item = get_item(data_local, name)
        if not list_item:
            print('error: the package [%s] doesn’t exist' % name)
            sys.exit()
        for item in list_item:
            item[var] = value
        write_json(data_local, local_file)
    except:
        print('Error in setting new %s' % var)

def print_item(name):
    data_local = read_json(local_file)

    try:
        list_item = get_item(data_local, name)
        if not list_item:
            print('error: the package [%s] doesn’t exist' % name)
            sys.exit()
        for item in list_item:
            name        = 'name       : %s' % item['name']
            description = 'description: %s' % item['description']
            category    = 'category   : %s' % item['category']
            screenshot  = 'screenshot : %s' % item['screenshot']
            print_title(name, description, category, screenshot)
    except:
        print('Error in printing data of %' % name)


data_local = read_json('data.json')

def build_item_template(data_local, item, var, html, broken):


    if var == 'url':
        while "$" in item[var]:
            for key in item:
                item[var] = item[var].replace(u"${pkgname%-git}", str(item["pkgname"][0:-4]))
                item[var] = item[var].replace(u"${" + key+u"}", str(item[key])).replace(u"$" + key + "", str(item[key]))

        html += '<strong>%s:</strong> <a  target="_blank" href=%s>%s</a><br>' \
                % (var, item[var], item[var].replace("'", "").replace('"', ''))

    elif var in ('created_at', 'pushed_at'):
        datef = datetime.datetime.strptime(item[var], "%Y-%m-%dT%H:%M:%SZ")
        html += '<strong>%s:</strong> %s <br>' % (var, datef.strftime("%A %b %d, %Y at %H:%M"))

    elif var in ('depends', 'makedepends'):
        html += '<strong>%s: </strong>' % var
        str_partial = re.sub(r'\n', '', item[var])
        str_partial = re.sub(r"' *'", "','", str_partial)
        str_partial = re.sub(r'" *"', '","', str_partial)

        try:
            deps = ast.literal_eval(str_partial)
        except:
            deps = ()
        if type(deps) is not tuple:
            deps = (deps,)
        for dep in deps:
            dep = re.split(r"[<|>|=|:]", dep)
            dep = dep[0]
            p = Popen(["pacman", "-Sp", dep], stdout=PIPE, stderr=PIPE)
            out, err = p.communicate()
            if not err:
                html += '<b class="dependency-k">%s </b>&nbsp; ' % dep
            elif [item_local for item_local in data_local if item_local["name"] == dep]:
                html += '<a class="dependency" title="Dependence in KCP"  href="%s.html"> ' \
                        '%s </a>&nbsp; &nbsp;' % (dep, dep)
            else:
                if len(dep) > 0 and var == "depends":
                    html += '<i class="dependency-null" > %s</i>&nbsp;' % dep
                    broken = True
        html += "<br>"

    elif var == 'required_by':
        req = False
        html_prov = '<strong>required by: </strong>'
        for item_local in data_local:
            if 'depends' in item_local:
                for dep in item_local['depends'].split():
                    dep = dep.replace("'", "").replace('"', '').replace('(', '').replace(')', '')
                    if dep == item['name']:
                        html_prov += '<a class="dependency" title="Package in KCP"  ' \
                                     'href="%s.html"> %s </a>&nbsp;&nbsp;' % (
                                         item_local['name'], item_local['name'])
                        req = True
        html_prov += "<br>"
        if req:
            html += html_prov

    elif var == 'stargazers_count':
        html += '<strong>%s:</strong> %s stars<br>' % ('popularity', unicode(item[var]))

    else:
        html += '<strong>%s:</strong> %s<br>' % (
            var, item[var].replace('(', '').replace(')', ''))


    return html, broken


broken_item_html = '<a href="%(name)s.html">%(name)s</a><br>'

broken_html = "<h2  style='color:red;margin-left:-35px;margin-top:-20px;'><strong>Broken packages " \
              "[%s]</strong></h2><hr style='margin-left:-15px;margin-top:5px;'><br>"

item_html = '<li class="portfolio-item2" data-id="id-%(i)s" data-type="%(category)s" data-name' \
            '="%(name)s"><div>\
              <span class="image-block"> <a class="image-zoom" href="%(screenshot)s" rel="prettyPhoto"  \
              title="%(name)s: %(description)s"><img width="170" height="130" src="%(screenshot)s" \
            alt="%(name)s" title="%(name)s" ></a> </span> <div class="home-portfolio-text"> <h2 \
              class="post-title-portfolio"><a href="items/%(' \
            'name)s.html?iframe=true&width=800&height=500""\
              rel="prettyPhoto[iframes]">%(name)s</a></h2> <p class="post-subtitle-portfolio">%(' \
            'description)s </p> </div> </div></li>'

html_item_detail_head = '<h2  style="margin-left:-15px;margin-top:-20px;"><strong>%(name)s </strong>%(pkgver)s-%(pkgrel)s&nbsp;&nbsp;&nbsp;&nbsp;</h2><h4 style="  position: absolute;left:580px;top:0;vertical-align: middle;"><a href="https://github.com/KaOS-Community-Packages/%(name)s"  target="_blank">View on GitHub&nbsp;<img src="../images/github.png" width="22" height="22"></a></h4><hr style="margin-left:-15px;margin-top:5px;"><br>'

private_keys = "&client_id=e43da6309b975672c1eb" \
               "&client_secret=e362ddd7f374c69f2709c2af24b2d7f8e539cce7"

html_item_detail_buttons = '<div class="container-block"><div class=" text-center"><div class="well">' \
                           '<h3>How to install?</h3><hr ><ul   style="margin-left: ' \
                           '14px;margin-top: 15px"><strong>KCP helper</strong></br><li class="ui-state-default"><table ' \
                           'tyle="width:100%%"> <tr><td width="75%%">Searching or getting the ' \
                           'needed files from KaOS Community Packages has been simplified with the ' \
                           'addition of the package “kcp”. You can click the button to copy the required' \
                           ' command kcp and paste it into your console.</td><td ' \
                           'width="5%%"></td><td style="vertical-align: mid;" width="20%%"><a class="btn button ' \
                           'big" data-clipboard-text="kcp -u && kcp -i %(name)s" title="click to copy to ' \
                           'clipboard">Copy command</a></td></tr></table></li></ul><ul ' \
                           'style="margin-left: 14px"> <strong>ZIP file</strong><li ' \
                           'class="ui-state-default"><table style="width:100%%"><tr><td ' \
                           'width="75%%">Click the just downloaded package zip and extract file to your build' \
                           ' folder. The call to start to build and install the needed dependencies' \
                           ' is <b>makepkg -si</b>.</td><td width="5%%"></td><td ' \
                           'style="vertical-align: mid;" width="20%%"><a target="_blank" ' \
                           'href="https://github.com/KaOS-Community-Packages/%(name)s' \
                           '/archive/master.zip" class="button big">Download ZIP</a></td>' \
                           '</tr></table></li></br></ul></div></div>'
