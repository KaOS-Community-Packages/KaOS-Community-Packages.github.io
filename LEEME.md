# KCP-Center

## Que es KCP-Center?

El KCP-Center es un sitio web albergado en Github que permite explorar fácilmente - y de un modo más visual- todos los paquetes existentes en KCP (repositorio comunitario mantenido por los usuarios de KaOS). Los paquetes se encuentran clasificados por categorías con el fin de facilitar la búsqueda. También se puede acceder a los meta-datos descriptivos de cada paquete y visualizar una captura del programa en funcionamiento una vez instalado. Usted puede acceder al sitio web en la dirección: [KaOS-Community-Packages.github.io](http://KaOS-Community-Packages.github.io)



### Asistente WHELP 

Para facilitar el mantenimiento y actualizaciones del KCP-Center y a modo de ayudante se ha creado un script en python denominado *whelp* que permite mantener sicronizado el sitio web con el repositorio de paquetes de kcp. Entre las posibilidades que permite el whelp está la de asignar categoría o un screenshot a cualquier paquete, además de capturar automaticamente sus metadatos. La combinación de las herramientas *git* y *whelp* permite actualizar de una forma sencilla cualquier aspecto del sitio web tal como podemos ver en el siguiente ejemplo:

```
$ git clone https://github.com/KaOS-Community-Packages/KaOS-Community-Packages.github.io.git
$ cd KaOS-Community-Packages.github.io/helper
$ ./whelp -s
$ cd ..
$ git add .
$ git commit -am "update web"
$ git push
```
#Nota importante: El ayudante *whelp* debe ser ejecutado siempre dentro del directorio *helper*

#### Sincronizar 
La primera tarea que se debe realizar, antes de cualquier otra, es la que permite la sincronización de paquetes entre el repositorio KCP y el KCP-Center. Para ello ejecutaremos el siguiente comando:
```
$ ./whelp -s
```



#### Categorias
Para asignar una categoría a un paquete, debemos ejecutar el siguiente comando:
```
$ ./whelp -n "vscode" -c "Development"
```

Las categorías disponibles son las siguientes:

- **AudioVideo**:	Application for presenting, creating, or processing multimedia (audio/video)	 
- **Development**:	An application for development	 
- **Education**:	Educational software	 
- **Game**:	A game	 
- **Graphics**:	Application for viewing, creating, or processing graphics	 
- **Network**:	Network application such as a web browser	 
- **Office**:	An office type application	 
- **Science**:	Scientific software	 
- **Settings**:	Settings applications	Entries may appear in a separate menu or as part of a "Control Center"
- **System**:	System application, "System Tools" such as say a log viewer or network monitor	 
- **Utility**:	Small utility application, "Accessories"



#### Screenshots
Para asignar un screenshot a un paquete, debemos ejecutar el siguiente comando:
```
$ ./whelp -n "vscode" -ss "images/screenshots/vscode.jpg"
```
Es importante colocar la imagen previamente en la carpeta screenshots. La captura debe ser realizada en el propio KaOS en formato jpg y de un tamaño aproximado de 500x500px.

La url del screenshot tambien puede ser remoto, como en el siguiente ejemplo:
```
$ ./whelp -n "vscode" -ss "http://www.parlonsgeek.com/Visual-Studio-Code.png"
```

#### Metadatos
Cuando se realiza la actualización de un paquete es necesario actualizar los metadados en el kcp-center. El siguiente ejemplo muestra como actualizar los metadatos del paquete *vscode* :

```
$ ./whelp -n "vscode" -m
```

Para actualizar los metadatos de todos los paquetes de KCP [esta operación puede durar varios minutos], el comando es el siguiente:
```
$ ./whelp  -sm
```

#### Mostrar información de paquete
Si necesitamos saber los datos de categoria y screenshot de un paquete, podemos usar el siguiente comando (en el ejemplo para el paquete *vscode*):
```
$ ./whelp -n "vscode" -i
```

#### Subir los cambios a github
Para actualizar el KCP-center en github debe ejecutar los siguientes comandos git (en el directorio raiz del kcp):
```
$ git add .
$ git commit -am "update web"
$ git push
```

Usted puede probar localmente el KCP-Center antes de subirlo a github, arrastrando el archivo *index.html* a su browser favorito.


