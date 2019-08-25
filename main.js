const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const querystring = require('querystring')
const config = require('./config')
const url = require('url')

const server = http.createServer(handleServerCb).listen(config.server_port,
  () => {
    console.log(`Server run at http://localhost:${config.server_port}`)
  })

function handleServerCb(req, res) {
  const urlObj = url.parse(req.url)

  // Refrence Link
  // [https://developer.mozilla.org/en-US/docs/Web/API/Request/mode]
  const isAjaxRequest = req.headers['sec-fetch-mode'] === 'cors'
  // console.log('[req.url]', urlObj)
  if (isAjaxRequest) {
    handleXhr({ req, res, urlObj })
  } else {
    handleHtml({ req, res, urlObj })
  }
}

function handleXhr({ req, res }) {
  let body = ''

  req.on('data', chunk => body += chunk)
  req.on('end', () => {
    let _body = {}

    try {
      _body = JSON.parse(body)
    } catch (e) { console.log(e.stack) }

    if (_body.cmd === 'oauth-code') {
      // got oauth code [step 1]
      handleOAuthCode({ req, res, data: _body.data })
    } else {
      global.process.stdout(_body)
    }
  })
}

function handleOAuthCode({ req, res, data }) {
  const outStr = ['\\', '|', '-', '/']
  let outIdx = 0
  const postData = querystring.stringify({
    client_id: config.client_id,
    client_secret: config.client_secret,
    code: data.code,
    redirect_uri: config.redirect_uri,
    state: data.state,
  })
  let reslut = ''
  const { hostname, path } = config.OAuthAccessToken
  const request = https.request({
    method: 'POST',
    hostname,
    path,
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
      'Content-length': Buffer.byteLength(postData)
    }
  }, res2 => {
    console.log('[request statusCode]', res2.statusCode)
    // console.log('[request headers]', res2.headers)

    res2.setEncoding('utf-8')
    res2.on('information', info => {
      console.log(info)
    })
    res2.on('data', chunk => {
      reslut += chunk
      global.process.stdout.write(outStr[outIdx = ++outIdx % outStr.length])
    })
    res2.on('end', () => {
      let data = querystring.decode(reslut.toString())
      // fs.writeFileSync(config.writePath('access-token.html'), reslut.toString())
      console.log('[request on-end]', data)
      responseXhr({ req, res, data: { data } })
    })
  }).on('error', e => {
    console.log(e)
    const data = { code: 500, msg: e, }

    responseXhr({ req, res, data })
  })

  console.log(`[${config.OAuthAccessToken.host}]`, postData)

  request.write(postData)
  request.end()
}

function responseXhr({ req, res, data }) {
  const _data = { code: 200, msg: '', data: null }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.write(JSON.stringify({ ..._data, ...data }))
  res.end()
}

function handleHtml({ req, res, urlObj }) {
  let html = '^_^'
  const r = urlObj.path.match(/.*\/(\w+)\.html/)
  let filename = r ? r[1] : null

  if (urlObj.pathname === '/') filename = 'index'
  if (filename) {
    html = fs.readFileSync(path.join(__dirname, `${filename}.html`), 'utf-8')
    if (urlObj.search) {
      html += `<pre>${
        JSON.stringify(querystring.parse(urlObj.search.replace('?', '')), null, 2)
        }</pre>`
    }
    responseHtml({ req, res, data: html })
  } else {
    handle404({ req, res })
  }
}

function responseHtml({ req, res, data }) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.write(data)
  res.end()
}

function handle404({ req, res, urlObj }) {
  const html = `<h2 style="color:#ff6f6c">404 - What are you 想干啥 o(*￣▽￣*)o</h2>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.writeHead(404)
  res.write(html)
  res.end()
}
