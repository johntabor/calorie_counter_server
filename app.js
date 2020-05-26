const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const pgp = require('pg-promise')();
const bcrypt = require('bcryptjs');
const cn = require('./config')
const dotenv = require('dotenv')

const login = require('./controllers/login')
const register = require('./controllers/register')
const user = require('./controllers/user')
const auth = require('./controllers/authorization')
const food = require('./controllers/food')
const entry = require('./controllers/entry')

dotenv.config()

/* postgres config */
const db = pgp(cn)

/* express config */
const app = express()
const port = 5000
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())

app.post('/register', register.registerUser(db, bcrypt))
app.post('/login', login.loginUser(db, bcrypt))

app.post('/getUser', auth.requireAuth, user.getUser(db))
app.post('/updateUser', auth.requireAuth, user.updateUser(db))

app.post('/getFood', auth.requireAuth, food.getFood(db))
app.post('/getFoodRecommendations', auth.requireAuth, food.getFoodRecommendations(db))

app.post('/getEntry', auth.requireAuth, entry.getEntry(db))
app.post('/logFood', auth.requireAuth, entry.logFood(db))
app.post('/deleteFoodFromEntry', auth.requireAuth, entry.deleteFoodFromEntry(db))

app.listen(process.env.PORT || port, () => console.log(`Example app listening at http://localhost:${process.env.PORT || port}`))