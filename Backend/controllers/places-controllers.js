const fs = require('fs')
const {validationResult} = require('express-validator')
const HttpError = require('../models/http-error')
const Place = require('../models/place')
const User = require('../models/user')
const { default: mongoose } = require('mongoose')
const { ObjectId } = require('mongodb')

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

const createPlace = async (req,res,next)=>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return next(new HttpError('Invalid inputs passed,please check your data.',422))
    }
    
    const {title,description,location,address}=req.body
    
    const createdPlace = new Place({
        title,
        description,
        address,
        location,
        image: req.file.path,
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

    const imagePath = place.image

    try{
        const sess = await mongoose.startSession()
        sess.startTransaction()
        await place.deleteOne({session: sess})
        place.creator.places.pull(place)
        await place.creator.save({session: sess})
        await sess.commitTransaction()
    } catch(err){
        const error = new HttpError('Something went wrong, could not delete place.',500)
        return next(error)
    }
    fs.unlink(imagePath, err=>{
        console.log(err)
    })

    res.status(200).json({message: 'Deleted Place'})
}

exports.getPlaces = getPlaces
exports.getPlaceById = getPlaceById
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.updatePlace = updatePlace
exports.deletePlace = deletePlace
exports.getSearchedPlaces = getSearchedPlaces