const mongoose = require('mongoose')
const schema = mongoose.Schema
const bcrypt= require('bcryptjs')

const AuthSchema = new schema({
    fullName:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true,
        select: false // Exclude password from default queries
    }
})

//hashing password function
AuthSchema.pre('save', async function(){
    if(!this.isModified('password')){
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('authSchema', AuthSchema);