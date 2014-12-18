var connTimeout = setTimeout("alert('连接服务器超时，请确认网络连接')", 10000);
var socket = io.connect('http://localhost:3000/');
socket.on('serverOk', function() {
    clearTimeout(connTimeout);
    alert('已经连接到服务器');
    console.log('已连接服务器！');
    locateMe();
});
socket.on('disconnect', function() {
    console.log('断开连接');
    alert('连接断开');
});

var map = new BMap.Map("myMap");
// map.centerAndZoom(new BMap.Point(116.404, 39.915), 11); // 初始化地图,设置中心点坐标和地图级别
// map.addControl(new BMap.MapTypeControl()); //添加地图类型控件
// map.setCurrentCity("北京"); // 设置地图显示的城市 此项是必须设置的
// map.enableScrollWheelZoom(true);
var myBaiduPoint;
var RANGE = 2000;
var BUSNO;
var busline = new BMap.BusLineSearch(map, {
    renderOptions: {
        map: map
    },
    onGetBusListComplete: function(result) {
        if (result) {
            var fstLine = result.getBusListItem(0);
            busline.getBusLine(fstLine);
        }
    }
});

map.addControl(new BMap.ScaleControl({
    anchor: BMAP_ANCHOR_TOP_RIGHT
}));
map.addControl(new BMap.NavigationControl());
var styleJson = [{
    "featureType": "all",
    "elementType": "all",
    "stylers": {
        "lightness": 10,
        "saturation": -100
    }
}];
map.setMapStyle({
    styleJson: styleJson
});

function locateMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
            timeout: 10000
        });
    } else {
        alert('不支持定位,请你选择城市');
        errorCallback();
    }
}

function successCallback(position) {
    var locLong = position.coords.longitude;
    var locLat = position.coords.latitude;
    var myGpsPoint = new BMap.Point(locLong, locLat);
    BMap.Convertor.translate(myGpsPoint, 0, translateCallback); //真实经纬度转成百度坐标
}

function errorCallback() {
    console.log('定位失败');
    alert('无法获取您的地理位置，请选择你的城市');
    document.getElementById('loading').style.display = "none";
}
var translateCallback = function(point) {
    myBaiduPoint = point;
    var geoc = new BMap.Geocoder();
    geoc.getLocation(myBaiduPoint, function(data) {
        var addComp = data.addressComponents;
        alert(addComp.city);
    });
    // map.centerAndZoom(point, 15);
    // map.enableScrollWheelZoom();
    // var marker = new BMap.Marker(point);
    // map.addOverlay(marker);
    document.getElementById('loading').style.display = "none";
};


function findBus() {
    document.getElementById('loading').style.display = "block";
    BUSNO = document.getElementById('busNoSelect').value;

    busline.getBusList(BUSNO);
    busline.setPolylinesSetCallback(findingBus);
}

function findingBus() {

    locateMe();
    socket.emit('BusWantedF', BUSNO);
    socket.on('BusLocF', function(data) {
        console.log('收到信号');
        var busGpsPoint = new BMap.Point(data.myLoc.locLong, data.myLoc.locLat);
        BMap.Convertor.translate(busGpsPoint, 0, translateCallbackBus);
    });
}
var translateCallbackBus = function(point) {
    var distance = map.getDistance(myBaiduPoint, point);
    if (distance < RANGE) {
        var marker = new BMap.Marker(point);
        map.addOverlay(marker);
    }
};
