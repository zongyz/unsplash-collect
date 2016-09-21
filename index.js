var q = require('q'),
    fs = require('fs'),
    CONFIG = require('./config'),
    echo = require('./echo'),
    unsplash = require('./unsplash');

var listTask = function() {
    echo("\n准备开始unsplash图片数据拉取任务");
    var defer = q.defer(),
        list = [];
        thisPage = 1,
        maxPage = CONFIG.maxPage,
        loop = function() {
            echo('- 开始拉取第[ ' + thisPage + ' / ' + maxPage + ' ]页');
            unsplash.getList(thisPage, 30).then(function(result) {
                var data = result.data;
                list = list.concat(data.list);
                echo('| - 已成功拉取[ ' + list.length + ' ]条数据, 本次新增[ ' + data.list.length + ' ]条 ( ✔ )');
                if (CONFIG.autoMaxPage && data.maxPage && data.maxPage != maxPage) {
                    maxPage = data.maxPage;
                    echo('(!!!) 自动更新最大页数为[ ' + data.maxPage + ' ]');
                }
                if (thisPage < maxPage) {
                    thisPage++;
                    loop();
                } else {
                    defer.resolve(list);
                }
            }).catch(function() {
                echo(' - 出错了 ( × )');
            });
        };
    echo('(~) 开始页数:[ ' + thisPage + ' ], 最大页数: [ ' + maxPage + ' ], 自动更新最大页: [' + CONFIG.autoMaxPage + ']');
    loop();
    return defer.promise;
}

var imgTask = function() {
    echo("\n准备开始图片下载任务");
    var data = fs.readFileSync(CONFIG.listCacheFile),
        list = data.toString().split("\n"),
        defer = q.defer();
    if (!list.length) {
        echo('没有图片列表缓存 ( × )');
        defer.reject();
        return defer.promise;
    }
    var loop = function() {
        if (list.length) {
            var url = list.shift();;
            echo('- 开始下载[ ' + url + ' ], 剩余[ ' + list.length + ' ]条');
            unsplash.getImg(url).then(function(result) {
                console.log(' | - ' + result.message);
            }).catch(function(result) {
                console.log(' | - ERR: ' + result.message);
            }).done(function() {
                loop();
            });
        } else {
            // defer.resolve();
        }
    }
    loop();
    return defer.promise;
}

var init = function() {

    echo('(~) 当前AuthID: [ ' + CONFIG.authId + ' ]');
    if (!fs.existsSync(CONFIG.listCacheFile)) {
        echo('(×) 列表缓存[ ' + CONFIG.listCacheFile + ' ]不存在，请先拉取图片列表');
    }else{
        echo('(~) 列表缓存: [ ' + CONFIG.listCacheFile + ' ]');
    }
    if (!fs.existsSync(CONFIG.downloadDir)) {
        echo('(!) 下载目录[ ' + CONFIG.downloadDir + ' ]不存在，已自动创建');
        fs.mkdirSync(CONFIG.downloadDir);
    }else{
        echo('(~) 下载目录: [ ' + CONFIG.downloadDir + ' ]');
    }
}

init();
listTask().then(function(list) {
    fs.writeFileSync(CONFIG.listCacheFile ,list.join("\n"));//将文件列表写入缓存
    echo('(✔)列表拉取完成, 共[ ' + list.length + ' ]条');

    imgTask().then(function(data) {
        echo('全部图片下载完成');
    });
});