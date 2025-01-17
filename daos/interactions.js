/**
 * interactions DAO
 *
 * Created by Christian Dallago on 20160530 .
 */

module.exports = function(context) {

    // Imports
    var interactionModel = context.component('models').module('interactions');

    return {
        create: function(item) {
            var deferred = context.promises.defer();

            interactionModel.create(item, function(error, insertedItem) {
                if (error) {
                    console.error(error);
                    deferred.reject(error);
                }
                deferred.resolve(insertedItem);
            });

            return deferred.promise;
        },

        remove: function(item) {
            var deferred = context.promises.defer();

            interactionModel.findOneAndRemove({"_id": item._id}, function(error, removedItem) {
                if (error) {
                    console.error(error);
                    deferred.reject(error);
                }
                deferred.resolve(removedItem);
            });

            return deferred.promise;
        },

        update: function(item) {
            var deferred = context.promises.defer();

            item.updatedAt = Date.now();

            interactionModel.update({ edges: item.edges }, item, {
                upsert: true,
                setDefaultsOnInsert : true
            }, function(error, insertedItem) {
                if (error) {
                    console.error(error);
                    deferred.reject(error);
                }
                deferred.resolve(insertedItem);
            });

            return deferred.promise;
        },

        bulkInsert: function(items) {
            var deferred = context.promises.defer();

            interactionModel.collection.insert(items, function(error, insertedItems) {
                if (error) {
                    console.error(error);
                    deferred.reject(error);
                }
                deferred.resolve(insertedItems);
            });

            return deferred.promise;
        },

        findByUniprotEntryName: function(uniprotEntryName) {
            var deferred = context.promises.defer();

            interactionModel
                .find({
                edges: uniprotEntryName
            })
                .exec(function(error, interactions) {
                if (error) {
                    console.error(error);
                    deferred.reject(error);
                } else {
                    deferred.resolve(interactions);
                }
            });

            return deferred.promise;
        },
    };
};