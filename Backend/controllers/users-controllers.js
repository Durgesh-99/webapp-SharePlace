require('dotenv').config()
const {validationResult} = require('express-validator')
const HttpError = require('../models/http-error')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const streamifier = require('streamifier');
const { v2: cloudinary } = require('cloudinary');

const getUsers = async (req,res,next)=>{
    let users
    try{
        users = User.find({},'-password')
    } catch(err){
        return next(new HttpError('Fetching users failed. please try again.'),500)
    }
    res.json({users: (await users).map(user=>user.toObject({getters:true}))})
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

// Configure Cloudinary (add these to your .env file)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Async function to upload file to Cloudinary
async function uploadToCloudinary(fileBuffer, publicId) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { 
                public_id: publicId, 
                folder: 'SharePlace',
                allowed_formats: ['jpg', 'png', 'jpeg', 'gif']
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return reject(new Error('Failed to upload image to Cloudinary'));
                }
                resolve(result.secure_url);
            }
        ).end(fileBuffer);
    });
}

// Modify signup function to use Cloudinary
const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email });
    } catch (err) {
        return next(new HttpError('Signup failed, please try again.', 500));
    }

    if (existingUser) {
        return next(new HttpError('User exists already, please login instead.', 422));
    }

    if (!req.file) {
        return next(new HttpError('Image is required for signup.', 422));
    }

    // Hash the password
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(new HttpError('Could not create user, please try again.', 500));
    }

    // Upload image to Cloudinary
    let imageUrl;
    try {
        const publicId = `${name}_${Date.now()}`;
        imageUrl = await uploadToCloudinary(req.file.buffer, publicId);
    } catch (err) {
        return next(new HttpError('Failed to upload image.', 500));
    }

    // Create a new user
    const createdUser = new User({
        name,
        email,
        image: imageUrl,
        password: hashedPassword,
        places: [],
    });

    try {
        await createdUser.save();
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again.', 500));
    }

    // Generate JWT token
    let token;
    try {
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );
    } catch (err) {
        return next(new HttpError('Signing up failed, please try again.', 500));
    }

    res.status(201).json({ userId: createdUser.id, email: createdUser.email, token });
};

exports.getUsers = getUsers
exports.signup = signup
exports.login = login