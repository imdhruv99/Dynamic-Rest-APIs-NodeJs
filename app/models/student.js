var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var studentSchema   = new Schema({
	name: { type: String, required: true },
    percentage: Number   
});

module.exports = mongoose.model('Student', studentSchema);