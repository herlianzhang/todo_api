const express = require('express')
const app = express()
const sqlite3 = require('sqlite3').verbose()
const db = getDatabase()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS todo (id INTEGER PRIMARY KEY, title TEXT, desc TEXT, created_date TEXT, deadline_date TEXT)')

    db.close()
})

var createMiddleware = (req, res, next) => {
    res.setHeader('Content-Type', 'application/json')

    var title = req.body.title
    var desc = req.body.desc
    var created_date = req.body.created_date
    var deadline_date = req.body.deadline_date


    if (title == null) {
        return returnError(res, 'title can\'t be null')
    }

    if (desc == null) {
        return returnError(res, 'desc can\'t be null')
    }

    if (created_date == null) {
        return returnError(res, 'created_date can\'t be null')
    }

    if (deadline_date == null) {
        return returnError(res, 'deadline_date can\'t be null')
    }

    req.title = title
    req.desc = desc
    req.created_date = created_date
    req.deadline_date = deadline_date

    next()
}

var updateMiddleware = (req, res, next) => {
    res.setHeader('Content-Type', 'application/json')

    var id = req.body.id
    var title = req.body.title
    var desc = req.body.desc
    var created_date = req.body.created_date
    var deadline_date = req.body.deadline_date

    if (id == null) {
        return returnError(res, 'required id to update')
    }

    if (title == null && desc == null && created_date == null && deadline_date == null) {
        return returnError(res, 'you need at least 1 data to update')
    }

    req.id = id
    req.title = title
    req.desc = desc
    req.created_date = created_date
    req.deadline_date = deadline_date

    next()
}

var deleteMiddleware = (req, res, next) => {
    res.setHeader('Content-Type', 'application/json')

    var id = req.body.id

    if (id == null) {
        return returnError(res, 'required id to delete')
    }

    req.id = id

    next()
}



function getDatabase() {
    return new sqlite3.Database(':todo:', (err) => {
        if (err) {
            return console.error(err.message)
        }
        console.log('Connected to the in-memory SQlite database.')
    })
}

function returnError(res, message, errorCode = 400) {
    // res.sendStatus(errorCode)
    res.status(errorCode)
    res.end(JSON.stringify({
        'status': false,
        'error': message
    }))
}

app.get('/todolist', (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    var db = getDatabase()

    var sql = 'SELECT * from todo ORDER BY id'
    db.all(sql, [], (err, rows) => {
        if (err) {
            returnError(res, err.message)
        }
        var list = []
        rows.forEach((row) => {
            list.push(
                {
                    'id': row.id,
                    'title': row.title,
                    'desc': row.desc,
                    'created_date': row.created_date,
                    'deadline_date': row.deadline_date
                }
            )
            console.log(`title ${row.title}, desc ${row.desc}`)
        })
        res.send({
            'status': true,
            'data': list
        })
    })
    db.close()
})

app.post('/create_new_todo', createMiddleware, (req, res) => {
    var title = req.title
    var desc = req.desc
    var created_date = req.created_date
    var deadline_date = req.deadline_date

    console.log(`title ${title}, desc ${desc}, created_date ${created_date}, deadline_date ${deadline_date}`)
    var db = getDatabase()

    var sql = 'INSERT INTO todo (title, desc, created_date, deadline_date) VALUES(?,?,?,?)'
    var params = [title, desc, created_date, deadline_date]

    db.run(sql, params, (err) => {
        if (err) {
            return returnError(res, err.message)
        }

        res.status(200)
        res.send({
            'status': true,
            'data': {
                'title': title,
                'desc': desc,
                'created_date': created_date,
                'deadline_date': deadline_date,
            }
        })
    })
    db.close()
})

app.post('/update_todo', updateMiddleware, (req, res) => {
    var id = req.id
    var title = req.title
    var desc = req.desc
    var created_date = req.created_date
    var deadline_date = req.deadline_date

    var db = getDatabase()

    var params = []
    var sql = 'UPDATE todo SET '
    if (title != null) {
        params.push(title)
        sql += 'title = ?, '
    }
    if (desc != null) {
        params.push(desc)
        sql += 'desc = ?, '
    }
    if (created_date != null) {
        params.push(created_date)
        sql += 'created_date = ?, '
    }
    if (deadline_date != null) {
        params.push(deadline_date)
        sql += 'deadline_date = ?, '
    }
    sql = sql.substring(0, sql.length - 2)
    sql += ` WHERE id = ${id}`

    db.run(sql, params, (err) => {
        if (err) {
            return returnError(res, err.message)
        }

        res.status(200)
        res.send({
            'status': true,
            'data': `success update todo with id ${id}`
        })
    })
    db.close()
})

app.post('/delete_todo', deleteMiddleware, (req, res) => {
    var id = req.id

    var db = getDatabase()

    var params = [id]
    var sql = 'DELETE FROM todo WHERE id = ?'
    
    db.run(sql, params, (err) => {
        if (err) {
            return returnError(res, err.message)
        }

        res.status(200)
        res.send({
            'status': true,
            'data': `success delete todo with id ${id}`
        })
    })
    db.close()
})

app.listen(3000)
