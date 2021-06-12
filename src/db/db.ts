import { createConnection } from 'typeorm'

export const connect = async () => {
  const connection = await createConnection()
}
