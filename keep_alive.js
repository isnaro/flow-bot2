const http = require('http');

function startKeepAlive() {
  http.createServer(function (req, res) {
    res.write("I'm alive");
    res.end();
  }).listen(8080);

  console.log("Keep-alive server started on port 8080");
}

// Export the startKeepAlive function if needed by other parts of your application
module.exports.startKeepAlive = startKeepAlive;
