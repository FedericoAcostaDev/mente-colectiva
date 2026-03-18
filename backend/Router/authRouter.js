const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//load models
const User = require('../models/authModel')

//routes
//signup route
router.post('/signup', async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;

        //validations
        if (!fullName || !email || !password) {
            return res.status(400).json({ msg: "All fields required" });
        }

        //checking for already existing user
        const userExist = await User.findOne({ email: String(email) });
        if (userExist) {
            return res.status(409).json({ msg: "Email already exists!" });
        }
        
        //if no userExist then create jwt and create new user
        //hashPassword --> I have made pre save hook in model so no need to hash here

        //create user
        const newUser = new User({
            fullName, email, password
        })
        await newUser.save();

        //sign JWT
        const token = jwt.sign({ id: newUser._id }, process.env.JWTSECRET, { expiresIn: '1d' });
        if (!token) throw Error("there is no token made!!");

        //success
        res.status(200).json({
            token,
            data: {
                id: newUser._id,
                name: newUser.fullName,
                email: newUser.email
            }
        })

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server Error",
            errMsg: err
        })
    }
})

//login route
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        //checking user exist or not
        const userExist = await User.findOne({ email }).select('+password');
        if (!userExist) {
            return res.status(400).json({
                msg: "User does not Exist!!"
            })
        }

        //if user exist then compare password
        const isMatch = await bcrypt.compare(password, userExist.password);
        if (!isMatch) {
            return res.status(400).json({
                msg: "Invalid Credentials!!"
            })
        }

        //sign JWT
        const token = jwt.sign({ id: userExist._id }, process.env.JWTSECRET, { expiresIn: '1d' });

        res.status(200).json({
            token,
            data: {
                id: userExist._id,
                name: userExist.fullName,
                email: userExist.email
            }
        })

    } catch (err) {
        res.status(500).json({
            message: "Server Error",
            errMsg: err
        })
    }
})


module.exports = router;