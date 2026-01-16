import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@empresa.com'; // <--- TU EMAIL DE ADMIN
  const password = 'admin123'; // <--- TU CONTRASEÑA DE ADMIN
  const hashedPassword = await bcrypt.hash(password, 10);

  // Intentar crear o actualizar si ya existe
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' }, // Si existe, lo vuelve admin
    create: {
      email,
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Crear su tablero si no tiene
  const board = await prisma.board.findFirst({ where: { ownerId: user.id } });
  if (!board) {
    await prisma.board.create({
      data: {
        title: 'Tablero Admin',
        ownerId: user.id,
        columns: {
          create: [
            { title: 'Pendiente', order: 0 },
            { title: 'Terminado', order: 1 },
          ],
        },
      },
    });
  }

  console.log('✅ Usuario Admin creado/actualizado con éxito.');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Pass: ${password}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
