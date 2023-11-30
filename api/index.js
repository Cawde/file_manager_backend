const express = require('express');
const apiRouter = express.Router();

const usersRouter = require('./users');
apiRouter.use('/users', usersRouter);

apiRouter.use((error, req, res, next) => {
    res.send(error);
});

module.exports = apiRouter;