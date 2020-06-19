// SERVER SETUP
// =============================================================================

// require packages
var express     = require('express');
var bodyParser  = require('body-parser');
var fs          = require('fs');
var app         = express();

// configure app
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set port
var port        = process.env.PORT || 7500; 

// connect to database
var mongoose    = require('mongoose');
mongoose.connect('mongodb://localhost:27017/DynamicApi', { useUnifiedTopology: true, useNewUrlParser: true }); 

// create router
var router = express.Router();


// default route
router.get('/', function(req, res) {
    res.json({ message: 'Hello world' });
});

// RESOURCE VALIDATION
// =============================================================================
function validateResource (req, res, next) {
    fs.readFile('./resources.json', { encoding: 'utf8' }, function (err, data) {
        var config = JSON.parse(data);

        var rcf = null;
        for (var i in config) {

            if (req.params.resource === config[i].resource) {

                rcf = config[i];

                req.resource = require('./app/models/' + config[i].resource + '.js');
                // set fields
                if (req.query.fields !== undefined) {
                    var fields = req.query.fields.split(",");
                    for (var i = 0; i < fields.length;) {
                        if (rcf.fields !== undefined && !~rcf.fields.indexOf(fields[i]))
                            fields.splice(i, 1);
                        else i++;
                    }
                    req.fields = fields.join();
                } else if (rcf.fields !== undefined) {
                    req.fields =  rcf.fields.join();
                }
                req.options = {};
                // set sort options
                if (req.query.sort !== undefined)
                    req.options.sort = req.query.sort;
                // set limit options
                if (req.query.limit !== undefined)
                    req.options.limit = req.query.limit;
                // set skip options
                if (req.query.skip !== undefined)
                    req.options.skip = req.query.skip;
            }
        }

        if (rcf === null) 
            res.sendStatus(404); // Not found
        else if (rcf.methods !== undefined && !~rcf.methods.indexOf(req.method))
            res.sendStatus(403); // Forbidden
        else
            next();
    });
}

// DYNAMIC ROUTES
// =============================================================================
router.route('/:resource')
    
    .all(validateResource)

    .post(function(req, res) {
        var item = new req.resource();
        item.name = req.body.name;

        item.save(function(err) {
            if (err) 
                res.send(err);
            else 
                res.json({ message: req.resource.modelName + ' created with name:' + item.name });
        });
    })

    .get(function(req, res) {
        req.resource.find(req.conditions, req.fields, req.options, function(err, items) {
            console.log(req.options);
            if (err) 
                res.send(err);
            else
                res.json(items);
        });
    });

router.route('/:resource/:id')

    .all(validateResource)

    .get(function(req, res) {
        req.resource.findById(req.params.id, req.fields, function(err, item) {
            if (err) 
                res.send(err);
            else 
                res.json(item);
        });
    })

    .put(function(req, res) {
        req.resource.findById(req.params.id, function(err, item) {
            if (err) 
                res.send(err);
            else {
                item.name = req.body.name;
                item.save(function(err) {
                    if (err) 
                        res.send(err);
                    else
                        res.json({ message: req.resource.modelName + ' updated which has id:' + req.params.id });
                });
            }
        });
    })

    .delete(function(req, res) {
        req.resource.remove({
            _id: req.params.id
        }, function(err, item) {
            if (err) 
                res.send(err);
            else
                res.json({ message: req.resource.modelName + ' deleted id with:'+ _id });
        });
    });

// REGISTER ROUTES
// =============================================================================
app.use('/api', router);

// START SERVER
// =============================================================================
app.listen(port, console.log('Server is running on ' + port));