var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
AWS.config.update({region: 'us-east-1'});
var dynamodb = new AWS.DynamoDB();
var fs = require("fs");

function getFile(file){
    return fs.readFileSync(file, { encoding: 'utf8' });
}
function getStorage(file){
    return JSON.parse(getFile("./files/storage/"+file+".json"));
}
function setStorage(file, data){
    fs.writeFile("./files/storage/"+file+".json", JSON.stringify(data), { encoding: 'utf8' });
}
function getTemplate(file){
    return JSON.parse(getFile("./files/templates/"+file+".json"));
}

module.exports = {
    update: function (req, res, next) {
        if (req.body != undefined){
            if (req.body.status_pagamento!= undefined && req.body.email_consumidor!= undefined){
                if (req.body.status_pagamento.toString()==="1"){
                    var params = {
                        TableName: 'Users',
                        Key: {
                            "UserEmail": {
                                "S": req.body.email_consumidor
                            }
                        },
                        AttributeUpdates: {
                            "IsSubscribed": {
                                Action: 'PUT',
                                Value: {
                                    N: '1'
                                }
                            }

                        },
                        ReturnValues: 'UPDATED_NEW'
                    };
                    dynamodb.updateItem(params, function(err, data) {
                        if (err){
                            console.log(err, err.stack); // an error occurred
                            res.send(401);
                        }
                        else{
                            console.log(data);           // successful response
                            res.send(200);
                        }
                    });
                }
            }
        }

    },
    get: function (req, res, next) {

        var params = {
            TableName : 'Users',
            Key : {
                "UserEmail" : {
                    "S" : req.params.email
                }
            }
        }
        dynamodb.getItem(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     res.json(data);           // successful response
        });
    },
    getActiveUsers : function(req, res, next){
        var arr = [];
        var lastWritten, interval;
        var now = Math.round(+new Date()/1000);
        dynamodb.scan({
            TableName : 'Users'
        }, function(err, data) {
            if (err) { console.log(err); return; }


            interval = 2628000;
            console.log( (now - interval));
            for (var ii in data.Items) {

                lastWritten = parseInt(data.Items[ii].LastWritten.N);

                if (lastWritten > (now - interval)){

                    arr.push(data.Items[ii]);
                }


            }
            res.json(arr);
        });
    },
    getActiveUsersLength : function(req, res, next){
        var arr = [];
        var lastWritten, interval;
        var now = Math.round(+new Date()/1000);
        dynamodb.scan({
            TableName : 'Users'
        }, function(err, data) {
            if (err) { console.log(err); return; }
            var ctAll = 0;
            var ct = 0;
            interval = 2628000;
            console.log( (now - interval));
            for (var ii in data.Items) {

                lastWritten = parseInt(data.Items[ii].LastWritten.N);
                ctAll++;
                if (lastWritten > (now - interval)){

                    arr.push(data.Items[ii]);
                    ct++;
                }


            }
            res.json({max:{value:ctAll}, min:{value:0} ,item:ct});
        });
    },
    getAppleIngestionMonthly: function (req, res, next) {

        var date = (req.params.date==undefined) ? "201501" : req.params.date;

        var year = date.substr(0,4);
        var month = date.substr(4,2);

        var autoingestion = require("apple-autoingestion").AutoIngestion({
            username: "applereport@starlinetecnologia.com.br",
            password: "T%u8Hx90",
            vendorId: "86119770"
        });

        autoingestion.downloadSalesReport("Monthly", "Sales", "Summary", date, "./files", function (error, filePath) {
            var storage = getStorage("apple-ingestion-monthly");
            var template = getTemplate("highchart");

            if (!error) {

                date = year+"/"+month;

                var arr = getFile(filePath).split("\n");

                fs.unlink(filePath, function (err) {
                    if (err) throw err;
                });
                fs.unlink(filePath+".gz", function (err) {
                    if (err) throw err;
                });

                var unitIndex = 0;
                var identifierIndex = 0;

                var arrHeaders = arr[0].split("\t");

                for (var x=0 ; x<arrHeaders.length ; x++){
                    if (arrHeaders[x].toLowerCase()=="units"){
                        unitIndex = x;
                    }else if (arrHeaders[x].toLowerCase()=="product type identifier"){
                        identifierIndex = x;
                    }
                }

                var totalUnits = 0;

                for (var x=1 ; x<arr.length ; x++){
                    var arrValues = arr[x].split("\t");

                    if (arrValues[identifierIndex]=="1F"){
                        totalUnits += parseInt(arrValues[unitIndex]);
                    }
                }

                storage[date] = totalUnits;

                setStorage("apple-ingestion-monthly", storage);


            } else {
                console.log("Error: " + error);
            }

            template.title.text = "Downloads Mensais Apple Store";
            template.series[0].name = "Quantidade de Downloads";

            for (var key in storage){
                template.series[0].data.push(storage[key]);
                template.xAxis.categories.push(key);
            }
            res.json(template);
        });

    },
    getGradeByMonth: function (req, res, next) {
        var storage = getStorage("grade-by-month");
        res.json(storage);
    }

}
