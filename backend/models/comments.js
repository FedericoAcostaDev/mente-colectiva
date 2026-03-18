const mongoose  = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    roomId:{
        type:Schema.Types.ObjectId,
        ref:"Room",
        required:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:"authSchema",
        required:true
    },
    userName:{
        type:String,
        required:true
    },
    commentText:{
        type:String,
        required:true
    },
},{
    timestamps:true  //adds createdAt & updatedAt
});

module.exports = mongoose.model("Comment",CommentSchema);