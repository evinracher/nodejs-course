const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an addres!'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Define our indexes
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({
  location: '2dsphere'
});

storeSchema.pre('save', async function (next) {
  // you can clean this to don't have html
  if (!this.isModified('name')) {
    next();// Skip it 
    return;// Stop this function
  }

  this.slug = slug(this.name);
  // Making slug unique
  // ^ starts with
  // $ ends with
  // May end with -1, -2, -3, ...
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i'); // Case insensitive
  // this.constructor = Store
  const storeWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storeWithSlug.length) {
    this.slug = `${this.slug}-${storeWithSlug.length + 1}`;
  }

  next();
});

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
}

storeSchema.statics.getTopStores = function () {
  // With can't use virtual reviews
  // Mongo takes the Review model an put it like reviews ( so you use reviews)
  return this.aggregate([
    {
      $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' }
    },
    // reviews[1] == reviews.1
    {
      $match: { 'reviews.1': {
        $exists: true
      }}
    },
    // add a new field, using the calculated avg. $reviews data been pipe in. You can also use just $addField in versions mongodb 3.4+
    // $$ROOT original document
    {
      $project: {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: { $avg: '$reviews.rating'}
      }
    },
    // Sort based on averageRating
    {
      $sort: { averageRating: -1 }
    },
    // Limit to at most 10
    {
      $limit: 10
    }
  ]);
}

storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id', // id of the store
  foreignField: 'store', // id of the store on the review
});

function autopopulate(next){
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);
