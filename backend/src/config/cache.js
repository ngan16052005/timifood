const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // Cache for 10 minutes

module.exports = cache;
