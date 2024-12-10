// Requirements
const request = require('supertest');
const app = require('./app');
var fs = require('fs');

/* --- Tests --- */
describe('Tests de la API', ()=>{
    let token;
    // Test de registro
    test('Chequeo agregar usuario', async ()=> {
        const res = await request(app).post('/registrar').send({
            email: "felipe.carranza.f@gmail.com",
            firstName: "Felipe",
            lastName: "Carranza",
            password: "123456789"
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("Se ha añadido correctamente al usuario.");
    });
    test('Chequeo email repetido', async ()=> {
        const res = await request(app).post('/registrar').send({
            email: "felipe.carranza.f@gmail.com",
            firstName: "Felipe",
            lastName: "Carranza",
            password: "123456789"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Ya existe un usuario con el email felipe.carranza.f@gmail.com");
    });
    test('Chequeo campo vacío', async ()=> {
        const res = await request(app).post('/registrar').send({
            email: "dsdad@asdasdas",
            firstName: "",
            lastName: "Carranza",
            password: "123456789"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Nombre inválido.");
    });
    test('Chequeo email inválido', async ()=> {
        const res = await request(app).post('/registrar').send({
            email: "dsasdasdasd",
            firstName: "Felipe",
            lastName: "Carranza",
            password: "123456789"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Email inválido.");
    });
    test('Chequeo contraseña corta', async ()=> {
        const res = await request(app).post('/registrar').send({
            email: "abc@def",
            firstName: "Felipe",
            lastName: "Carranza",
            password: "123456"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Contraseña muy corta.");
    });
    // Test de login
    test('Chequeo usuario inexistente', async ()=> {
        const res = await request(app).post('/login').send({
            email: "dasdasd",
            password: "dasdasd"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("No existe un usuario con email dasdasd");
    });
    test('Chequeo contraseña incorrecta', async ()=> {
        const res = await request(app).post('/login').send({
            email: "felipe.carranza.f@gmail.com",
            password: "dasdasd"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Contraseña incorrecta.");
    });
    test('Chequeo login correcto', async ()=> {
        const res = await request(app).post('/login').send({
            email: "felipe.carranza.f@gmail.com",
            password: "123456789"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Usuario autenticado.");
        expect(res.body.token).toBeDefined();
        token = res.body.token;
    });
    // Test de autenticación
    test('Chequeo sin token', async ()=> {
        const res = await request(app).get('/peliculas');

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Acceso denegado. No proporcionó token de identificación.');
    });
    test('Chequeo con token inválido', async ()=> {
        const res = await request(app).get('/peliculas').set('authorization', 'Bearer codigoDelSur:)');

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Acceso denegado. Token inválido.');
    });
    // Test lista de películas
    test('Listar películas sin keyword', async ()=> {
        const res = await request(app).get('/peliculas').set('authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        let ord = true;
        const movies = res.body.message;
        for(let i = 0; i < movies.length-2; i++){
            if(parseInt(movies[i].suggestionScore) < parseInt(movies[i+1].suggestionScore)){
                ord = false;
                break;
            }
        }
        expect(ord).toBe(true);
    });

    // Limpiar
    afterAll(async ()=> {
        const users = JSON.parse(fs.readFileSync('./users.txt'), 'utf-8');
        fs.writeFile(
            "./users.txt",
            JSON.stringify(users.filter(user => user.email !== 'felipe.carranza.f@gmail.com')),
            err => {
                if (err) console.log(`Hubo un error añadiendo el usuario\n ${err}`);
            }
        );
    });
});