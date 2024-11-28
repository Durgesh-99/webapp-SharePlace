require('dotenv').config()

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cors = require('cors');

const placesRoutes = require('./routes/places-routes')
const usersRoutes = require('./routes/users-routes')
const HttpError = require('./models/http-error')

const app = express()

app.use(cors());
app.use(bodyParser.json())

app.use('/api/places',placesRoutes)
app.use('/api/users', usersRoutes)

app.use((req,res,next)=>{
    throw new HttpError('Could not find this route.',404)
})

app.use((error, req, res, next) => {
    if (res.headerSent)
        return next(error);
    res.status(error.code || 500).json({ message: error.message || 'An unknown error occurred!' });
});

mongoose
.connect(`${process.env.URL}`)
.then(()=>{
    app.listen(5000, ()=>{
        console.log(`Server is running on PORT=${process.env.PORT}`)
    })
})
.catch(err=>{
    console.log(err)
})