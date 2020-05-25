const SALT_ROUNDS = 10

const registerUser = (db, bcrypt) => (req, res) => {
    const { email, password, daily_caloric_goal } = req.body
    // see if user exists
    db.any('SELECT * FROM users WHERE email = $1', [email])
        .then(data => {
            if (data.length > 0) {
                res.json({
                    status: -1,
                    error: 'User with this email already exists'
                })
            } else {
                // create user
                bcrypt.genSalt(SALT_ROUNDS, (err, salt) => {
                    bcrypt.hash(password, salt, (err, hash) => {
                        db.tx(async t => {
                            await t.none('INSERT INTO login(email, hash) VALUES ($1, $2)',
                                [email, hash])
                            await t.none('INSERT INTO users(email, daily_caloric_goal) VALUES ($1, $2)',
                                [email, daily_caloric_goal])
                        }).then(() => {
                            console.log("successfully created new user")
                            res.json({
                                status: 1
                            })
                        }).catch(err => {
                            console.log("ERROR on creating user: ", err)
                            res.json({
                                status: -1,
                                error: 'Sorry! There was a server error. Please try again'
                            })
                        })
                    })
                })
            }
        }).catch(err => {
            console.log("ERROR: ", err)
            res.json({
                status: -1,
                error: 'Sorry! There was a server error. Please try again'
            })
        })
}

module.exports = {
    registerUser: registerUser
}