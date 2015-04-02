var router = require("express").Router();

module.exports = function(app) {

    var StatsController = require("./stats");
    router.get('/stats/active-users', StatsController.getActiveUsers);
    router.get('/stats/active-users-length', StatsController.getActiveUsersLength);
    router.get('/stats/apple-ingestion-monthly/:date', StatsController.getAppleIngestionMonthly);
    router.get('/stats/apple-ingestion-monthly', StatsController.getAppleIngestionMonthly);
    router.get('/stats/grade-by-month', StatsController.getGradeByMonth);

    var GerencianetController = require("./gerencianet");
    router.post('/gerencianet/notification', GerencianetController.notification);
    router.get('/gerencianet/notification-info/:notificacao', GerencianetController.getNotificationInfo);
    router.post('/gerencianet/payment-link', GerencianetController.getPaymentLink);
    router.post('/gerencianet/user-free', GerencianetController.setUserFree);

    var Auth0Controller = require("./auth0");
    router.post('/auth0/signup', Auth0Controller.signup);
    router.post('/auth0/change-password', Auth0Controller.changePassword);

    return router;
};