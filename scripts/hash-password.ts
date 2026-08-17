import { hashPassword } from '../src/lib/password'

/**
 * Genera el valor de ADMIN_PASSWORD_HASH.
 *
 *   pnpm hash:password 'la-contraseña'
 *
 * El hash se pega en la variable de entorno del despliegue. La contraseña en
 * claro no se guarda en ninguna parte del repositorio.
 */
async function main(): Promise<void> {
  const password = process.argv[2]

  if (!password) {
    console.error("Uso: pnpm hash:password 'tu-contraseña'")
    process.exitCode = 1
    return
  }

  if (password.length < 12) {
    console.error('Usa al menos 12 caracteres.')
    process.exitCode = 1
    return
  }

  console.log(await hashPassword(password))
}

void main()
