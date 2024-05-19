require('dotenv').config()

const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const placesRoutes = require('./routes/places-routes')
const usersRoutes = require('./routes/users-routes')
const HttpError = require('./models/http-error')

const app = express()

app.use(bodyParser.json())

app.use('/api/uploads/images', express.static(path.join('uploads','images')))

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin,X-Requested-With,Content-Type,Accept,Authorization')
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,POST,PATCH,DELETE')
    next()
})

app.use('/api/places',placesRoutes)
app.use('/api/users', usersRoutes)

app.use((req,res,next)=>{
    throw new HttpError('Could not find this route.',404)
})

app.use((error, req, res, next)=>{
    if(req.file){
        fs.unlink(req.file.path, (err)=>{
            console.log(err)
        })
    }
    if(res.headerSent)
        return next(error)
    res.status(error.code || 500).json({message: error.message || 'An unknwon error occured!'})
})

mongoose
.connect(`mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.elxa07e.mongodb.net/${process.env.NAME}?retryWrites=true&w=majority`)
.then(()=>{
    app.listen(5000, ()=>{
        console.log(`Server is running on PORT=${process.env.PORT}`)
    })
})
.catch(err=>{
    console.log(err)
})