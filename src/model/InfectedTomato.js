const mongoose = require('mongoose');

const infectedTomatoSchema = mongoose.Schema({
    farmer:{
        phone: {
            type: String,
            trim: true,
            required: true,
        },
        fname: {
            type: String,
            trim: true
        },
        lname: {
            type: String,
            trim: true
        }
    },
    location:{
        country: {
            type:String,
            trim: true,
            default: 'Rwanda'
        },
        province: {
            type:String,
            trim: true
        },
        district: {
            type:String,
            trim: true
        },
        sector: {
            type:String,
            trim: true
        },
        cell: {
            type:String,
            trim: true
        }
    },
    disease:{
        name:{
            type: String,
            trim: true
        },
        description:{
            type: String,
            trim: true
        }
    },
    observation:{
        sector:{
            agro:{
                type: String,
                trim: true
            },
            canSolve:{
                type: Boolean,
                trim: true
            },
            comments:{
                type: String,
                trim: true
            },
            admitted:{
                type: Boolean,
                default: false,
                trim: true
            }
        },
        district:{
            agro:{
                type: String,
                trim: true
            },
            canSolve:{
                type: Boolean,
                trim: true
            },
            comments:{
                type: String,
                trim: true
            },
            admitted:{
                type: Boolean,
                default: false,
                trim: true
            }
        },
        rab:{
            agro:{
                type: String,
                trim: true
            },
            canSolve:{
                type: Boolean,
                trim: true
            },
            comments:{
                type: String,
                trim: true
            },
            admitted:{
                type: Boolean,
                default: false,
                trim: true
            }
        }
    },
    status:{
        type: Boolean,
        default: true,
        trim: true
    }
});

const InfectedTomato = mongoose.model('InfectedTomato', infectedTomatoSchema);

module.exports = InfectedTomato;