const express = require('express');
const { index, signin, signup , notFound} = require('../controller/AppController')

const router = express.Router();


router.get('/', index);

router.post('/users/signin', signin);

router.post('/users/signup', signup);

router.get('/**', notFound);
router.delete('/**', notFound);
router.post('/**', notFound);
router.patch('/**', notFound);

module.exports = router;

