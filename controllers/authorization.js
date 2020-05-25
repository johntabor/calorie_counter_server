const jwt = require('jsonwebtoken')

const requireAuth = (req, res, next) => {
    const { authorization } = req.headers
    const token = authorization && authorization.split(' ')[1]
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      console.log(err)
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
}

module.exports = {
    requireAuth: requireAuth
}