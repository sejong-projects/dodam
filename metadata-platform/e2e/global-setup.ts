import { execSync } from 'child_process'
import path from 'path'

export default function globalSetup() {
  const cwd = path.resolve(__dirname, '..')

  console.log('[global-setup] Resetting database...')
  execSync('npx prisma db push --force-reset --accept-data-loss', {
    cwd,
    stdio: 'inherit',
    env: { ...process.env },
  })

  console.log('[global-setup] Seeding database...')
  execSync('npm run db:seed', {
    cwd,
    stdio: 'inherit',
    env: { ...process.env },
  })
}
