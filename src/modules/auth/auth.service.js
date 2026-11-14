const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../../database/prisma");

const imageService = require("../shared/image.service");

const JWT_SECRET = process.env.JWT_SECRET;

// Cadastro: guarda o usuário com a senha em hash
async function register({ name, email, password }) {
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hash }
  });

  // Nunca devolvemos a senha
  return { id: user.id, name: user.name, email: user.email };
}

// Login: confere o e-mail, compara a senha e gera o token
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return null; // usuário não existe
  }

  const senhaConfere = await bcrypt.compare(password, user.password);

  if (!senhaConfere) {
    return null; // senha errada
  }

  // Gera o token com o id e email do usuário, válido por 1 dia
  const token = jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

const profileFields = { id: true, name: true, email: true, imageUrl: true };

async function getById(id) {
  return prisma.user.findUnique({ where: { id }, select: profileFields });
}

async function uploadProfileImage(id, buffer) {
  const user = await getById(id);
  if (!user) {
    throw Object.assign(new Error("Usuário não encontrado"), { statusCode: 404 });
  }

  const imageUrl = await imageService.optimizeImage(buffer, "profile");
  let updated;
  try {
    updated = await prisma.user.update({
      where: { id, imageUrl: user.imageUrl },
      data: { imageUrl },
      select: profileFields
    });
  } catch (error) {
    await imageService.removeImage(imageUrl);
    if (error.code === "P2025") {
      throw Object.assign(new Error("O perfil foi alterado durante o envio"), { statusCode: 409 });
    }
    throw error;
  }

  await imageService.removeImage(user.imageUrl);
  return updated;
}

module.exports = { register, login, getById, uploadProfileImage };
