const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
    title: String,
    imageUrl: String,
    info: String
});

module.exports = NewsSchema;

