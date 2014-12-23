var io = require('socket.io').listen(3000);
var redis = require('redis');
var client = redis.createClient();

io.on('connection', function(socket) {
    client.hgetall('citys', function(err, citys) {
        console.log(citys);
        socket.emit('serverOk', citys);
    });
    client.set('user', socket.id, function() {
        client.get('user', function(error, data) {
            console.log(data);
        });
    });

    //用户
    socket.on('BusWantedF', function(data) {
        console.log('用户需要' + data.city + '的' + data.busNo + '路车的数据');
        var busSetId = data.city + ':' + data.busNo;
        console.log(busSetId);
        client.smembers(busSetId, function(error, data){
            console.log(data);
            // for (bus in data) {
            //     console.log(bus);
            // }
        });

        // var initData = 
        var room = data.city+''+data.busNo;
        console.log('用户入房间' + room);
        socket.join(room);
    });


    //Bus
    socket.on('MyInfo', function(data) {
        console.log('ID:' + data.myBusId + 'city:' + data.city + 'Line:' 
            + data.myBusLine + "loc" + data.myLoc.locLong + ',' + data.myLoc.locLat );
        locInfo = data.myLoc.locLong + ',' + data.myLoc.locLat;
        console.log('增加一条数据');

        client.zadd(data.myBusId, new Date().getTime(), locInfo);
        var room = data.city+''+data.myBusLine;
        console.log('公交车加入房间' + room);
        socket.join(room);
        io.to(room).emit('BusLocF', data.myLoc);
    });
    socket.on('disconnect', function() {});
});
