var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var bookSchema   = new Schema({
	name: { type: String, required: true },
	price: Number   
});

module.exports = mongoose.model('Book', bookSchema);