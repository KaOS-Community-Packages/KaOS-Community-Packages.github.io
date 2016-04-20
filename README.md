# KCP-Center

## What is KCP-Center?

The KCP-Center is a web site hosted on Github, it allow to explore -and in a more visually way- all the packages existing in KCP, the community repository maintained by the KaOS users. The packages are classified by categories in order to facilitate the search. You can also access the descriptive meta-data of each package and view a screenshot of the app running. You can access the website at: [KaOS-Community-Packages.github.io](http://KaOS-Community-Packages.github.io)


### WHELP helper
To facilitate the maintenance and the updates of KCP-Center, it has created an assistant, which is a script in python called *whelp* that allow to keep synchronized the website with the repository of the KCP's packages. Between the posibilities allowed by the whelp is assign a category or a screenshot to any package, besides to capture automatically its meta-data. The tools *git* and *whelp* combinated allow to update in an easy way any look of the website such the next example:

```
$ git clone https://github.com/KaOS-Community-Packages/KaOS-Community-Packages.github.io.git
$ cd KaOS-Community-Packages.github.io/helper
$ ./whelp -s
$ cd ..
$ git add .
$ git commit -am "update web"
$ git push
```
Important: The assistent *whelp* must be runned always inside the directory *helper*


#### Syncronize
The first thing you must do is syncronize the packages between the KCP respository and the KCP-Center. For it we run the next command:

```
$ ./whelp -s
```

#### Categories
To assign a category to  package *vscode* we must run the next command:

```
$ ./whelp -n "vscode" -c "Development"
```

The categories availables are the following:

- **AudioVideo**:	Applications for presenting, creating, or processing multimedia (audio/video)	 
- **Development**:	Applications for development	 
- **Education**:	Educational softwares	 
- **Game**:	Games	 
- **Graphics**:	Applications for viewing, creating, or processing graphics	 
- **Network**:	Network applications such as a web browser	 
- **Office**:	Applications for office	 
- **Science**:	Scientific softwares	 
- **Settings**:	Settings applications. The entries may appear in a separate menu or as part of a "Control Center"
- **System**:	System applications, "System Tools" such like log viewers or network monitors	 
- **Utility**:	Small utility applications, "Accessories"


#### Screenshots
To assign a screenshot to package *vscode* we must run the next command:

```
$ ./whelp -n "vscode" -ss "images/screenshots/vscode.jpg"
```
Is important put first the image into the screenshots directory. The screenshot must be realized in jpg format and aproximatelly 550x500 px. 

The screenshot's url also can be remote, like the next example:

```
$ ./whelp -n "vscode" -ss "http://www.parlonsgeek.com/Visual-Studio-Code.png"
```

#### Meta-data
When we update a package is necessary to update the meta-data in the kcp-center. The next example shows how to update the meta-data of the package *vscode*

```
$ ./whelp -n "vscode" -m
```

To update the meta-data of all KCP's packages we use the next command (it can take several minutes):

```
$ ./whelp  -sm
```

#### Show the package's information
If we need to know the data of the category and screenshot of a package, we use the next command (following with the example for the package *vscode*)

```
$ ./whelp -n "vscode" -i
```

#### Up the changes at Github
To update the KCP-Center in Github you must run the following commands git (in the kcp's root directory):

```
$ git add .
$ git commit -am "update web"
$ git push
```

You can test locally the KCP-Center before up it at github opening the file *index.html* in your favourite web-browser.


