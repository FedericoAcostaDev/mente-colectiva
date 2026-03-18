const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RoomSchema = new Schema({
    roomName: {
        type: String,
        required: true
    },
    host:{
        type:Schema.Types.ObjectId,
        ref:"authSchema",
        required:true
    },
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    boardData: {
        type: Object,
        default: {}
    },
    users: [
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "authSchema",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            socketId: {
                type: String,
                required: true,
            },
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    chat:[
        {
            type:Schema.Types.ObjectId,
            ref:"Comment"
        }
    ],
    joinedUser:[
        {
            type:Schema.Types.ObjectId,
            ref:"authSchema"
        }
    ],
    expiredAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        index: { expires: 0 }
    }
}, {
  timestamps: true   // ✅ adds createdAt & updatedAt
});

module.exports = mongoose.model("Room", RoomSchema);