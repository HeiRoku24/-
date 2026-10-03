/* 몸짱소울 서비스 워커: 한 번 열어 두면 오프라인에서도 열려요.
   앱을 수정해서 다시 올릴 때는 아래 VERSION 숫자를 올려 주세요. */
var VERSION = 'momjjang-soul-v39-6';
var SHELL = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){ return c.addAll(SHELL.map(function(u){ return new Request(u,{cache:'reload'}); })); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k!==VERSION; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin===self.location.origin;
  var isFont = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  var isFb = url.hostname==='www.gstatic.com' && url.pathname.indexOf('/firebasejs/')===0;
  if(!sameOrigin && !isFont && !isFb) return;
  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req,{cache:'no-cache'}).then(function(res){
        if(res && res.ok){ var c2=res.clone(); caches.open(VERSION).then(function(cache){ cache.put('./index.html',c2); }); }
        return res;
      }).catch(function(){
        return caches.open(VERSION).then(function(cache){ return cache.match(req,{ignoreSearch:true}).then(function(hit){ return hit || cache.match('./index.html'); }); });
      })
    );
    return;
  }
  e.respondWith(
    caches.open(VERSION).then(function(cache){
      return cache.match(req, {ignoreSearch:true}).then(function(hit){
        var net = fetch(req).then(function(res){
          if(res && (res.ok || res.type==='opaque')) cache.put(req, res.clone());
          return res;
        }).catch(function(){ return hit || (req.mode==='navigate' ? cache.match('./index.html') : undefined); });
        return hit || net;
      });
    })
  );
});
