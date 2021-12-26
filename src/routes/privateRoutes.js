const express = require('express');
const { 
    signout, 
    generateReport, 
    getReportedDisease, 
    approveReport, 
    deleteUser, 
    registerUser, 
    findAllUser, 
    underMentainance} = require('../controller/AppController')

const router = express.Router();

router.post('/users/signout', signout)

//------------------ FARMER--------------------------------

router.post('/users/askexpart', generateReport);  //this router will be done after ai model

router.get('/users/report', underMentainance); //this router will be done after ai model


// -----------------SECTOR, DISTRICT, RAB------------------ 

router.get('/users/tomato/disease', getReportedDisease);

router.post('/users/tomato/disease/approve/:id', approveReport);



//---------------------RAB----------------------------------

router.get('/rab/user', findAllUser);

router.post('/rab/register/user', registerUser);

router.delete('/rab/user/:phone', deleteUser);

router.patch('/rab/user', underMentainance);

router.get('/rab/tomato/disease', getReportedDisease);

module.exports = router;

