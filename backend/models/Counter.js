const mongoose = require('mongoose');

const counterSchema = mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        default: 'visitor',
        unique: true
    },
    count: {
        type: Number,
        default: 0
    }
});

const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;
