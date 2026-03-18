//authorization for json web token
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    //get token from header
    const authHeader = req.headers['authorization'];

    //checking for bearer prefix
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }
    const token = authHeader.split(" ")[1];

    //verify token
    try {
        const decoded = jwt.verify(token, process.env.JWTSECRET); //verfiying token
        req.user = decoded.id; //storing user id in req.user
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
}

