# Agarioplica

A replica of the real-time multiplayer game [agar.io](http://agar.io/)

The server is in Java. Client code utilizes HTML5 and Jquery.
Server-Client communication is done using [web sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

##### STILL A WORK IN PROGRESS!!

#### Check out the local demo as the full server-client code is laggy 
due to it being in the middle of an upgrade.

#### TODO List
- [ ] Handling blob generation and synchronization across clients
- [ ] Collision Detection
- [x] Porting physics to Java on the server 
- [ ] Implementing [Source startegy](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking) for client-server communication. Better explained [here](http://www.gabrielgambetta.com/fpm1.html)
- [ ] Replacing string data communication between server and clients with other formats/encoding. ( JSON or raw binary? ) 
- [ ] Enhanced graphics/effects
- [ ] Tweaking input processing and buffering across threads
- [ ] Optimization for cpu-heavy code
- [ ] Creating a pre-game panel for preliminary settings and player name input
- [ ] testing (especially for floatting point build up errors and thread synchronization)
- [ ] Splitting upon colliding into viruses
- [ ] Fixing time-stepping on server and clients


This project uses a Java library by TooTallNate:
https://github.com/TooTallNate/Java-WebSocket/blob/master/dist/java_websocket.jar


Created in Summer 2016.
