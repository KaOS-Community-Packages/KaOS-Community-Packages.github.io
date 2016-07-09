#!/usr/bin/env python2
# -*- coding: utf-8 -*-

from subprocess import Popen, PIPE
import re
import json
import ast
import datetime


def get_data_local():
    data_local = []
    with open('data.json') as data_file:
        data_local = json.load(data_file)
    return data_local

data_local = get_data_local()


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

    elif var == 'requerid_by':
        req = False
        html_prov = '<strong>requerid by: </strong>'
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

item_html = u'<li class="portfolio-item2" data-id="id-%(i)s" data-type="%(category)s" data-name' \
            u'="%(name)s"><div>\
              <span class="image-block"> <a class="image-zoom" href="%(screenshot)s" rel="prettyPhoto"  \
              title="%(name)s: %(description)s"><img width="170" height="130" src="%(screenshot)s" \
            alt="%(name)s" title="%(name)s" ></a> </span> <div class="home-portfolio-text"> <h2 \
              class="post-title-portfolio"><a href="items/%(' \
            u'name)s.html?iframe=true&width=800&height=500""\
              rel="prettyPhoto[iframes]">%(name)s</a></h2> <p class="post-subtitle-portfolio">%(' \
            u'description)s </p> </div> </div></li>'

html_item_detail_head = '<h2  style="margin-left:-15px;margin-top:-20px;"><strong>%(name)s </strong>%(pkgver)s-%(pkgrel)s&nbsp;&nbsp;&nbsp;&nbsp;</h2><h4 style="  position: absolute;left:580px;top:0;vertical-align: middle;"><a href="https://github.com/KaOS-Community-Packages/%(name)s"  target="_blank">View on GitHub&nbsp;<img src="../images/github.png" width="22" height="22"></a></h4><hr style="margin-left:-15px;margin-top:5px;"><br>'

private_keys = "&client_id=e43da6309b975672c1eb" \
               "&client_secret=e362ddd7f374c69f2709c2af24b2d7f8e539cce7"

html_item_detail_buttons = u'<div class="container-block"><div class=" text-center"><div class="well">' \
                           u'<h3>How to install?</h3><hr ><ul   style="margin-left: ' \
                           u'14px;margin-top: 15px"><strong>KCP helper</strong></br><li class="ui-state-default"><table ' \
                           u'tyle="width:100%%"> <tr><td width="75%%">Searching or getting the ' \
                           u'needed files from KaOS Community Packages has been simplified with the ' \
                           u'addition of the package “kcp”. You can click the button to copy the required' \
                           u' command kcp and paste it into your console.</td><td ' \
                           u'width="5%%"></td><td style="vertical-align: mid;" width="20%%"><a class="btn button ' \
                           u'big" data-clipboard-text="kcp -u && kcp -i %(name)s" title="click to copy to ' \
                           u'clipboard">Copy command</a></td></tr></table></li></ul><ul ' \
                           u'style="margin-left: 14px"> <strong>ZIP file</strong><li ' \
                           u'class="ui-state-default"><table style="width:100%%"><tr><td ' \
                           u'width="75%%">Click the just downloaded package zip and extract file to your build' \
                           u' folder. The call to start to build and install the needed dependencies' \
                           u' is <b>makepkg -si</b>.</td><td width="5%%"></td><td ' \
                           u'style="vertical-align: mid;" width="20%%"><a target="_blank" ' \
                           u'href="https://github.com/KaOS-Community-Packages/%(name)s' \
                           u'/archive/master.zip" class="button big">Download ZIP</a></td>' \
                           u'</tr></table></li></br></ul></div></div>'

