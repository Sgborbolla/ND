const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname,port=Number(process.argv[2]||8123);
const mime={
 '.html':'text/html; charset=utf-8',
 '.js':'text/javascript; charset=utf-8',
 '.json':'application/json',
 '.webmanifest':'application/manifest+json',
 '.png':'image/png',
 '.svg':'image/svg+xml',
 '.ico':'image/x-icon'
};
http.createServer((q,s)=>{
 let u=decodeURIComponent(q.url.split('?')[0]);
 if(u.endsWith('/'))u+='index.html';
 const t=path.join(root,path.normalize(u).replace(/^([/\\])+/,''));
 if(!t.startsWith(root)){s.writeHead(403);return s.end('403');}
 fs.readFile(t,(e,d)=>{
  if(e){s.writeHead(404,{'Content-Type':'text/plain'});return s.end('404');}
  s.writeHead(200,{
   'Content-Type':mime[path.extname(t)]||'application/octet-stream',
   'Cache-Control':'no-cache'
  });
  s.end(d);
 });
}).listen(port,()=>{
 console.log('');
 console.log('  ND  -  NIPPON DESTRUCTION');
 console.log('  ----------------------');
 console.log('  http://localhost:'+port+'/');
 console.log('');
 console.log('  Ctrl+C para cerrar el servidor.');
 console.log('');
});