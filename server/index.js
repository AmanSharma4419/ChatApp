const express = require("express");
const app = express();
const http = require("http").Server(app);
const path = require("path");
const io = require("socket.io")(http);

const uri = "mongodb://localhost:27017/ChatApp";
const port = process.env.PORT || 5000;

const Message = require("./Message");
const mongoose = require("mongoose");

mongoose.connect(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("Connected");
  // Get the last 10 messages from the database.
  Message.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .exec((err, messages) => {
      if (err) return console.error(err);
      // Send the last messages to the user.
      socket.emit("init", {
        messages,
      });
    });

  // Listen to connected users for a new message.
  socket.on("message", (msg) => {
    console.log(msg, "getting the msg from client");
    // Create a message with the content and the name of the user.
    const message = new Message({
      name: msg.name,
      content: msg.des,
    });

    // Save the message to the database.
    message.save((err) => {
      if (err) return console.error(err);
    });

    // Notify all other users about a new message.
    socket.broadcast.emit("push", msg);
  });
});

http.listen(port, () => {
  console.log("listening on *:" + port);
});
