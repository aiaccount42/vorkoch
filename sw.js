var C='vorkoch-v33';var F=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F.map(function(u){return new Request(u,{cache:'reload'});}));}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C;}).map(function(x){return caches.delete(x);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET')return;var u=new URL(e.request.url);if(u.origin!==self.location.origin||u.pathname.indexOf('/kalender/')>=0)return;
var net=fetch(e.request);
e.waitUntil(net.then(function(r){if(!r.ok||r.type!=='basic')return;var c=r.clone();return caches.open(C).then(function(x){return x.put(e.request,c);});}).catch(function(){}));
var slow=new Promise(function(ok){setTimeout(ok,3000);}).then(function(){return caches.match(e.request);}).then(function(m){return m||net;});
e.respondWith(Promise.race([net,slow]).catch(function(){return caches.match(e.request).then(function(m){return m||(e.request.mode==='navigate'?caches.match('index.html'):Response.error());});}));});
