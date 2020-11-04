const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { catchErrors } = require('../handlers/errorHandlers');
// Do work here
// router.get('/', (req, res) => {
//   // res.send('Hey! It works! Yeah');
//   // res.send(req.query);
//   // console.log('[data]',req.query);
//   // res.send(req.query.name);
//   // res.send(req); // --> error 
//   res.render('hello', {
//     name: 'Kevin',
//     age: 21
//   });
// });


// router.get('/', storeController.myMiddleWare, storeController.homePage);
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);
router.post('/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
router.post('/add/:id', catchErrors(storeController.updateStore));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/reverse/:name', (req, res) => {
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);  
})

module.exports = router;
