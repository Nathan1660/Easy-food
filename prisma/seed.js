require("dotenv").config();
const prisma = require("../src/database/prisma");

async function main() {
  const ownerEmail = process.argv[2];
  if (!ownerEmail) {
    throw new Error("Uso: node prisma/seed.js EMAIL_DO_USUARIO_CADASTRADO");
  }

  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    throw new Error("Cadastre o usuário proprietário antes de carregar os exemplos.");
  }

  const restaurants = [
    { name: "Pizzaria Napoli", category: "Pizza", rating: 4.5 },
    { name: "Burger House", category: "Burger", rating: 4.2 },
    { name: "Sushi Express", category: "Japonesa", rating: 4.8 }
  ];

  await prisma.$transaction(async (tx) => {
    for (const data of restaurants) {
      const where = { ownerId: owner.id, name: data.name };
      if (!await tx.restaurant.findFirst({ where })) {
        await tx.restaurant.create({ data: { ...data, ownerId: owner.id } });
      }
    }
  });
  console.log("Restaurantes de exemplo disponíveis para " + ownerEmail);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
