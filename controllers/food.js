const getFoodRecommendations = (db) => (req, res) => {
    const { name } = req.body;
    const matchString = name + '%'
    db.any('SELECT name,unit,calories,number FROM food WHERE name LIKE $1', [matchString])
        .then(data => {
            res.json(data)
        })
}

const getFood = (db) => (req, res) => {
    const { foodId } = req.body
    if (!foodId) {
        res.status(422).json('no food id provided')
    } else {
        db.any('SELECT * FROM food WHERE id = $1', [foodId])
        .then(data => {
            res.json(data)
        })
    }
}

module.exports = {
    getFood: getFood,
    getFoodRecommendations: getFoodRecommendations
}