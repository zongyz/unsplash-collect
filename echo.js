module.exports = function(content, time = true) {
    var date = new Date();
    var output = '';
    // if(time) output += '[' + date.getHours() + ':' + date.getSeconds() + '] ';
    output += content;
    console.log(output);
}