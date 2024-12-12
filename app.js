// Module inclusion
const express = require('express');
var fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv/config');

// App constants
const app = express();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const mbdb_key = process.env.MBDb;
const mbdb_url = 'https://api.themoviedb.org/3/';

// Middleware
app.use(cors());
app.use(express.json());

const checkData = (req, res, next) => {
    if((req.body.email.match(/@/) || []).length != 1) var data = 'Email inválido.';
    else if(req.body.firstName.length == 0) var data = 'Nombre inválido.';
    else if(req.body.lastName.length == 0) var data = 'Apellido inválido.';
    else if(req.body.password.length < 8) var data = 'Contraseña muy corta.';
    if(data)
        return res.status(400).json({ error : data});
    next();
};

const authToken = (req, res, next) => {
    const authHdr = req.headers['authorization'];

    const tkn = authHdr && authHdr.split(' ')[1];
    if(!tkn)
        return res.status(403).json({ error: 'Acceso denegado. No proporcionó token de identificación.'});
    if(blacklist.find(token => token === tkn))
        return res.status(403).json({ error: 'Acceso denegado. Token inválido.' });
    jwt.verify(tkn, JWT_SECRET_KEY, (err, email) => {
        if(err)
            return res.status(403).json({ error: 'Acceso denegado. Token inválido.' });

        req.email = email;
        req.token = tkn;
        next();
    });
};

// Database
try {
    var uFile = fs.readFileSync('./users.txt');
} catch (error) {
    var uFile = '[]';
}
try {
    var fFile = fs.readFileSync('./favs.txt');
} catch (error) {
    var fFile = '[]'
}
try {
    var tFile = fs.readFileSync('./blacklist.txt');
} catch (error) {
    var tFile = '[]'
}

const users = JSON.parse(uFile, 'utf-8');
const favs = JSON.parse(fFile, 'utf-8');
const blacklist = JSON.parse(tFile, 'utf-8');
const { default: axios } = require('axios');

/* --- Endpoints --- */

// Registrar Usuario
app.post('/registrar', checkData, async (req,res) => {
    if(users.some(user => user.email === req.body.email.replaceAll(' ', ''))){
        return res.status(400).json({ error: `Ya existe un usuario con el email ${req.body.email}`});
    }
    else{
        const hash = await bcrypt.hash(req.body.password, 10);
        let newUser = {
            email: req.body.email.replaceAll(' ', ''),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash
        };
        users.push(newUser);
        fs.writeFile(
            "./users.txt",
            JSON.stringify(users),
            err => {
                if (err) return res.status(500).json({ error: `Hubo un error añadiendo el usuario\n ${err}`});
                else return res.status(201).json({message: "Se ha añadido correctamente al usuario."});
            }
        );
    }
})

// Autenticar usuario
app.post("/login", async (req, res) => {
    const user = users.find(user => user.email === req.body.email);
    if(!user)
        return res.status(400).json({ error: `No existe un usuario con email ${req.body.email}` });
    if(!await bcrypt.compare(req.body.password, user.password))
        return res.status(400).json({ error: 'Contraseña incorrecta.' });

    const tkn = jwt.sign({email: user.email}, JWT_SECRET_KEY);

    res.status(200).json({message: "Usuario autenticado.", token: tkn});
});

// Listar pelícukas
app.get("/peliculas", authToken, async (req, res) => {
    const kwrd = req.keyword;
    let movies;
    if(kwrd){
        try{
            const res = await axios.get(`${mbdb_url}/search/movie`, {
                params: {
                    query: kwrd,
                    language: 'es-ES',
                    page: 1
                },
                headers: {
                    Authorization: `Bearer ${mbdb_key}`
                }
            });
            console.log(res);
            movies = res.data.results;
        }
        catch{
            return res.status(500).json({ error: 'Error al obtener las películas de MBDb.' });
        }
    }
    else{
        try{
            const res = await axios.get(`${mbdb_url}/movie/popular`, {
                params: {
                    language: 'es-ES',
                    page: 1
                },
                headers: {
                    authorization: `Bearer ${mbdb_key}`
                }
            });
            movies = res.data.results;
        }
        catch{
            return res.status(500).json({ error: 'Error al obtener las películas de MBDb.' });
        }
    }
    movies.forEach(movie => {
        movie.suggestionScore = Math.floor(Math.random()*100);
    });
    movs = mergeSort(movies);
    return res.status(200).json({message: movs});
});

