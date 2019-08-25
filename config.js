const path = require('path')

module.exports = {
  client_id: '*****************',     // You client_id
  client_secret: '*****************', // You client_secret
  redirect_uri: 'http://localhost:4000',
  OAuthAccessToken: {
    host: 'https://github.com',
    hostname: 'github.com',
    path: '/login/oauth/access_token',
  },

  server_port: 4000,
  writePath: filename => path.join(__dirname, 'test', filename)
}
