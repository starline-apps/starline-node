var router = require("express").Router();

module.exports = function(app) {
    var NaspController = require("./nasp");

    router.post('/nasp', NaspController.update);
    router.get('/nasp/:email', NaspController.get);

    var StatsController = require("./stats");


    router.get('/stats/active-users', StatsController.getActiveUsers);
    router.get('/stats/active-users-length', StatsController.getActiveUsersLength);
    router.get('/stats/apple-ingestion-monthly/:date', StatsController.getAppleIngestionMonthly);
    router.get('/stats/apple-ingestion-monthly', StatsController.getAppleIngestionMonthly);
    router.get('/stats/grade-by-month', StatsController.getGradeByMonth);

    var GerencianetController = require("./gerencianet");
    router.post('/gerencianet/notification', GerencianetController.notification);
    router.post('/gerencianet/payment-link', GerencianetController.getPaymentLink);


    router.post('/pdf', function(req, res, next){

        var pdf = require('pdfcrowd');

// create an API client instance
        var client = new pdf.Pdfcrowd("starline", "569fc773e99e852a533db736fe5f5de0");


// convert a web page and save it to a file
        client.convertURI('http://beet.cc', pdf.saveToFile("beet.pdf"));

    });


    return router;
};
