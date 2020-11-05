const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');
const User = mongoose.model('User');
const mail = require('../handlers/mail');

// Using passport middleware
exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // first check if the user is authenticated
  if(req.isAuthenticated()) {
    next();
    return;
  } else {
    req.flash('error', 'You must be logged in to do that');
    res.redirect('/login');
  }
};

exports.forgot = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if(!user) {
    req.flash('info', 'A password reset has been mailed to you if you have an account with the provided email.');
    return res.redirect('/login');
  }
  // 2. Set the reset token using crypto
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();
  // 3. Send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: 'Password reset',
    resetURL,
    filename: 'password-reset', // To render the html
  });
  req.flash('info', `A password reset has been mailed to you if you have an account with the provided email.`);
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } // greater than now
  });
  if(!user) {
    req.flash('error', 'Password reset token is invalid or has expired');
    return res.redirect('/login');
  }
  // if there is a user, show the reset password form
  res.render('reset',{ title: 'Reset your password' });
};

exports.confirmedPasswords = (req, res, next) => {
  if(req.body.password === req.body['password-confirm']){
    next();
    return;
  }
  req.flash('error', 'Passwords do not match');
  res.redirect('back');
}

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } // greater than now
  });

  if(!user) {
    req.flash('error', 'Password reset token is invalid or has expired');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password); // passport
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser); // passport
  req.flash('success', 'Your password has been reset! You are now logged in!');
  res.redirect('/');
};
