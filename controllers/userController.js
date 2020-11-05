const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login'});
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

// Middleware to validate registration
exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That email is not valid!').isEmail(); // If it is empty, it would fail
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'You passwords do not match').equals(req.body.password);
  const errors = req.validationErrors(); // check all of theses methods
  if(errors) {
    req.flash('error', errors.map(err => err.msg));
    // the flash are in the next request, but here we need to past to the same request
    res.render('register', { 
      title: 'Register', 
      body: req.body,
      flashes: req.flash()
    }); // Don't clear all the form
    return; // stop function from running
  }
  next(); // there were no errors
};

exports.register = async (req, res, next) => {
  const user = new User({
    email: req.body.email,
    name: req.body.name,
  });
  // Register hash the password to save it in the db. It doesn't return a promise
  // User.register(user, req.body.password, function(err, user) {
  // });
  // We use the promisify library to turn this in a promise
  // Bind to the object
  const register = promisify(User.register, User);
  await register(user, req.body.password); // Store the hashed password
  next(); // pass to authController login
};
