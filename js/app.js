(function () {
    console.log(this);

    /************************ 全局变量 ************************/
    var connTimeout = setTimeout("alert('连接服务器超时，请确认网络连接')", 10000);
    var socket = io.connect('http://localhost:3000/');
    var myBaiduPoint;
    var RANGE = 2000;
    var BUSNO;
    var map;
    var busline;
    var localCity;
    var queryCity = '';
    var currentBusNoArr;
    var cityInfo;
    var enableGeo = false;

    socket.on('serverOk', function(data) {
        clearTimeout(connTimeout);

        cityInfo = data;
        var isFirstCity = true;
        for (city in cityInfo) {
            $('#citySelect').append('<option value="' + city + '" >' + city + '</option>');
            if (isFirstCity){
                currentBusNoArr = cityInfo[city].split(',');
                isFirstCity = false;
            }
        }
        for (var i = 0;i < currentBusNoArr.length;i++) {
            $('#busNoSelect').append('<option value="' + currentBusNoArr[i]
                                    + '" >' + currentBusNoArr[i] + '</option>');
        }

        console.log('已连接服务器！');
        locateMe();
    });
    socket.on('disconnect', function() {
        console.log('断开连接');
        alert('连接断开');
    });

    /************************ 定位用户 ************************/
    function locateMe() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
                timeout: 1000
            });
        } else {
            alert('不支持定位,请你选择城市');
            $('#loading').hide();
            initMap();
        }
    }
    function successCallback(position) {
        enableGeo = true;
        var locLong = position.coords.longitude;
        var locLat = position.coords.latitude;
        var myGpsPoint = new BMap.Point(locLong, locLat);
        BMap.Convertor.translate(myGpsPoint, 0, translateCallback); //真实经纬度转成百度坐标
    }
    var translateCallback = function(point) {
        myBaiduPoint = point;
        var geoc = new BMap.Geocoder();
        geoc.getLocation(myBaiduPoint, function(data) {
            var addComp = data.addressComponents;
            localCity = addComp.city;
            $('#citySelect').val(localCity);
            changeCity();
        });
        $('#loading').hide();
        initMap();
    };
    function errorCallback() {
        console.log('定位失败');
        $('#loading').hide();
        initMap();
    }

    /************************ 初始化地图 ************************/
    function initMap() {
        map = new BMap.Map("myMap");
        map.centerAndZoom('北京',15);
        if (enableGeo) {
            map.centerAndZoom(myBaiduPoint, 11);
        }
        else {
            var city = $('#citySelect').val();
            map.centerAndZoom('city',15);
        }
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
        map.enableScrollWheelZoom(true);
        busline = new BMap.BusLineSearch(map, {
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
    }

    /************************ 转换地图 ************************/
    $('#citySelect').on('change', changeCity);

    function changeCity() {
        var city = $('#citySelect').val();
        map.centerAndZoom(city,15);
        updateCityBusNo(city);
    }

    function updateCityBusNo(city) {
        $('#busNoSelect').html('');
        currentBusNoArr = cityInfo[city].split(',');
        for (var i = 0;i < currentBusNoArr.length;i++) {
            $('#busNoSelect').append('<option value="' + currentBusNoArr[i]
                    + '" >' + currentBusNoArr[i] + '</option>');
        }
    }


    /************************ 寻找车辆 ************************/

    $('#queryBtn').on('click', function(e) {
        findBus();
    });

    function findBus() {
        BUSNO = $('#busNoSelect').val();
        
        busline.setPolylinesSetCallback(findingBus);
        busline.getBusList(BUSNO);
    }

    function findingBus() {
        alert('要车的信息');
        queryCity = $('#citySelect').val();
        socket.emit('BusWantedF', {busNo:BUSNO,city:queryCity});
        socket.on('BusLocF', function(data) {
            console.log('收到信号');
            var busGpsPoint = new BMap.Point(data.locLong, data.locLat);
            BMap.Convertor.translate(busGpsPoint, 0, translateCallbackBus);
        });
    }
    var translateCallbackBus = function(point) {
        // var distance = map.getDistance(myBaiduPoint, point);
        // if (distance < RANGE) {
            var marker = new BMap.Marker(point);
            map.addOverlay(marker);
        // }
    };

    console.log(this);

})()
