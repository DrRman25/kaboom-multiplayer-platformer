const app = require("express")();
const express = require("express");
const path = require("path");
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const htmlPath = path.join(__dirname, "client");
app.use(express.static(htmlPath));

const gameState = {
    players: {}
};

io.on("connection", socket => {
    socket.on("new player", ({name, spriteImage}) => {
        gameState.players[socket.id] = {
            x: 80,
            y: 40,
            name,
            spriteImage
        };
        console.log(`${name} joined!`);
    });
    socket.on("player movement", movement => {
        gameState.players[socket.id].x = movement.x;
        gameState.players[socket.id].y = movement.y;
        gameState.players[socket.id].width = movement.width;
        gameState.players[socket.id].height = movement.height;
        gameState.players[socket.id].flipX = movement.flipX;
        gameState.players[socket.id].playerScale = movement.scale;
    });
    socket.on("disconnect", () => {
        console.log(`${gameState.players[socket.id].name} disconnected!`);
        delete gameState.players[socket.id];
    });
});

setInterval(() => {
    io.sockets.emit("state", gameState);
}, 1000 / 60);

http.listen(8080, () => {
    console.log("The game is now live on port 8080!");
});
