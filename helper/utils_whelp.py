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


def build_item_template(data_local, item, var, packages_extra, html, broken):
    if var == 'url':
        while "$" in item[var]:
            for key in item:
                item[var] = item[var].replace(u"${" + key+u"}", str(item[key])).replace(
                    u"$" + key + "", str(item[key]))

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
            p = Popen(["pacman", "-Si", dep], stdout=PIPE, stderr=PIPE)
            out, err = p.communicate()
            if dep in packages_extra:
                html += '<b class="dependency-k">%s </b>&nbsp; ' % dep
            elif not err:
                html += '<b class="dependency-k">%s </b>&nbsp; ' % dep
                packages_extra.append(dep)
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

broken_html = "<h2  style='color:red;margin-left:-15px;margin-top:-20px;'><strong>Broken packages " \
              "[%s]</strong></h2><hr style='margin-left:-15px;margin-top:5px;'><br>"

item_html = u'<li class="portfolio-item2" data-id="id-%(i)s" data-type="%(category)s" data-name' \
            u'="%(name)s"><div>\
              <span class="image-block"> <a class="image-zoom" href="%(screenshot)s" rel="prettyPhoto"  \
              title="%(name)s: %(description)s"><img width="170" height="130" src="%(screenshot)s" \
            alt="%(name)s" title="%(name)s" ></a> </span> <div class="home-portfolio-text"> <h2 \
              class="post-title-portfolio"><a href="items/%(' \
            u'name)s.html?iframe=true&width=850&height=520""\
              rel="prettyPhoto[iframes]">%(name)s</a></h2> <p class="post-subtitle-portfolio">%(' \
            u'description)s </p> </div> </div></li>'

html_item_detail_head = '<h2  style="margin-left:-15px;margin-top:-20px;"><strong>%(name)s </strong> ' \
                        '%(pkgver)s-%(pkgrel)s&nbsp;&nbsp;&nbsp;&nbsp;<iframe align="center" ' \
                        'src="https://ghbtns.com/github-btn.html?user=KaOS-Community-Packages' \
                        '&repo=%(name)s&type=star&count=true" ' \
                        'frameborder="0" scrolling="0" width="170px" height="20px"></iframe></h2> <hr ' \
                        'style="margin-left:-15px;margin-top:5px;"><br>'

html_item_detail_buttons = u'<div class="container-block"><div class=" text-center"><div class="well">' \
                           u'<h3>How to install?</h3><hr ><ul   style="margin-left: ' \
                           u'14px;margin-top: 15px"><strong>KCP helper</strong></br><li class="ui-state-default"><table ' \
                           u'tyle="width:100%%"> <tr><td width="75%%">Searching or getting the ' \
                           u'needed files from KaOS Community Packages has been simplified with the ' \
                           u'addition of the package “kcp”. You can click the button to copy the required' \
                           u' command kcp and paste it into your console.</td><td ' \
                           u'width="5%%"></td><td style="vertical-align: mid;" width="20%%"><a class="btn button ' \
                           u'big" data-clipboard-text="kcp -i %(name)s" title="click to copy to ' \
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

private_keys = "&client_id=e43da6309b975672c1eb" \
               "&client_secret=e362ddd7f374c69f2709c2af24b2d7f8e539cce7"

