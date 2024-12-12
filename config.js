const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');
function askQ(query){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        })
    })
}
(async () =>{
    try{
        if(!fs.existsSync('./.env'))
            fs.writeFileSync('./.env', "", 'utf8');
        let env = fs.readFileSync('./.env', 'utf8');
        const keyRegex = new RegExp('^JWT_SECRET_KEY=.*', 'm');
        if(!keyRegex.test(env))
            env += `JWT_SECRET_KEY=${key}`
        else
            env = env.replace(keyRegex, `JWT_SECRET_KEY=${key}`);

        fs.writeFileSync('./.env', env, 'utf8');
        console.log('Nueva clave secreta para JWT creada.');

        const portRegex = new RegExp('^PORT=.*', 'm');
        if(!portRegex.test(env)){
            let port = 3000;
            
            const portAnswer = await askQ('Ingrese el puerto a escuchar (3000): ');
            if(portAnswer && parseInt(portAnswer) > 1024)
                port = portAnswer;
            
            env += `\nPORT=${portAnswer}`
            fs.writeFileSync('./.env', env, 'utf8');
            console.log('Puerto seleccionado correctamente.');
        }
        const tmdbRegex = new RegExp('^MBDb=.*', 'm');
        if(!tmdbRegex.test(env)){
            let tmdbkey;
            while(!tmdbkey){
                const tmdbAnswer = await askQ('Ingrese su clave de TMDb: ');
                if(tmdbAnswer)
                    tmdbkey = tmdbAnswer;
                else{
                    console.log('Se necesita una clave');
                }
            }

            
            env += `\nMBDb=${tmdbkey}`;
            fs.writeFileSync('./.env', env, 'utf8');
            console.log('Clave de TMDb actualizada correctamente.');
        }
    }
    catch{
        console.error('Error en la ejecucion.');
    }
})();