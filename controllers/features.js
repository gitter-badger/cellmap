module.exports = function(context) {

    // Imports
    var featuresDao = context.component('daos').module('features');

    return {
        removeFeature: function(request, response) {
            const featureId = request.params.fid;

            featuresDao.remove(featureId).then(function(features){
                response.send(features);
            }, function(error){
                response.send(error);
            });
        },
        updateFeature: function(request, response) {
            if(request.is('application/json')) {
                const formidable = context.formidable;
                const form = new formidable.IncomingForm();
                // Need to implement the storage of file xyz and then render home

                form.parse(request, function(error, fields, files) {
                    featuresDao.update(fields).then(function(updatedItem){
                        response.send(updatedItem);
                    }, function(error){
                        response.send(error);
                    });
                });
            } else {
                response
                    .status(400)
                    .render('error', {
                    title: 'Error',
                    message: "Unable to post request",
                    error: "Allowed calls include:\n - application/json\n"
                });
            }
        },
        getFeatures: function(request, response) {
            const imageId = request.params.iid;

            featuresDao.find(imageId).then(function(features){
                response.send(features);
            }, function(error){
                response.send(error);
            });
        },
    }
}