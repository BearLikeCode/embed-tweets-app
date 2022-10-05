const { Schema, model } = require("mongoose")
const mongoose = require("mongoose")

const tweetSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    id_str: {
        type: String,
        required:true
    },
    tweetsList: {
        type: Object,
        required: false
    }
})

const Tweet = mongoose.model('Tweet', tweetSchema)
module.exports = Tweet