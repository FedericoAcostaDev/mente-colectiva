
const Room = require("../models/roomModel");
const Comment = require("../models/comments");

//calling this after mongoose connection
async function watchRoomDelete() {

    // Start watching changes on Room collection
    const changeStream = Room.watch();

    changeStream.on("change", async (change) => {

        // We only care when a document is deleted (TTL triggers this)
        if (change.operationType === "delete") {
            const deletedRoomId = change.documentKey._id;
            await Comment.deleteMany({ roomId: deletedRoomId });
        }
    });
}

module.exports = watchRoomDelete;
