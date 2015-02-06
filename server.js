var express        = require('express');
var bodyParser     = require('body-parser');
var cookieParser   = require('cookie-parser');
var morgan         = require('morgan');
var methodOverride = require('method-override');
var cors           = require('express-cors');



var app        = express();

app.use(cors({
   allowedOrigins: [
       'https://go.gerencianet.com.br',
       'http://starline.herokuapp.com',
       'http://sgplite.starlinetecnologia.com.br',
       'http://192.168.16.58:9000'
   ]
}));


var port = process.env.PORT || 1313; 		// set our port// load the config


app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser());
app.use(methodOverride());



var router = require('./routes')(app);

app.use('/api', router);


// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);



