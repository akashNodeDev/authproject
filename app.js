require("dotenv").config();
require("./config/database").connect();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

const User = require("./model/user");
const auth = require("./middleware/auth");

const app = express();
app.use(express.json());
app.use(cookieParser())

app.get("/",(req,res)=> {
    res.send("<h1>Hello from the auth project</h1>")
});

app.post("/register",async(req,res) =>{
    try {
        const {firstname, lastname, email, password} = req.body;

        if(!(firstname && lastname && email && password)) {
            res.status(400).send("All fields are required");
        }
    
        let existUser = await User.findOne({email}) // Promise
    
        if(existUser) {
            res.status(401).send("User already exists with the same email");
        }
    
        const encPass = await bcrypt.hash(password,10);
    
        const user = await User.create({
            firstname,
            lastname,
            email:email.toLowerCase(),
            password:encPass
        })
    
        // Token
        const token = jwt.sign(
            {user_id:user._id,email},
            process.env.SECRET_KEY,
            {
                expiresIn:'2h'
            }
        )
    
        user.token = token
    
        // Update or Not

        /*Handle Password situation */

        user.password = undefined
    
        res.status(200).json(user)
    } catch (error) {
        console.log(error)
    }

})

app.post("/login", async(req,res)=> {
    try {
        const {email,password} = req.body;

        if(!(email && password)) {
            res.status(400).send("Email is required")
        }

        let user = await User.findOne({email});

        if(user && await bcrypt.compare(password,user.password)) {
            let token = jwt.sign(
                {user_id:user._id,email},
                process.env.SECRET_KEY,
                {
                    expiresIn:"2h"
                }
            )

            user.token = token
            user.password = undefined

            // If you want to use cookies

            // const options = {
            //     maxAge:new Date(Date.now() + 3 *24 * 60 * 60 * 1000),
            //     httpOnly:true
            // }

            // res.status(200).cookie("token","token",options).json({
            //     success:true,
            //     token,
            //     user
            // })

            //res.status(200).cookie('token', '1', { expires: new Date(Date.now() + 900000), httpOnly: true })

            // res.cookie('token', { maxAge: 5666666, httpOnly: true })

           res.status(200).json({user})

        }

        res.status(400).send("Authentication Failed")

    } catch (error) {
        throw error;
    }
})

app.get("/dashboard", auth , (req,res)=> {
    res.send("<h1> Hello from the dashboard </h1>");
})

module.exports = app;

