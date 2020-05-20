const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const pgp = require('pg-promise')();
const bcrypt = require('bcryptjs');
//const cn = require('./config')
const SALT_ROUNDS = 10

/* postgres config */

const cn = {
    connectionString: process.env.DATABASE_URL
    /* port: 5432,
    database: 'test',
    user: 'john',
    password: 'Football55', */
}; 
const db = pgp(cn)

/* express config */
const app = express()
const port = 5000
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send('welcome to the index page')
})


app.post('/getFoodRecommendations', (req, res) => {
    const { name } = req.body;
    console.log(name)
    const matchString = name + '%'
    db.any('SELECT name,unit,calories,number FROM food WHERE name LIKE $1', [matchString])
        .then(data => {
            console.log("data: ", data)
            res.json(data)
        })
})


app.post('/addFoodToEntry', (req, res) => {
    const { name, unit, calories, number, date, user_id } = req.body;
    getEntryId(user_id, date)
        .then(id => {
            const entry_id = (id != -1) ? id : createEntry(user_id, date)
            db.none('INSERT INTO food(name, unit, calories, number, entry_id) VALUES ($1, $2, $3, $4, $5)',
                [name, unit, calories, number, entry_id])
                .then(() => res.end('success'))
                .catch(error => {
                    console.log(error)
                })
        })
})

app.post('/deleteFoodFromEntry', (req, res) => {
    const { id } = req.body;
    db.any('DELETE FROM food WHERE id = $1', [id])
        .then(() => res.end())
        .catch(err => console.log)
})

const createEntry = (user_id, date) => {
    db.one('INSERT into entries(user_id, date) VALUES ($1, $2) RETURNING id',
        [user_id, date])
        .then(data => data.id)
        .catch(err => console.log(err))
}

const getFoodForEntry = async (entry_id) => {
    try {
        const foods =
            await db.any('SELECT id,name,unit,calories,number FROM food WHERE entry_id = $1',
                [entry_id])
        return foods;
    } catch (err) {
        console.log(err)
    }
}

const getEntryId = async (user_id, date) => {
    try {
        const data = await db.any('SELECT id FROM entries WHERE user_id = $1 AND date = $2', [user_id, date])
        return (data.length != 0) ? data[0].id : -1
    } catch (err) {
        console.log(err)
    }
}

app.post('/getEntry', (req, res) => {
    const { user_id, date } = req.body;
    getEntryId(user_id, date)
        .then(id => {
            console.log("entry id returned: ", id)
            const entry_id = (id != -1) ? id : createEntry(user_id, date)
            getFoodForEntry(entry_id).then(data => res.json(data))
        })
})

app.post('/getCalorieGoal', (req, res) => {
    console.log("in /getCalorieGoal")
    const { user_id } = req.body;
    db.any('SELECT daily_caloric_goal FROM users WHERE id = $1 LIMIT 1', [user_id])
        .then(data => res.json(data[0]))
        .catch(err => console.log)
})

app.post('/register', (req, res) => {
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
})

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.any('SELECT hash FROM login WHERE email = $1', [email])
        .then(data => {
            // handle case of user not existing
            if (data.length == 0) {
                res.json({
                    id: -1,
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
                            res.json({ id: id })
                        })
                } else {
                    res.json({
                        id: -1,
                        error: "The username and password combination is incorrect"
                    })
                }
            })
        })
})

app.listen(process.env.PORT || port, () => console.log(`Example app listening at http://localhost:${process.env.PORT || port}`))