const Hapi = require('hapi')
const mongoose = require('mongoose')
const path = require('path');
mongoose
  .connect('mongodb://localhost:27017/hapijs', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('mongo db connected'))
  .catch(err => console.log(err))

//create task model
const Task = mongoose.model('Task', { text: String });
const Product = mongoose.model('Prodcut', {
  productName: String,
  productPrice: Number,
  ImageUrl: String
});

const init = async () => {
  //Init server
  const server = new Hapi.server({
    port: 8000,
    host: 'localhost',
    routes: {
      files: {
        relativeTo: path.join(__dirname, 'public')
      }
    }
  });

  await server.register(require('inert'))
  await server.register(require('vision'))

  server.route({
    method: 'GET',
    path: '/',
    handler: (req, h) => h.view('index', { title: 'Add Product' })
  })

  server.route({
    method: 'POST',
    path: '/',
    handler: async (req, h) => {
      let title = req.payload.title;
      let price = req.payload.price;
      let imagePath = req.payload.imagePath;
      let newProduct = new Product({
        productName: title,
        productPrice: price, ImageUrl: imagePath
      });
      await newProduct.save((err, Product) => {
        if (err) {
          return console.log(err);
        }
        else {
          console.log('inserted', Product);
        }
      });

      return h.redirect().location('/tasks');
    }
  });

  server.route({
    method: 'GET',
    path: '/editProduct/{id}',
    handler: async (request, h) => {

      let products = await Product.findById(request.params.id, (err, doc) => {
        //console.log('dta', doc);
      });
      return h.view('index', {
        title: 'Update a Product',
        products: products
      })
    }
  })

  server.route({
    method: 'POST',
    path: '/editProduct/{id}',
    handler: async (req, h) => {
      let updateProduct = '';
      console.log('data--', req.payload);
      updateProduct = await Product.findOneAndUpdate({
        _id: req.payload._id
      }, {
        productName: req.payload.title,
        productPrice: req.payload.price,
        ImageUrl: req.payload.imagePath,
      }, {
        new: true
      });

      if (updateProduct)
        return h.redirect().location('/tasks');
    }
  });


  server.route({
    method: 'GET',
    path: '/deleteProduct/{id}',
    handler: async (req, h) => {
      let doc = '';
      console.log('data--', req.payload);
      doc = await Product.findByIdAndRemove(req.params.id, (err, doc) => {
        if (doc) {
          console.log('deleted');
        }
        else { console.log('Error in  delete :' + err); }
      });

      return h.redirect().location('/tasks');
    }
  });



  //Get task route
  server.route({
    method: 'GET',
    path: '/tasks',
    handler: async (req, h) => {
      let products = await Product.find((err, products) => {
        //console.log(products)
      })
      return h.view('productList', {
        title: 'List of Products',
        products: products
      })
    }
  })

  //Post task route
  // server.route({
  //   method: 'POST',
  //   path: '/tasks',
  //   handler: async (req, h) => {
  //     let text = req.payload.text
  //     let newTask = new Task({ text: text })
  //     await newTask.save((err, task) => {
  //       if (err) return console.log(err)
  //     })

  //     return h.redirect().location('tasks')
  //   }
  // })

  server.route({
    method: 'GET',
    path: '/user/{name}',
    handler: (req, h) => {
      return `Hello world, ${req.params.name}`
    }
  })

  server.route({
    method: 'GET',
    path: '/about',
    handler: (req, h) => {
      return h.file('./public/about.html')
    }
  })

  server.route({
    method: 'GET',
    path: '/picture.jpg',
    handler: {
      file: 'hapijs.jpeg'
    }
  });

  server.route({
    method: 'GET',
    path: '/image',
    handler: (req, h) => {
      return h.file('./public/hapijs.jpeg')
    }
  })

  server.views({
    engines: {
      html: require('handlebars')
    },
    relativeTo: __dirname,
    path: 'views',
    layoutPath: 'views/layouts',
  });


  await server.start()

  console.log(`Server is running on ${server.info.uri}`)
}

init().catch(err => console.log(err))
