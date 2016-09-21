var request = require('request'),
    fs = require('fs'),
    q = require('q'),
    crypto = require('crypto'),
    progressbar = require('progress'),
    prettysize = require('prettysize'),
    CONFIG = require('./config');

var m = function(success, status, message, data) {
    return {
        success: success,
        status: status,
        message: message,
        data: data
    }
}

var getList = function(page = 1, size = 30) {
    var defer = q.defer(),
        url = 'https://unsplash.com/napi/photos/curated?page=' + page + '&per_page=' + size + '&order_by=latest';
        // url = 'https://unsplash.com/napi/photos?page=' + page + '&per_page=' + size + '&order_by=latest';
    if (!CONFIG.authId) {
        defer.reject(m(0, 'NO AUTH ID', '没有AUT ID'));
    } else {
        var finish = function(err, res, body) {
            if (!err && res.statusCode == 200) {
                var data = JSON.parse(body),
                    list = [];
                data.forEach(function(item) {
                    list.push(item.urls.raw);
                });
                var result = {
                    error: err,
                    response: res,
                    body: body,
                    list: list
                }
                if (res.caseless.dict['link']) {
                    result.maxPage = res.caseless.dict['link'].match(/.*page=(\d+)&.+rel="last"/)[1];
                }
                defer.resolve(m(1, 'SUCCESS', '拉取成功', result));
            } else {
                var errmsg = "获取列表失败",
                    errcode = "ERROR";
                if (err) {
                    errcode = err.code;
                    errmsg += '(' + err.code + ')';
                } else if (res) {
                    errcode = res.statusCode;
                    errmsg += '(' + res.statusCode + ')';
                }
                defer.reject(m(0,  errcode , errmsg, {
                    error: err,
                    response: res,
                    body: body
                }));
            }
        }
        var req = request({
            url: url,
            headers: {
                'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36",
                'Referer': "https://unsplash.com/new",
                'authorization': "Client-ID " + CONFIG.authId
            },
            timeout: 10000
        }, finish);
        req.on('response', function(response) {
            // console.log(response.caseless.dict['link']);
        });
        req.on('data', function(data) {
            // console.log(data);
        });
    }
    return defer.promise;
}


var getImg = function(url, showProgress = true) {
    var defer = q.defer(),
        md5 = crypto.createHash('md5'),
        fileName = md5.update(url).digest('hex') + '.jpg',
        savePath = CONFIG.downloadDir + '/' + fileName;
    result = {
        url: url,
        file: fileName,
        path: savePath
    };
    if (fs.existsSync(savePath)) {
        defer.reject(m(0, 'file exists', '[ ' + fileName + ' ] 文件已存在', result));
    } else {
        var down = request(url, {
            // timeout : 5000
        }, function() {

        });
        down.on('response', function(data) {
            result.size = parseInt(data.headers['content-length'], 10);
            result.data = data;
            if (showProgress) {
                var loaded = 0,
                    bar = new progressbar(' | 下载 ' + prettysize(result.size) + ' ( :percent )->[:bar] :current /:total - :etas', {
                        // bar = new progressbar(' | 下载 :percent ->[:bar] :etas - :loadedSize/:fileSize', {
                        complete: '=',
                        incomplete: ' ',
                        width: 32,
                        total: result.size
                    });
                down.on('data', function(data) {
                    loaded = loaded + data.length;
                    bar.tick(data.length);
                    // bar.tick({
                    //     'loadedSize' : prettysize(loaded, false),
                    //     'fileSize' : prettysize(result.size, false),
                    // });
                });
            }
        });
        down.on('end', function() {
            defer.resolve(m(1, 200, '[ ' + fileName + ' ] 下载成功', result));
        });
        var downPath = savePath + '.download',
            write = fs.createWriteStream(downPath);
        write.on('close', function() {
            console.log('load end');
            fs.renameSync(downPath, savePath);
        });
        down.pipe(write);

    }
    return defer.promise;
}


module.exports = {
    getList: getList,
    getImg: getImg
}


// getImg('https://images.unsplash.com/photo-1474366631989-a06d47394368').then(function(d){
//     console.log(d);
// }).fail(function(d){
//     console.log(d);
// }).done(function(d){
//     console.log(d);
// });