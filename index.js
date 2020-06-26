const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const router = require("./router");
const { stat } = require("fs");
const { use } = require("./router");

let countDown = 5;

io.on("connection", (socket) => {
  console.log("We have a new Connection!");

  const interval = socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      name,
      room,
      weapon: Math.floor(Math.random() * 3),
    });

    if (error) return callback(error);

    const listUsers = getUsersInRoom(room);
    let status = 0;

    if (listUsers.length === 2) {
      const interval = setInterval(function () {
        if (getUsersInRoom(room).length !== 2) {
          clearInterval(interval);
        }
        countDown--;
        if (countDown === 0) {
          countDown = 3;

          const newListUser = getUsersInRoom(room);

          let winner;
          if ((newListUser[0].weapon + 1) % 3 === newListUser[1].weapon) {
            winner = newListUser[1];
          } else if (newListUser[0].weapon === newListUser[1].weapon) {
            winner = null;
          } else {
            winner = newListUser[0];
          }

          io.emit("seeResult", winner);
        }
        io.emit("timer", { countDown });
      }, 1000);
      status = 1;
    }

    if (listUsers.length > 2) {
      removeUser(socket.id);
      return callback({ error: "Already Full" });
    }

    socket.emit("message", {
      user: "admin",
      text: `Hello ${user.name}, welcome to the room ${user.room}`,
      status: status,
    });

    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name}, has joined!`,
      status: status,
    });

    socket.join(user.room);

    callback();
  });

  socket.on("calculate", ({ weapon }) => {
    let user = getUser(socket.id);
    user.weapon = weapon;

    removeUser(socket.id);
    addUser(user);
  });

  socket.on("finishMatch", (id) => {
    io.emit("exitMatch");
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    console.log("User had left!");
  });
});

app.use(router);

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server has started.`)
);
