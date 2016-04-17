/**
 * expressionLigRec model
 *
 * Created by Christian Dallago on 20160417 .
 */

module.exports = function(context) {

    // Imports
    const mongoose = context.mongoose;

    return mongoose.model('pairsLigRec', mongoose.Schema({
        pair_name : {
            type: String,
            required: true,
            unique: true
        },
        ligand_approvedsymbol: {
            type: String,
            required: true,
            ref: "expressionLigRec"
        },
        receptor_approvedsymbol: {
            type: String,
            required: true,
            ref: "expressionLigRec"
        },
        createdAt : {
            type: Date,
            default: Date.now
        },
        updatedAt : {
            type: Date,
            default: Date.now
        }
    }, {
        strict: false
    }));
};