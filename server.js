const express = require('express')
const {createServer} = require('http')
const { Server } = require('socket.io')
const port = process.env.PORT || 3002
const app = express()

const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('../twits/build'))
}
let socketConnection

io.on("connection", socket => {
    if (socketConnection === undefined) {
    socketConnection = socket
    }
    require('./routes/tweets.js')(app, socketConnection)
})
io.on("disconnect", () => server.close())

server.listen(port, () => {
    console.log(`server is up on ${port}`)
})