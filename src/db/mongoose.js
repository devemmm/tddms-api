const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
    useUnifiedTopology: true,
    useNewUrlParser: true
})
    .then(() => {
        console.log('conneted to database');
    })

    .catch((error) => {
        console.log(error.message)
        console.log('failed to connect to database')
    })