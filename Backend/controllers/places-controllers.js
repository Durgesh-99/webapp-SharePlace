const {validationResult} = require('express-validator')
const streamifier = require('streamifier');
const HttpError = require('../models/http-error')
const Place = require('../models/place')
const User = require('../models/user')
const { default: mongoose } = require('mongoose')
const { v2: cloudinary } = require('cloudinary');

const getPlaces = async (req,res,next)=>{
    let places
    try{
        places = await Place.find()
    } catch(err){
        const error = new HttpError('Something went wrong',500)
        return next(error)
    }

    if(!places){
        const error = new HttpError('Could not find places',404)
        return next(error)
    }
    res.json({places: places.map(place=>place.toObject({getters:true}))}) //{place}=>{place:place}
}

const getSearchedPlaces = async (req,res,next)=>{
    const {search} = req.body;
    let places;
    try{
        places = await Place.find({ $or: [
            {title:{ $regex: new RegExp(search, 'i') }  },
            {description:{ $regex: new RegExp(search, 'i') }  },
            {address:{ $regex: new RegExp(search, 'i') }  }
        ]
        })
    } catch(err){ 
        const error = new HttpError('Something went wrong',500)
        return next(error)
    }

    if(!places){
        const error = new HttpError('Could not find places',404)
        return next(error)
    }
    res.json({places: places.map(place=>place.toObject({getters:true}))}) //{place}=>{place:place}
}

const getPlaceById = async (req,res,next)=>{
    const placeId = req.params.pid
    let place

    try{
        place = await Place.findById(placeId)
    } catch(err){
        const error = new HttpError('Something went wrong, could not find the place',500)
        return next(error)
    }

    if(!place){
        const error = new HttpError('Could not find place for provided id',404)
        return next(error)
    }
    res.json({place: place.toObject({getters:true}) }) //{place}=>{place:place}
}

const getPlacesByUserId = async (req,res,next)=>{
    const userId = req.params.uid;
    let places;
    try{
        places = await Place.find({creator:userId})
    } catch(err){
        const error = new HttpError('Fetching places failed, please try again later',500)
        console.log(err)
        return next(error)
    }

    if(!places || places.length==0){
        return next(
            new HttpError('Could not find user place for provided id',404)
        )
    }
    res.json({places: places.map(place=>place.toObject({getters:true}))}) 
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
                folder: 'MERN_App_Users',
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

const createPlace = async (req,res,next)=>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return next(new HttpError('Invalid inputs passed,please check your data.',422))
    }
    
    const {title,description,location,address}=req.body

    // Upload image to Cloudinary
    let imageUrl;
    try {
        const publicId = `${title}_${Date.now()}`;
        imageUrl = await uploadToCloudinary(req.file.buffer, publicId);
    } catch (err) {
        return next(new HttpError('Failed to upload image.', 500));
    }
    
    const createdPlace = new Place({
        title,
        description,
        address,
        location,
        image: imageUrl,
        creator: req.userData.userId
    })
    
    //check if the user is already signed up
    let user
    try{
        user = await User.findById(req.userData.userId)
    }catch(err){
        return next(new HttpError('Creating Place failed, please try again.',500))
    }
    if(!user){
        return next(new HttpError('Could not find user with provided Id'),404)
    }
    //transactions and sessions
    try{
        const sess = await mongoose.startSession()
        sess.startTransaction()
        await createdPlace.save({session: sess})
        user.places.push(createdPlace) //does not push technically, just connects
        await user.save({session: sess})
        await sess.commitTransaction()

    } catch(err){
        const error = new HttpError('Creating place fail, please try again.',500)
        return next(error)
    }

    res.status(201).json({place: createdPlace})
}

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new HttpError('Invalid inputs passed, please check your data.', 422)
      );
    }
  
    const { title, description } = req.body;
    const placeId = req.params.pid;
  
    let place;
    try {
      place = await Place.findById(placeId);
    } catch (err) {
      const error = new HttpError(
        'Something went wrong, could not update place.',
        500
      );
      return next(error);
    }

    if(place.creator.toString()!==req.userData.userId){
        const error = new HttpError(
            `You cannot edit other user's uploaded place.`,
            500
          );
          return next(error);
    }
  
    place.title = title;
    place.description = description;
  
    try {
      await place.save();
    } catch (err) {
      const error = new HttpError(
        'Something went wrong, could not update place.',
        500
      );
      return next(error);
    }
  
    res.status(200).json({ place: place.toObject({ getters: true }) });
  };

const deletePlace = async (req,res,next)=>{ 
    const placeId = req.params.pid
    
    let place
    try{
        place = await Place.findById(placeId).populate('creator')
    } catch(err){
        const error = new HttpError('Something went wrong, could not delete place.',500)
        return next(error)
    }

    if(!place){
        return next(new HttpError('Could not find the place for this Id',404))
    }

    if(place.creator.id!==req.userData.userId){
        const error = new HttpError(
            `You cannot delete other user's uploaded place.`,
            401
          );
          return next(error);
    }

    const imageUrl = place.image;
    const imagePublicId = imageUrl.split('/').slice(-2, -1)[0];

    try{
        const sess = await mongoose.startSession()
        sess.startTransaction()
        await cloudinary.uploader.destroy(imagePublicId);
        await place.deleteOne({session: sess})
        place.creator.places.pull(place)
        await place.creator.save({session: sess})
        await sess.commitTransaction()
    } catch(err){
        const error = new HttpError('Something went wrong, could not delete place.',500)
        return next(error)
    }

    res.status(200).json({message: 'Deleted Place'})
}

exports.getPlaces = getPlaces
exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlace = updatePlace
exports.deletePlace = deletePlace
exports.getSearchedPlaces = getSearchedPlaces