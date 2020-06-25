const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 5000;

const router = require("./router");

io.on("connection", (socket) => {
  console.log("We have a new Connection!");

  socket.on("join", ({ name }) => {
    console.log(name);
  });

  socket.on("disconnect", () => {
    console.log("User had left!");
  });
});

app.use(router);

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server has started.`)
);
