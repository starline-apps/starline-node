var AWS = require('aws-sdk');
var config = require("./config.js");

var Auth0 = require('auth0');

var api = new Auth0({
	domain: config.auth0Domain,
	clientID: config.auth0ClientID,
	clientSecret: config.auth0ClientSecret
});
AWS.config.update({
	accessKeyId: config.AmazonAccessKeyId,
	secretAccessKey: config.AmazonSecretAccessKey,
	region: config.AmazonRegion
});
var dynamodb = new AWS.DynamoDB();

module.exports = {
    signup: function (req, res, next) {
        if (req.body != undefined){

            if (req.body.email!= undefined){
	            var newUser = {
		            email:          req.body.email,
		            password:       req.body.password,
		            connection:     'Username-Password-Authentication'
	            };
	            api.createUser(newUser, function (err, userInfo) {
		            if (err) {
			            console.log('Error creating user: ' + err);
			            res.json(401, {erro:"Unable to save"});
		            }else{
			            var plan = require("./plans.json");
			            plan = plan[101];

			            var credits = plan.credits;
			            var d = new Date();
			            d.setMonth(d.getMonth() + parseInt(plan.periodicity));
			            var expiration = Math.floor(d.getTime() / 1000).toString();
			            var timestamp = Math.floor(Number(new Date()) / 1000).toString();
			            var params = {
				            TableName: 'Users',
				            Key: {
					            "UserEmail": {
						            "S": req.body.email
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
					            "Data": {
						            Action: 'PUT',
						            Value: {
							            S: "{}"
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
		            }
	            });

            }else{
                res.json(401, {erro:"Dados inválidos"});
            }
        }else{
            res.json(401, {erro:"Dados não enviados"});
        }

    },
	changePassword: function (req, res, next) {
		if (req.body != undefined){

			if (req.body.userId!= undefined){

				api.updateUserPassword(req.body.userId, req.body.password, false, function (err, result) {
					if (err) {
						console.log('Error updating password: ', + err);
						res.json(401, {erro:"Unable to change"});
					}
					res.send(200);
				});



			}else{
				res.json(401, {erro:"Dados inválidos"});
			}
		}else{
			res.json(401, {erro:"Dados não enviados"});
		}

	}



};


