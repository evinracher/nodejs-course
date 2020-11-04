const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
// types of files and how they are going to be save
// we are going to resize the files
const multerOptions = {
  // memory of the server (temporary)
  storage: multer.memoryStorage(),
  // The file is allow or not
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That file isn\'t allowed!' }, false);
    }
  }
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if(!req.file) {
    next(); // If there is not a file, skip to next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  // width, height
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo, keep going
  next();
};

exports.myMiddleWare = (req, res, next) => {
  req.name = 'No error';
  if(req.name === 'error'){
    throw Error('Error name');
  }
  next();
};

exports.homePage = (req, res) => {
  console.log(req.name);
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', {title: 'Add store'});
};

exports.createStore = async (req, res) => {
  console.log(req);
  console.log('Creating a store', req.body);
  const store = await (new Store(req.body)).save();
  // store.age = 10;
  // await store.save();
  req.flash('success', `Successfully Created ${store.name}`);
  // console.log('It worked!');
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  // console.log(stores);
  res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  // res.json(store);
  // TODO confirm owner
  res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.updateStore = async (req, res) => {
  console.log('Updating store');
  // Make the location data to be a point
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', 
  `Succesfully updated <strong>${store.name}</strong>.<a href="/stores/${store.slug}">View store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
}