// Module inclusion
const express = require('express');
var fs = require('fs');
require('dotenv/config');

// App constants
const app = express();
const PORT = process.env.PORT;
const crypto = require('crypto');
//const utils = require('./utils')

// Middleware
app.use(express.json());

// Database
const users = require('./users.txt');
const favs = require('./favoritos.txt');

/* --- Endpoints --- */

// Registrar Usuario
app.post('/registrar', function (req,res) {
    const mail = parseEmail(req.body.email);
    if(!unicidadEmail(mail, users)){
        res.send(`Ya existe un usuario con el email ${req.body.email}`);
    }
    else{
        const {salt, hash} = hashPass(req.body.password);
        let newUser = {
            email: mail,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: {salt, hash}
        };
        users.push(newUser);
        fs.writeFile(
            "./users.txt",
            JSON.stringify(users),
            err => {
                if (err) res.send(`Hubo un error añadiendo el usuario\n ${err}`);

                res.send("Se ha añadido correctamente al usuario.");
            }
        );
    }
})

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
