import { startRelayServer } from '@aas/client-core'
import { resolvePaths } from '@aas/client-core'

const paths = resolvePaths()
startRelayServer({ aasHome: paths.aasHome })
