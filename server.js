const express = require('express')
const {createServer} = require('http')
const { default: mongoose } = require('mongoose')
const { Server } = require('socket.io')
const port = process.env.PORT || 3002
const app = express()

const server = createServer(app)
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  });
app.use('/api', require('./routes/api.route'))
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('twits/build'))
}
let socketConnection

io.on("connection", socket => {
    if (socketConnection === undefined) {
    socketConnection = socket
    }
    require('./routes/tweets.js')(app, socketConnection)
})
io.on("disconnect", () => server.close())

mongoose
.connect('mongodb+srv://dbEugen:eilinskih92@cluster0.uw7bjw4.mongodb.net/tweets?retryWrites=true&w=majority')
.then((res) => console.log('db connected'))
.catch((err) => console.log(err))

server.listen(port, () => {
    console.log(`server is up on ${port}`)
})
