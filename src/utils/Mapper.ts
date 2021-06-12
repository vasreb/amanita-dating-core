import { createMapper } from '@automapper/core'
import { classes } from '@automapper/classes'

const mapper = createMapper({
  name: 'mapper',
  pluginInitializer: classes,
})

export default mapper
