const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  // res.send('Hey! It works! Yeah');
  // res.send(req.query);
  // console.log('[data]',req.query);
  // res.send(req.query.name);
  // res.send(req); // --> error 
  res.render('hello', {
    name: 'Kevin',
    age: 21
  });
});

router.get('/reverse/:name', (req, res) => {
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);  
})

module.exports = router;
