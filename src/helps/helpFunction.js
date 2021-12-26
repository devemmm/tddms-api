const User = require('../model/User');

const isExistUser = async(phone)=>{
    try {
        if(!phone){
            throw new Error("you must provide email");
        }

        const user = await User.findOne({phone})
        
        return user ? true : false
    } catch (error) {
        throw new Error(error.message)
    }
}

module.exports = { isExistUser }