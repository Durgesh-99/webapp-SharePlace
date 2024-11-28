const express = require('express')
const {check} = require('express-validator')
const usersControllers = require('../controllers/users-controllers')
const router = express.Router()
const multer = require('multer')

const fileUpload = multer({
    storage: multer.memoryStorage(), // Store file in memory buffer
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

router.get('/', usersControllers.getUsers)

router.post('/signup',
fileUpload.single('image'),
[
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(), //Test@test.com -> test@test.com
    check('password').isLength({min:6})
],
usersControllers.signup)

router.post('/login',usersControllers.login)

module.exports = router