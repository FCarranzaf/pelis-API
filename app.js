// Module inclusion
const express = require('express');
var fs = require('fs');
const cors = require('cors');
require('dotenv/config');

// App constants
const app = express();
const crypto = require('crypto');

// Middleware
app.use(cors());
app.use(express.json());

// Database
const users = JSON.parse(fs.readFileSync('./users.txt'), 'utf-8');
const favs = JSON.parse(fs.readFileSync('./favoritos.txt'), 'utf-8');
const { error } = require('console');

/* --- Endpoints --- */

// Registrar Usuario
app.post('/registrar', function (req,res) {
    err = checkData(req.body.email, req.body.firstName, req.body.lastName, req.body.password);
    if(err != null){
        res.status(400).json({ error : err});
    }
    else if(emailRepetido(req.body.email)){
        res.status(400).json({ error: `Ya existe un usuario con el email ${req.body.email}`});
    }
    else{
        const {salt, hash} = hashPass(req.body.password);
        let newUser = {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: {salt, hash}
        };
        users.push(newUser);
        fs.writeFile(
            "./users.txt",
            JSON.stringify(users),
            err => {
                if (err) res.status(500).json({ error: `Hubo un error añadiendo el usuario\n ${err}`});
                else res.status(201).json({message: "Se ha añadido correctamente al usuario."});
            }
        );
    }
})

/* --- Funciones auxiliares --- */
function checkData(email, fn, ln, pass){
    if((email.match(/@/) || []).length != 1) return 'Email inválido.'
    else if(fn.length == 0) return 'Nombre inválido.'
    else if(ln.length == 0) return 'Apellido inválido.'
    else if(pass.length < 8) return 'Contraseña muy corta.'
    else return null;
}

function emailRepetido(mail){
    return users.some(user => user.email === mail);
}

function hashPass(pass, salt = crypto.randomBytes(16).toString('hex')){
    const iterations = 10;
    const keyLength = 64;
    const digest = 'sha512';

    const hash = crypto.pbkdf2Sync(pass, salt, iterations, keyLength, digest).toString('hex');

    return {salt, hash};
}

module.exports = app;