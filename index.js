const pg = require('pg');
const express = require('express');
const req = require("express/lib/request");
const res = require("express/lib/response");
const {response} = require("express");
const e = require("express");
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_ice_cream_db');
const app = express();

app.use(require('morgan')('dev'));
app.use(express.json());


//CREATE:
app.post('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `
            INSERT INTO flavors(name) 
            VALUES($1) 
            RETURNING *;
            `;
        const response = await client.query(SQL, [req.body.name]);
        res.send(response.rows[0]);
    } catch (e) {
        next(e);
    }
})
//READ:
app.get('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `SELECT * FROM flavors ORDER BY is_favorite DESC;`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (e) {
        next(e);
    }
})
//RETURN SINGLE FLAVOR
app.get('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `SELECT * FROM flavors WHERE id = $1;`;
        const response = await client.query(SQL, [req.params.id]);
        res.send(response.rows[0]);
    } catch (e) {
        next(e);
    }
})
//UPDATE:
app.put('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
            UPDATE flavors
            SET name=$1, is_favorite=$2, updated_at=now()
            WHERE id=$3;
        `;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.is_favorite,
            req.params.id
        ]);
        res.send(response.rows[0]);
    } catch (e) {
        next(e);
    }
})
//DELETE:
app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
            DELETE FROM flavors
            WHERE id = $1
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
})

const init = async () => {
    await client.connect();
    console.log(`Connected to database`);
    let SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            name VARCHAR(55) NOT NULL,
            is_favorite BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        );
    `;
    await client.query(SQL);
    console.log(`tables created`);
    SQL = `
        INSERT INTO flavors(name, is_favorite) VALUES('Vanilla',false);
        INSERT INTO flavors(name, is_favorite) VALUES('Strawberry',true);
        INSERT INTO flavors(name, is_favorite) VALUES('Chocolate',false);
        INSERT INTO flavors(name, is_favorite) VALUES('Caramel',false);
        INSERT INTO flavors(name, is_favorite) VALUES('Cookies and Cream',false);
    `;
    await client.query(SQL);
    console.log(`data seeded`);
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Listening on port ${port}`));
}
init();