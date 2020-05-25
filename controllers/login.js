const jwt = require('jsonwebtoken')

const signToken = (id) => {
    const payload = { id }
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2 days' })
}

const checkAuth = (req, res) => {
    const { authorization } = req.headers
    const token = authorization && authorization.split(' ')[1]
    if (token == null) return res.status(401).json({ authorized: 'false'})

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        console.log(err)
        if (err) {
            res.status(401).json({ authorized: 'false' })
        } else {
            console.log('authorized!')
            res.json({ authorized: 'true' })
        }        
    })
}

const loginUser = (db, bcrypt) => (req, res) => {
    const { email, password } = req.body;
    const { authorization } = req.headers
    if (authorization) {
        console.log('checking authorization...')
        checkAuth(req, res)
    } else {
        db.any('SELECT hash FROM login WHERE email = $1', [email])
            .then(data => {
                // handle case of user not existing
                if (data.length == 0) {
                    res.json({
                        status: -1,
                        error: "The username and password combination is incorrect"
                    })
                }
                // check password
                const hash = data[0].hash
                bcrypt.compare(password, hash).then(matched => {
                    if (matched) {
                        db.any('SELECT id FROM users WHERE email = $1', [email])
                            .then(data => {
                                const id = data[0].id
                                const token = signToken(id)
                                // redisClient.set(token, id)
                                res.json({
                                    status: 1,
                                    id: id,
                                    token: token
                                })
                            })
                    } else {
                        res.json({
                            status: -1,
                            error: "The username and password combination is incorrect"
                        })
                    }
                })
            })
    }
}

module.exports = {
    loginUser: loginUser
}

