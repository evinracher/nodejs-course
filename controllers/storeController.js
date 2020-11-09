const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
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
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That file isn\'t allowed!' }, false);
    }
  }
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if (!req.file) {
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
  if (req.name === 'error') {
    throw Error('Error name');
  }
  next();
};

exports.homePage = (req, res) => {
  console.log(req.name);
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add store' });
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
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

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug })
    .populate('author reviews'); // password is not visible
  if (!store) return next(); // To the notFound middleware
  res.render('store', { title: store.name, store });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it!');
  }
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  // res.json(store);
  confirmOwner(store, req.user);
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

exports.getStoresByTag = async (req, res) => {
  // const tags = await Store.getTagsList();
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true }; // at least one tag on it
  // Multiple independent queries
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  // Wait for multiple promises for come back, the first one to finish
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', { tags, title: 'Tags', tag, stores });
}

exports.searchStores = async (req, res) => {
  const stores = await Store
    // first find stores that match
    .find(
      {
        $text: {
          $search: req.query.q
        }
      },
      {
        score: {
          $meta: 'textScore'
        }
      }
      // Then sort then
    ).sort({
      score: {
        $meta: 'textScore'
      }
    })
    // Limit to 5 result
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  // res.json(coordinates);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km, 10000m
      }
    }
  };

  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  // .select('-photo');
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  console.log(hearts);
  console.log(req.params.id);
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  console.log(operator);
  const user = await User
    .findByIdAndUpdate(
      req.user._id,
      { [operator]: { hearts: req.params.id }},
      { new: true }
    );
    res.json(user);
};

exports.getHearts = async (req, res) => {
  // We can also do this with populate
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  res.render('stores', { title: 'Hearted Stores', stores });
};
