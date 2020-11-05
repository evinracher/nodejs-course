const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
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
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/add', 
  authController.isLoggedIn,
  storeController.addStore
);
router.post('/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
router.post('/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);
router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/reverse/:name', (req, res) => {
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);  
});

router.get('/login', userController.loginForm);
router.post('/login', authController.login);

router.get('/register', userController.registerForm);
router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);
router.get('/account', 
  authController.isLoggedIn,  
  userController.account
);

router.post('/account', catchErrors(userController.updateAccount));

router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);

module.exports = router;
