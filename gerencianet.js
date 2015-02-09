var AWS = require('aws-sdk');
var config = require("./config.js");
AWS.config.update({
    accessKeyId: config.AmazonAccessKeyId,
    secretAccessKey: config.AmazonSecretAccessKey,
    region: config.AmazonRegion
});
var dynamodb = new AWS.DynamoDB();
var request = require('request');

module.exports = {
    notification: function (req, res, next) {
        if (req.body != undefined){
            var timestamp = Math.floor(Number(new Date()) / 1000).toString();

            var params = {
                TableName: 'PaymentLOg',
                Item: {
                    "Data": {
                        "S": JSON.stringify(req.body)
                    },
                    "timestamp": {
                        "N": timestamp
                    }
                }
            };
            dynamodb.putItem(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                }
            });


            if (req.body.notificacao!= undefined){
                request.post({
                        headers: {'content-type' : 'application/x-www-form-urlencoded'},
                        url:config.GerenciaNetUrlNotificationInfo,
                        body:"token=" + config.GerenciaNetToken + "&dados="+JSON.stringify({"notificacao":req.body.notificacao})
                    },
                    function (error, response, body) {
                        if (!error && response.statusCode == 200) {

                            body = JSON.parse(body);


                            if (body.resposta != undefined) {
                                if (body.resposta.codigoStatus != undefined) {
                                    if (body.resposta.identificador != undefined) {
                                        if (body.resposta.codigoStatus.toString()=="5"){
                                            var arr = body.resposta.identificador.split(";");

                                            var email = arr[0];
                                            var code = arr[1];
                                            var plan = require("./plans.json");

                                            if (plan[code]!=undefined){
                                                plan = plan[code];

                                                var credits = plan.credits;
                                                var d = new Date();
                                                d.setMonth(d.getMonth() + parseInt(plan.periodicity));
                                                var expiration = Math.floor(d.getTime() / 1000).toString();

                                                var params = {
                                                    TableName: 'Users',
                                                    Key: {
                                                        "UserEmail": {
                                                            "S": email
                                                        }
                                                    },
                                                    AttributeUpdates: {
                                                        "IsSubscribed": {
                                                            Action: 'PUT',
                                                            Value: {
                                                                N: '1'
                                                            }
                                                        },
                                                        "LastWritten": {
                                                            Action: 'PUT',
                                                            Value: {
                                                                N: timestamp
                                                            }
                                                        },
                                                        "SubscriptionExpirationDate": {
                                                            Action: 'PUT',
                                                            Value: {
                                                                N: expiration
                                                            }
                                                        },
                                                        "LastModifiedBy": {
                                                            Action: 'PUT',
                                                            Value: {
                                                                S: 'web'
                                                            }
                                                        },
                                                        "CreditBalance": {
                                                            Action: 'PUT',
                                                            Value: {
                                                                N: credits
                                                            }
                                                        }

                                                    },
                                                    ReturnValues: 'UPDATED_NEW'
                                                };

                                                dynamodb.updateItem(params, function(err, data) {
                                                    if (err){
                                                        res.send(401, err);
                                                    }
                                                    else{
                                                        res.send(200);
                                                    }
                                                });


                                            }else {
                                                res.json(401,{erro:"Plano inválido"});
                                            }
                                        }else{
                                            res.json(200,{msg:"Recebido (Status " +body.resposta.codigoStatus.toString()+ ")"});
                                        }
                                    } else {
                                        res.json(401,{erro:"Dados não enviados (identificador)"});
                                    }
                                } else {
                                    res.json(401,{erro:"Dados não enviados (codigoStatus)"});
                                }
                            } else {
                                res.json(401,{erro:"Dados não enviados (resposta)"});
                            }


                        } else {
                            res.json(401, error);
                        }
                    }
                );
            }else{
                res.json(401, {erro:"Notifiçaçao não enviada"});
            }
        }else{
            res.json(401, {erro:"Dados não enviados"});
        }

    },
    getNotificationInfo: function (req, res, next) {
        if (req.params != undefined){
            if (req.params.notificacao!= undefined){
                request.post({
                        headers: {'content-type' : 'application/x-www-form-urlencoded'},
                        url:config.GerenciaNetUrlNotificationInfo,
                        body:"token=" + config.GerenciaNetToken + "&dados="+JSON.stringify({"notificacao":req.params.notificacao})
                    },
                    function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            res.json(200, JSON.parse(body));
                        } else {
                            res.json(401, error);
                        }
                    }
                );
            }else{
                res.json(401, {erro:"Notifiçaçao não enviada"});
            }
        }else{
            res.json(401, {erro:"Dados não enviados"});
        }

    },
    getPaymentLink: function (req, res, next) {
        if (req.body != undefined){
            if (req.body.email!= undefined){
                if (req.body.code!= undefined) {
                    var code = req.body.code;
                    var email = req.body.email;
                    var timestamp = Number(new Date()).toString();
                    var plan = require("./plans.json");

                    if (plan[code]!=undefined){
                        plan = plan[code];

                        var data = {
                            "itens": [{"itemValor": parseInt(plan.value), "itemDescricao": plan.description}],
                            "periodicidade": plan.periodicity,
                            "retorno": {
                                "urlNotificacao": config.GerenciaNetUrlToBeNotificated,
                                "urlRedirect": config.GerenciaNetUrlToBeRedirected,
                                "identificador": email + ";" + code + ";" + timestamp
                            },
                            "cliente": {
                                "email": email
                            }
                        };

                        if (plan.recurrent){
                            var urlPayment = config.GerenciaNetUrlRecurrentPayment;
                        }else{
                            var urlPayment = config.GerenciaNetUrlPayment;
                        }

                        request.post({
                                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                                url:urlPayment,
                                body:"token=" + config.GerenciaNetToken + "&dados="+JSON.stringify(data)
                            },
                            function (error, response, body) {
                                if (!error && response.statusCode == 200) {

                                    body = JSON.parse(body);

                                    if (body.resposta!=undefined){
                                        if (body.resposta.link!=undefined){
                                            res.json({link:body.resposta.link});
                                        }else{
                                            res.json(body);
                                        }
                                    }else{
                                        res.json(body);
                                    }


                                }else{
                                    res.json(error);
                                }
                            }
                        );


                    }else{
                        res.json({erro:"Plano inválido"});
                    }


                }else{
                    res.json({erro:"Código não enviado"});
                }

            }else{
                res.json({erro:"E-mail não enviado"});
            }
        }else{
            res.json({erro:"Dados não enviados"});
        }

    },




};


