const getUser = (db) => (req, res) => {
    const user = req.user
    db.any('SELECT * FROM users WHERE id = $1', [user.id])
    .then(data => res.json(data[0]))
    .catch(err => console.log(err))
}

const updateUser = (db) => (req, res) => {
    const user = req.user
    const { daily_caloric_goal, date } = req.body
    db.tx(async t => {
        await t.none('UPDATE users SET daily_caloric_goal = $1 WHERE id = $2',
            [daily_caloric_goal, user.id])
        await t.none('UPDATE entries SET calorie_goal = $1 WHERE user_id = $2 AND date >= $3::date',
            [daily_caloric_goal, user.id, date])
    }).then(() => {
        res.json({
            status: 1
        })
    }).catch(err => {
        console.log("error: ", err)
        res.json({
            status: -1,
            error: 'Sorry! There was a server error. Please try again'
        })
    })
}

module.exports = {
    getUser: getUser,
    updateUser : updateUser
}