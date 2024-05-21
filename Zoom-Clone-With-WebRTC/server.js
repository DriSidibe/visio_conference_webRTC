const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.set('trust proxy', true);

app.get('/:teacherId', (req, res) => {
  let teacher_id = req.params.teacherId;
  let room_name = uuidV4();
        fetch('http://localhost:8000/classroom/get_teacher/'+teacher_id+'/')
        .then(response => {
          if (!response.ok) {
            // If response is not ok (e.g., 404 or 500), throw an error
            throw new Error('Network response was not ok ' + response.statusText);
          }
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            // If response is not JSON, throw an error
            throw new TypeError("Received response is not JSON");
          }
          return response.json(); // Attempt to parse JSON from the response
        })
        .then(data => {
          if (Object.keys(data).length != 0) {
            fetch(`http://localhost:8000/classroom/create_room/?room_name=${room_name}&teacher_id=${teacher_id}`)
            .then(response => response.json()) // Parse the JSON from the response
            .then(data => {
                console.log('Success:', data); // Handle the data
            })
            .catch((error) => {
                console.error('Error:', error); // Handle errors
            });
            res.redirect(`http://localhost:3000/?room=${room_name}`)
          }else{
            res.render(`error`)
          }
        })
        .catch(error => {
          console.error('Error fetching data:', error); // Handle errors
          // Optionally, handle specific errors differently
          if (error instanceof TypeError) {
            console.error('Received non-JSON response');
          } else {
            console.error('Network or other error');
          }
        });
})

app.get('/', (req, res) => {
  if (req.query.type == "join") {
    fetch('http://localhost:8000/classroom/is_link_reachable/?room_id='+req.query.room)
        .then(response => {
          if (!response.ok) {
            // If response is not ok (e.g., 404 or 500), throw an error
            throw new Error('Network response was not ok ' + response.statusText);
          }
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            // If response is not JSON, throw an error
            throw new TypeError("Received response is not JSON");
          }
          return response.json(); // Attempt to parse JSON from the response
        })
        .then(data => {
          if (data['is_reachable'] == "false") {
            res.render(`error`)
          }else{
            res.render('room', { roomId: req.query.room })
          }
        })
        .catch(error => {
          console.error('Error fetching data:', error); // Handle errors
          // Optionally, handle specific errors differently
          if (error instanceof TypeError) {
            console.error('Received non-JSON response');
          } else {
            console.error('Network or other error');
          }
        });
  }else{
    res.render('room', { roomId: req.query.room })
  }
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})

server.listen(3000)