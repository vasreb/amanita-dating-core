import * as express from 'express'
import * as bodyParser from 'body-parser'
import { AddressInfo } from 'net'
/* import cors from 'cors'; */
import { connect } from './db/db'
import errorMiddleware from './utils/errorMiddleware'

import './utils/ConfigureMapper'

connect()

const app = express()

const HOST = '0.0.0.0'
const PORT = 4000
const SSL_PORT = 8443

const server = app.listen(PORT, HOST, () => {
  const { port, address } = server.address() as AddressInfo
  console.log('Server listening on:', 'http://' + address + ':' + port)
})

app.use(
  bodyParser.json({
    limit: '50mb',
    verify(req: any, res, buf, encoding) {
      req.rawBody = buf
    },
  })
)

export { app }

import './controllers/main'

app.use(errorMiddleware)
