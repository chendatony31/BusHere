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
        console.log('用户需要' + data + '路车的数据');
        socket.join(data);
    });





    //Bus
    socket.on('MyLocF', function(data) {
        console.log('re' + data.myId + "loc" + data.myLoc.locLong + ',' + data.myLoc.locLat);
        clent.LPUSH
        var num = "no_" + data.myId;
        socket.join(data.myId);
        io.to(data.myId).emit('BusLocF', data);
    });


    socket.on('disconnect', function() {});
});
