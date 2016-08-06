# Agarioplica

A replica of the real-time multiplayer game [agar.io](http://agar.io/), features client-side prediction and lag compensation 

The server is in Java. Client code utilizes HTML5 and Jquery.
Server-Client communication is done using [web sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

##### STILL A WORK IN PROGRESS!!

#### Building

To run the server, build the files in the src folder, and include the jar file in your project dependencies. Run the client from the Client folder. 

#### USE GOOGLE CHROME for running client. Move with mouse, Shoot mass with a left-click.

#### TODO List
- [x] Fixing time-stepping on server and clients
- [ ] Handling blob generation and synchronization across clients
- [ ] Collision Detection
- [x] Porting physics to Java on the server 
- [ ] Implementing [Source startegy](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking) for client-server communication. Better explained [here](http://www.gabrielgambetta.com/fpm1.html)
- [ ] Replacing string data communication between server and clients with other formats/encoding. ( JSON or raw binary? ) 
- [ ] Enhanced graphics/effects
- [ ] Tweaking input processing and buffering across threads
- [ ] Optimization for cpu-heavy code
- [ ] Creating a pre-game panel for preliminary settings and player name input
- [ ] testing java mulithreading for potential concurrency flaws
- [ ] Splitting upon colliding into viruses


This project uses a Java library by TooTallNate:
https://github.com/TooTallNate/Java-WebSocket/blob/master/dist/java_websocket.jar


Created in Summer 2016.
