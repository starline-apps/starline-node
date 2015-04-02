var AWS = require('aws-sdk');
var config = require("./config.js");

var Auth0 = require('auth0');

var api = new Auth0({
	domain: config.auth0Domain,
	clientID: config.auth0ClientID,
	clientSecret: config.auth0ClientSecret
});


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
		            }

		            res.send(200);
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


