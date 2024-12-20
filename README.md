# Requisitos
1. Node.js - versión recomendada 22.12.0
2. npm - versión recomendada 10.9.0

Se pueden obtener [aquí](https://nodejs.org/en/download/package-manager).

# Como ejecutar
## Tipos de ejecuciones
1. Servidor de endpoints
2. Pruebas unitarias

Ambas ejecuciones correran el programa de configuración (explicado más adelante), y luego el código específico (`app.test.js` o `server.js`).

### Windows

Se pueden ejecutar con doble click en el archivo correspondiente (`run.bat` o `test.bat`) o (lo más recomendable) correrlo desde cmd o terminal con:
```bash
run.bat
```
o

```bash
test.bat
```

### Linux/Mac

Para ejecutar los scripts de shell se requiere; dar permiso de ejecución y después ejecutarlo:
```bash
chmod +x run.sh
./run.sh
```

o

```bash
chmod +x test.sh
./test.sh
```

# Configuración (Variables de entorno)

El programa `config.js` define 3 variables de entorno:
1. JWT_SECRET_KEY; clave secreta que servirá para generar los tokens de autenticación. Se genera aleatoriamente en todas las ejecuciones de cualquiera de los scripts (`run.bat`, `test.bat`, `run.sh` o `test.sh`).
2. PORT; puerto por el cuál escucha el servidor. Se pregunta al usuario, con valor predeterminado 3000. Solo se pide 1 vez.
3. MBDb (debería ser TMDb pero quedó así :)); Token de autenticación de la API de [TMDb](https://www.themoviedb.org/documentation/api?language=es). Es **importantísimo** ingresar el token (y uno válido), si no el programa no va a poder ejecutarse. Solo se pide la primera vez.

## Actualizar valores
Una vez ejecutado el programa `config.js` quedará creado el archivo `.env`, ahí se pueden cambiar los valores manualmente.

# Endpoints
|Nombre           |Método|Dirección |Input  |Autenticación|
|-----------------|------|----------|-------|-------------|
|Registrar usuario|POST |/registrar|`{"email":"string", "password":"string"}`|No requerida|
|Autenticar usuario|POST|/login|`{"email":"string", "password":"string"}`|Genera token|
|Listar películas|GET|/peliculas|`{"keyword":"string"}` (opcional)|Requiere token|
|Añadir película a favoritos|POST|/favoritas|`{"id":"int32"}`|Requiere token|
|Obtener películas favoritas|GET|/favoritas||Requiere token|
|Logout|POST|/logout||Invalida token|
