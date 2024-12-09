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
const mbdb_key = process.env.MBDb_KEY;
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

    jwt.verify(tkn, JWT_SECRET_KEY, (err, user) => {
        if(err)
            return res.status(403).json({ error: 'Acceso denegado. Token inválido' });

        req.user = user;
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
    var fFile = fs.readFileSync('./favoritos.txt');
} catch (error) {
    var fFile = '[]'
}

const users = JSON.parse(uFile, 'utf-8');
const favs = JSON.parse(fFile, 'utf-8');
const { error } = require('console');
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

    res.status(200).json({message: "Usuario autenticado.", tkn});
});

// Listar pelícukas
app.get("/peliculas", authToken, async (req, res) => {
    const kwrd = req.keyword;
    if(kwrd){
        try{
            const movies = await axios.get(`${mbdb_url}/search/movie`, {
                params: {
                    query: kwrd,
                    language: 'es-ES',
                    page: 1
                },
                headers: {
                    Authorization: `Bearer ${mbdb_key}`
                }
            });
        }
        catch{
            return res.status(500).json({ error: 'Error al obtener las películas de MBDb.' });
        }
    }
    else{
        try{
            const movies = await axios.get(`${mbdb_url}/movie/popular`, {
                params: {
                    language: 'es-ES',
                    page: 1
                },
                headers: {
                    Authorization: `Bearer ${mbdb_key}`
                }
            });
        }
        catch{
            return res.status(500).json({ error: 'Error al obtener las películas de MBDb.' });
        }
    }
    // TO-DO: Generar suggestionScore y ordenar lista de películas.
});

module.exports = app;