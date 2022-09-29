const { Schema, model } = require("mongoose")
const mongoose = require("mongoose")

const tweetSchema = new Schema({
    data: {
        type: Array,
        required: true
    },
    includes: {
        type: Object,
        required: true
    },
    meta: {
        type: Object,
        required: true
    }
})

const Tweet = mongoose.model('Tweet', tweetSchema)
module.exports = Tweet