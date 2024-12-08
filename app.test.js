// Requirements
const request = require('supertest');
const app = require('./app');

/* --- Tests --- */
describe('Tests de la API', ()=>{
    // Test de registro
    it('Chequeo agregar usuario', async ()=> {
        const res = await request(app).post('/registrar').send({
            email: "felipe.carranza.f@gmail.com",
            firstName: "Felipe",
            lastName: "Carranza",
            password: "123456789"
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("Se ha añadido correctamente al usuario.");
    });
    it('Chequeo email repetido', async ()=> {
        const res = await request(app).post('/registrar').send({
            email: "felipe.carranza.f@gmail.com",
            firstName: "Felipe",
            lastName: "Carranza",
            password: "123456789"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Ya existe un usuario con el email felipe.carranza.f@gmail.com");
    });
    it('Chequeo campo vacío', async ()=> {
        const res = await request(app).post('/registrar').send({
            email: "dsdad@asdasdas",
            firstName: "",
            lastName: "Carranza",
            password: "123456789"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Nombre inválido.");
    });
    it('Chequeo email inválido', async ()=> {
        const res = await request(app).post('/registrar').send({
            email: "dsasdasdasd",
            firstName: "Felipe",
            lastName: "Carranza",
            password: "123456789"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Email inválido.");
    });
    it('Chequeo contraseña corta', async ()=> {
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
    it('Chequeo usuario inexistente', async ()=> {
        const res = await request(app).post('/login').send({
            email: "dasdasd",
            password: "dasdasd"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("No existe un usuario con email dasdasd");
    });
    it('Chequeo contraseña incorrecta', async ()=> {
        const res = await request(app).post('/login').send({
            email: "felipe.carranza.f@gmail.com",
            password: "dasdasd"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Contraseña incorrecta.");
    });
    it('Chequeo login correcto', async ()=> {
        const res = await request(app).post('/login').send({
            email: "felipe.carranza.f@gmail.com",
            password: "123456789"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Usuario autenticado.");
    });
});