// Añadir película a favoritos
app.post('/favoritas', authToken, async (req, res) => {
    const movieID = req.body.movieID;
    if(!movieID)
        return res.status(400).json({ error: 'No proporcionó película.' });
    try{
        const resp = await axios.get(`${mbdb_url}/movie/${movieID}`, {
            headers: {
                Authorization: `Bearer ${mbdb_key}`
            }
        });
    }
    catch{
        return res.status(400).json({ error: 'La película ingresada no existe.' });
    }
    let uFav = favs.find(item => item.email === req.email.email);
    if(!uFav){
        uFav = {
            email: req.email.email
        };
    }
    let movieFavs = uFav.movies;
    if(!movieFavs)
        movieFavs = [];
    if(movieFavs.find(movie => movie.id === movieID))
        return res.status(200).json({ message: 'La película ya estaba en favoritos. No ocurrió nada.' });
    let newMovie = {
        id: movieID,
        addedAt: new Date()
    }
    movieFavs.push(newMovie);
    uFav.movies = movieFavs;
    const index = favs.findIndex(item => item.email === uFav.email);
    if(index != -1)
        favs[index] = uFav;
    else
        favs.push(uFav);
    fs.writeFile(
        "./favs.txt",
        JSON.stringify(favs),
        err => {
            if (err) return res.status(500).json({ error: `Hubo un error añadiendo la película\n ${err}`});
            else return res.status(201).json({message: "Se ha añadido correctamente la película."});
        }
    );
});

// Obtener películas favoritas
app.get('/favoritas', authToken, async (req,res) => {
    const uFav = favs.find(item => item.email === req.email.email);
    if(!uFav)
        return res.status(200).json({ message: 'El usuario no tiene películas favoritas.' });
    let movs = uFav.movies;
    movs.forEach(movie => {
        movie.suggestionScore = Math.floor(Math.random()*100);
    });
    const ordMovs = mergeSort(movs);
    let ret = [];
    for (const movie of ordMovs) {
        const resp = await axios.get(`${mbdb_url}/movie/${movie.id}`, {
            headers: {
                Authorization: `Bearer ${mbdb_key}`
            }
        });
        const newMovie = resp.data;
        newMovie.suggestionForTodayScore = movie.suggestionScore;
        newMovie.addedAt = movie.addedAt;
        ret.push(newMovie);
    };
    return res.status(200).json({ peliculas: ret });
});

// Logout
app.post('/logout', authToken, async (req, res) =>{
    blacklist.push(req.token);
    fs.writeFile(
        "./blacklist.txt",
        JSON.stringify(blacklist),
        err => {
            if (err) return res.status(500).json({ error: `Hubo un error cerrando la sesión\n ${err}`});
            else return res.status(201).json({message: "Se cerró correctamente sesión."});
        }
    );
});


// Auxiliar de ordenamiento
function mergeSort(arr){
    let ret = [];
    if(arr.length == 1) ret = arr;
    else if(arr.length == 2){
        if(arr[0].suggestionScore < arr[1].suggestionScore){
            ret[0] = arr[1];
            ret[1] = arr[0]; 
        }
    }
    else if(arr.length > 2){
        var arr1 = mergeSort(arr.slice(0, Math.floor(arr.length/2)));
        var arr2 = mergeSort(arr.slice(Math.floor(arr.length/2+1), arr.length-1));
        var i = 0;
        while((arr1 && arr1.length > 0) || (arr2 && arr2.length > 0)){
            if(arr1.length == 0)
                ret[i] = arr2.shift();
            else if(arr2.length == 0)
                ret[i] = arr1.shift();
            else{
                if(arr1[0].suggestionScore < arr2[0].suggestionScore)
                    ret[i] = arr2.shift();
                else
                    ret[i] = arr1.shift();
            }
            i++;
        }
    }
    return ret;
}

module.exports = app;