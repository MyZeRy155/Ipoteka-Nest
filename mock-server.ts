const server = require('http').createServer((req, res) => {
    switch (process.env.SCENARIO ) {
        case'500':
            res.writeHead(500); res.end();
            break;
        case'garbage-invalid':
            res.writeHead(200, {'Content-Type': 'application/json'});   res.end('this is not json{{{');
            break;
        case'garbage-shape':
            res.writeHead(200, {'Content-Type': 'application/json'});   res.end(JSON.stringify({foo: 'bar'}));
            break;
        case'empty':
            res.writeHead(200, {'Content-Type': 'application/json'});   res.end(JSON.stringify({}));
            break;
    }
})
server.listen(4000)