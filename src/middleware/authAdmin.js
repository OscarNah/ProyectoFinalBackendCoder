function authenticateAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    } else {
        res.status(403).send("Acceso denegado");
    }
}

module.exports = { authenticateAdmin };
