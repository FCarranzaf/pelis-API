// Module inclusion
const express = require('express');
var fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv/config');

// App constants
const app = express();
const JWT_SECRET_KEY = 'jwtSecretKeyFCF';

// Middleware
app.use(cors());
app.use(express.json());

// Database
const users = JSON.parse(fs.readFileSync('./users.txt'), 'utf-8');
const favs = JSON.parse(fs.readFileSync('./favoritos.txt'), 'utf-8');
const { error } = require('console');

/* --- Endpoints --- */

// Registrar Usuario
app.post('/registrar', async function (req,res) {
    const data = checkData(req.body.email, req.body.firstName, req.body.lastName, req.body.password);
    if(data){
        return res.status(400).json({ error : data});
    }
    else if(users.some(user => user.email === req.body.email.replaceAll(' ', ''))){
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
app.post("/login", async function(req, res) {
    const user = users.find(user => user.email === req.body.email);
    if(!user)
        return res.status(400).json({ error: `No existe un usuario con email ${req.body.email}` });
    if(!await bcrypt.compare(req.body.password, user.password))
        return res.status(400).json({ error: 'Contraseña incorrecta.' });

    const tkn = jwt.sign({email: user.email}, JWT_SECRET_KEY);

    res.status(200).json({message: "Usuario autenticado.", tkn});
});

/* --- Funciones auxiliares --- */
function checkData(email, fn, ln, pass){
    if((email.match(/@/) || []).length != 1) return 'Email inválido.'
    else if(fn.length == 0) return 'Nombre inválido.'
    else if(ln.length == 0) return 'Apellido inválido.'
    else if(pass.length < 8) return 'Contraseña muy corta.'
    else return null;
}

module.exports = app;