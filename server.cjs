// Serves only this workout directory. No dependencies and no directory listing.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = __dirname;
const port = Number(process.env.PORT || 8080);
const types = {'.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const allowed = new Set(['index.html','styles.css','app.js','activities.js','workout.js','workout-config.json','assets/exercises.png','assets/warmup.png','assets/favicon.svg']);
const server = http.createServer((req,res)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400).end();return; }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
  const file=pathname==='/'?'index.html':pathname.slice(1);
  if(!allowed.has(file)){res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found');return;}
  fs.stat(path.join(root,file),(err,stat)=>{
    if(err){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')res.end();else fs.createReadStream(path.join(root,file)).pipe(res);
  });
});
server.on('error',err=>{console.error(err.message);process.exitCode=1;});
server.listen(port,'0.0.0.0',()=>{
  console.log(`Local: http://localhost:${port}`);
  for(const entries of Object.values(os.networkInterfaces()))for(const a of entries||[])if(a.family==='IPv4'&&!a.internal)console.log(`Network: http://${a.address}:${port}`);
});
