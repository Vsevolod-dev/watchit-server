const express = require('express');
const app = express();
const db = require('./db.json')
const cors = require('cors')
const PORT = 5000

app.use(cors())

app.get('/users', (request, response) => {
  const query = request.query
  const path = request.path.slice(1)

  console.log(query, "''''''''''''''''''''''''''''''''''''''''")

  let result = db[path]
  let limit = 10

  const arrays = []

  if (JSON.stringify(query) !== '{}') {
    for (const [key, value] of Object.entries(query)) {
      if (['_limit', '_page'].includes(key)) continue
      if (key.includes('_gte') || key.includes('_lte')) {
        if (key.includes('_gte')) {
          const param = key.replace('_gte', '')
          result = result.filter(obj => obj[param] && obj[param] > value)
        }
        if (key.includes('_lte')) {
          const param = key.replace('_lte', '')
          result = result.filter(obj => obj[param] && obj[param] < value)
        }
      } else {
        arrays.push(result.filter(obj => obj[key] && obj[key].toLowerCase().includes(value.toLowerCase())))
      }
    }
  }

  let array = []
  arrays.forEach(arr => {
    array.push(...arr)
  })
  array = array.filter((value, index, self) => self.indexOf(value) === index)

  if (query['_sort']) {
    const sort = query['_sort']
    const order = query['_order'] === 'desc' ? 'desc' : 'asc'

    if (array.length === 0) { 
      switch (order) {
        case "asc":
          result.sort((a, b) => {
            if (a[sort] > b[sort]) return 1;
            if (a[sort] < b[sort]) return -1;
            return 0;
          })
          break
        case "desc":
          result.sort((a, b) => {
            if (a[sort] < b[sort]) return 1;
            if (a[sort] > b[sort]) return -1;
            return 0;
          })
          break
      }
    } else {
      switch (order) {
        case "asc":
          array.sort((a, b) => {
            if (a[sort] > b[sort]) return 1;
            if (a[sort] < b[sort]) return -1;
            return 0;
          })
          break
        case "desc":
          array.sort((a, b) => {
            if (a[sort] < b[sort]) return 1;
            if (a[sort] > b[sort]) return -1;
            return 0;
          })
          break
      }
    }
  } else {
    if (array.length === 0) {
      if (result[0]) {
        const keys = Object.keys(result[0])
        const firstKey = keys[0]
        result.sort((a, b) => a[firstKey] - b[firstKey])
      }
    } else {
      if (array[0]) {
        const keys = Object.keys(array[0])
        const firstKey = keys[0]
        array.sort((a, b) => a[firstKey] - b[firstKey])
      }
    }
  }

  if (array.length === 0) array = result
  if (result.length === 0) result = array

  response.setHeader('X-Total-Count', array.length);
  response.setHeader('Access-Control-Expose-Headers', `X-Total-Count`);

  if (query['_page']) {
    if (query['_limit']) limit = query['_limit']
    array = array.slice(
      query['_page'] * limit - limit,
      query['_page'] * limit
    )
  } else if (query['_limit']) {
    array = array.slice(0, query['_limit'])
  }

  response.json(array);
});

app.listen(PORT, () => {
  console.log(`Server has been started on ${PORT} port`)
});
