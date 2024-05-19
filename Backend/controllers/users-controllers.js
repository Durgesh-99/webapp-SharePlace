const {validationResult} = require('express-validator')
const HttpError = require('../models/http-error')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const getUsers = async (req,res,next)=>{
    let users
    try{
        users = User.find({},'-password')
    } catch(err){
        return next(new HttpError('Fetching users failed. please try again.'),500)
    }
    res.json({users: (await users).map(user=>user.toObject({getters:true}))})
}

const signup = async (req,res,next)=>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return next(new HttpError('Invalid inputs passed,please check your data.',422))
    }

    const {name,email,password} = req.body
    
    let existingUser
    try{
        existingUser = await User.findOne({email:email})
    } catch(err){
        const error = new HttpError('Signup Failed, please try again.',500)
        return next(error)
    }

    if(existingUser){
        const error = new HttpError('User exists already, please login instead.',422)
    }

    let hashedPassword;
    try{
        hashedPassword = await bcrypt.hash(password,12);
    }catch(err){
        return next(new HttpError('Could not create User, please try again',500));
    }

    const createdUser = new User({
        name,
        email,
        image: req.file.path,
        password: hashedPassword,
        places: []
    })
    try{
        await createdUser.save()
    } catch(err){
        const error = new HttpError('Signing Up failed, please try again.',500)
        return next(error)
    }

    let token;
    try{
        token = jwt.sign(
            {userId:createdUser.id, email:createdUser.email},
            `${process.env.JWT_KEY}`,
            {expiresIn:'1h'}
        );
    }catch(err){
        console.log(err)
        const error = new HttpError('Signing Up failed, please try again.',500)
        return next(error)
    }

    res.status(201).json({userId: createdUser.id, email:createdUser.email, token:token});
}

const login = async (req,res,next)=>{
    const {email, password} = req.body;
    console.log('Users got')
    let existingUser
    try{
        existingUser = await User.findOne({email:email})
    } catch(err){
        const error = new HttpError('Logging in Failed, please try again.',500)
        return next(error)
    }

    if(!existingUser){
        const error = new HttpError('Invalid credentials, could not log you in.',403)
        return next(error)
    }
    let isValidPassword = false;
    try{
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    }catch(err){
        return next(new HttpError('Could not log you in, please check your credentials and try again.',500))
    }

    if(!isValidPassword){
        return next(new HttpError('Invalid credentials, could not log you in.',401));
    }

    let token;
    try{
        token = jwt.sign(
            {userId:existingUser.id, email:existingUser.email},
            `${process.env.JWT_KEY}`,
            {expiresIn:'1h'}
        );
    }catch(err){
        const error = new HttpError('Signing Up failed, please try again.',500)
        return next(error)
    }

    res.json({userId: existingUser.id,email:existingUser.email,token:token})
}

exports.getUsers = getUsers
exports.signup = signup
exports.login = login