packages_extra = ['java-environment', 'java-runtime', 'boost-libs', 'gcc-fortran', 'gcc-objc',
                  'gcc-ada', 'gcc-go', 'sh', 'pyqt', 'pyqt4', 'libjpeg', 'libjpeg6',
                  'portaudio-svn', 'python2-distribute', 'setuptools', 'python2-imaging',
                  'python-opengl', 'python-numeric', 'python2-c', 'python2-pycurl',
                  'flashplugin', u'gconf', u'libcap', u'gtk2', u'nss', u'libxtst', u'libnotify',
                  u'alsa-lib', u'libxss', u'libcups', u'libgnome-keyring', u'libxrandr',
                  u'qt5-base', u'hicolor-icon-theme', u'gtk3', u'libsoup',
                  u'desktop-file-utils', u'cronie', u'rsync', u'json-glib', u'vala',
                  u'qt5-x11extras', u'qt5-script', u'qt5-tools', u'cmake', u'solid',
                  u'qt5-webkit', u'make', u'pygtk', u'pulseaudio', u'bc', u'fftw', u'ladspa',
                  u'libxml2', u'perl-xml-parser', u'bash', u'kmod', u'gcc', u'patch', u'git',
                  u'linux-headers', u'lua', u'fontconfig', u'gcc-libs', u'libjpeg-turbo',
                  u'freetype2', u'cairo', u'libxslt', u'libpng', u'xdg-utils', u'pepper-flash',
                  u'bluez', u'ffmpeg', u'libao', u'lzo2', u'miniupnpc', u'sdl2', u'soundtouch',
                  u'wxgtk', u'python3', u'pyalpm', u'proj', u'gdal', u'zlib', u'bzip2',
                  u'libidn', u'libldap', u'geos', u'openssl', u'freeglut', u'libxi', u'libxmu',
                  u'enet', u'libvorbis', u'tar', u'glu', u'mesa', u'libgl', u'giflib',
                  u'jasper', u'librsvg', u'xine-lib', u'curl', u'pth', u'libvncserver',
                  u'openexr', u'poppler-glib', u'python2-gobject', u'python2-cairo',
                  u'gst-plugins-base', u'gnuchess', u'systemd', u'qt5-svg', u'qt5-multimedia',
                  u'oxygen', u'xscreensaver', u'libxft', u'libxpm', u'libxinerama', u'imlib2',
                  u'fribidi', u'glibc', u'gsm', u'lame', u'libass', u'libmodplug', u'libtheora',
                  u'libva', u'opencore-amr', u'openjpeg', u'rtmpdump', u'schroedinger', u'sdl',
                  u'speex', u'v4l-utils', u'xvidcore', u'libvpx', u'x264', u'libvdpau', u'yasm',
                  u'midna-themes', u'breeze-gtk', u'python3-gobject3', u'gobject-introspection',
                  u'pyxdg', u'dbus-python3', u'intltool', u'fltk', u'pam', u'gnutls',
                  u'libxfont', u'pixman', u'xorg-xauth', u'xkeyboard-config', u'libgcrypt',
                  u'perl', u'libxdamage', u'xorg-xkb-utils', u'xorg-server-utils', u'nasm',
                  u'xorg-font-util', u'xorg-util-macros', u'bigreqsproto', u'compositeproto',
                  u'damageproto', u'randrproto', u'resourceproto', u'scrnsaverproto',
                  u'videoproto', u'xcmiscproto', u'xf86vidmodeproto', u'xtrans', u'glproto',
                  u'dri2proto', u'dri3proto', u'presentproto', u'imagemagick', u'aspell',
                  u'pkg-config', u'subversion', u'automake', u'autoconf', u'libtool',
                  u'python2', u'qtwebkit', u'taglib', u'sqlite', u'gst-plugins-good',
                  u'gst-plugins-bad', u'libmtp', u'gst-plugins-ugly', u'xorg-utils',
                  u'xorg-server', u'nano', u'python2-setuptools', u'jack', u'libsndfile',
                  u'ruby', u'vim', u'boost', u'avahi', u'qt5-location', u'qt5-sensors',
                  u'hunspell', u'hunspell-en', u'dbus-glib', u'libxt', u'mime-types', u'hyphen',
                  u'libusb', u'libxkbcommon', u'libxv', u'nvidia-cg-toolkit', u'openal',
                  u'jack2', u'mono', u'libxext', u'libxrender', u'libxxf86vm', u'gendesk',
                  u'gtkspell', u'webkitgtk2', u'gpgme', u'gtk-update-icon-cache', u'gdb',
                  u'sdl_image', u'sdl_mixer', u'ed', u'libpng12', u'glib2', u'libsm',
                  u'shared-mime-info', u'cups', u'pango', u'plasma-framework',
                  u'extra-cmake-modules', u'qt', u'qca-ossl', u'dbus', u'wget',
                  u'pyqt5-python3', u'python3-setuptools', u'ca-certificates', u'perl-uri',
                  u'perl-file-listing', u'perl-html-parser', u'perl-http-date', u'icu',
                  u'libftdi', u'elfutils', u'clang', u'llvm', u'nodejs', u'php',
                  u'python2-pytz', u'ocaml', u'libffi', u'ncurses', u'sdl_net', u'mtools',
                  u'pyqt-python2', u'util-linux', u'parted', u'readline', u'ftgl', u'scons',
                  u'glew', u'libogg', u'gettext', u'wxgtk2.9', u'kcoreaddons', u'kdbusaddons',
                  u'ki18n', u'kio', u'knotifications', u'kxmlgui', u'pcre', u'expat', u'glm',
                  u'libxaw', u'zziplib', u'tinyxml', u'ttf-dejavu', u'libx11', u'libstdc++5',
                  u'webkitgtk3', u'dos2unix', u'mercurial', u'db', u'gmp', u'procps-ng',
                  u'firefox', u'google-chrome', u'phonon-qt5', u'unzip', u'qt5-xmlpatterns',
                  u'libxcomposite', u'libevent', u'p7zip', u'qt5-connectivity', u'gimp',
                  u'libssh2', u'krb5', u'exiv2', u'fuse', u'libmms', u'kconfig',
                  u'kwidgetsaddons', u'kdoctools', u'jansson', u'libmad', u'flac', u'wavpack',
                  u'libcdio', u'libcddb', u'faad2', u'libzip', u'libsamplerate', u'mpg123',
                  u'libcdio-paranoia', u'libxcursor', u'enca', u'qscintilla-qt5', u'powertop',
                  u'poppler', u'ghostscript', u'youtube-dl', u'pyqt-python3', u'cpio',
                  u'btrfs-progs', u'acl', u'lvm2', u'docbook-xsl', u'texlive-core',
                  u'xorg-fonts-alias', u'xorg-font-utils', u'xorg-fonts-encodings', u'hwids',
                  u'texlive-latexextra', u'poppler-qt5', u'okular', u'go', u'sudo', u'libcaca',
                  u'w3m', u'transmission-cli', u'neon', u'qtkeychain', u'qt5-declarative',
                  u'qt5-quickcontrols', u'libdvdread', u'libdvdnav', u'libbluray', u'libtiff',
                  u'smpeg', u'fluidsynth', u'libxml++', u'portmidi', u'opencv', u'help2man',
                  u'kiconthemes', u'udisks2', u'enchant', u'gawk', u'flex', u'zip', u'asciidoc',
                  u'mplayer', u'vlc', u'libyaml', u'libxxf86dga', u'sane', u'sed', u'libpcap',
                  u'bzr', u'gnuplot', u'r', u'lilypond', u'texlive-bin', u'chromaprint',
                  u'mutagen', u'python2-pyparsing', u'python2-pillow', u'python2-six',
                  u'dbus-python2', u'libice', u'file', u'libsigc++', u'iproute2',
                  u'lsb-release', u'chrpath', u'doxygen', u'gtkmm', u'netctl',
                  u'networkmanager', u'harfbuzz', u'graphicsmagick', u'qt5-imageformats',
                  u'logrotate', u'libexif', u'libid3tag', u'startup-notification', u'libxres',
                  u'libxau', u'texinfo', u'python2-lxml', u'openjdk', u'mpv', u'lcms2',
                  u'wayland', u'rubberband', u'samba', u'python2-docutils', u'gsl', u'c-ares',
                  u'crypto++', u'libuv', u'eigen3', u'swig', u'mpfr', u'libdbusmenu-qt5',
                  u'plasma-workspace', u'kdeclarative', u'kglobalaccel', u'kconfigwidgets',
                  u'kwindowsystem', u'python2-pyinotify', u'conky', u'gpm', u'python3-numpy',
                  u'python3-nose', u'qtwebengine', u'tcl', u'libgpg-error', u'gnome-doc-utils',
                  u'encfs', u'kdelibs', u'groff', u'python2-numpy', u'python2-nose',
                  u'rpmextract', u'gdbm']
