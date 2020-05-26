const getEntry = (db) => (req, res) => {
    const user = req.user
    const { date } = req.body;
    db.tx(async t => {
        const entryData = await db.any('SELECT id, calorie_goal FROM entries WHERE user_id = $1 AND date = $2::date',
            [user.id, date])
        let entry = (entryData.length === 0) ?
            await createEntry(user.id, date) : entryData[0]

        const foods = await db.any('SELECT id,name,unit,calories,number FROM food WHERE entry_id = $1',
            [entry.id])
        return { foods, calorieGoal: entry.calorie_goal }
    }).then(data => res.json(data))
        .catch(err => {
            console.log("error: ", err)
            res.json({
                status: -1,
                error: 'Sorry! There was a server error. Please try again'
            })
        })
}


const logFood = (db) => (req, res) => {
    const user = req.user
    const { name, unit, calories, quantity, date } = req.body;
    getEntryId(user.id, date, db)
        .then(entryId => {
            db.none('INSERT INTO food(name, unit, calories, number, entry_id) VALUES ($1, $2, $3, $4, $5)',
                [name, unit, calories, quantity, entryId])
                .then(() => res.end('success'))
                .catch(error => {
                    console.log(error)
                })
        })
}

const deleteFoodFromEntry = (db) => (req, res) => {
    const { id } = req.body;
    db.any('DELETE FROM food WHERE id = $1', [id])
        .then(() => res.end())
        .catch(err => console.log)
}

const createEntry = async (userId, date) => {
    try {
        const userData = await db.one('SELECT daily_caloric_goal FROM users WHERE id = $1', [userId])
        const calorieGoal = userData.daily_caloric_goal
        const entry = await db.one('INSERT into entries(user_id, date, calorie_goal) VALUES ($1, $2, $3) RETURNING *',
            [userId, date, calorieGoal])
        return entry
    } catch (err) {
        console.log(err)
    }
}

const getEntryId = async (userId, date, db) => {
    try {
        const data = await db.any('SELECT id FROM entries WHERE user_id = $1 AND date = $2::date',
            [userId, date])
        return (data.length != 0) ? data[0].id : -1
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    getEntry: getEntry,
    logFood: logFood,
    deleteFoodFromEntry: deleteFoodFromEntry
}