function getFile(file){
    var fs = require('fs');
    if (fs.existsSync(file)) {
        return require(file);
    }else{
        return process.env;
    }
}

module.exports = getFile("./config.json");
