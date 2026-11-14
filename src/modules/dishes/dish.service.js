const prisma = require("../../database/prisma");
const imageService = require("../shared/image.service");

function validateDish(data) {
  if (typeof data?.name !== "string" || !data.name.trim()) {
    const error = new Error("Nome é obrigatório");
    error.statusCode = 400;
    throw error;
  }
  if (data.category != null && (typeof data.category !== "string" || !data.category.trim())) {
    const error = new Error("Categoria inválida");
    error.statusCode = 400;
    throw error;
  }
  if (typeof data.description !== "string") {
    const error = new Error("Descrição inválida");
    error.statusCode = 400;
    throw error;
  }
  const price = Number(data.price);
  if (
    (typeof data.price !== "number" &&
      (typeof data.price !== "string" || !data.price.trim())) ||
    !Number.isFinite(price) ||
    price < 0 ||
    Number(price.toFixed(2)) > 99_999_999.99
  ) {
    const error = new Error("Preço inválido");
    error.statusCode = 400;
    throw error;
  }
  return {
    name: data.name.trim(),
    category: data.category === null ? null : data.category?.trim(),
    description: data.description,
    price: price.toFixed(2)
  };
}

function parseId(value) {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isInteger(id) || id <= 0 || id > 2_147_483_647) {
    const error = new Error("Identificador inválido");
    error.statusCode = 400;
    throw error;
  }
  return id;
}


function ensureOwnership(restaurant, userId) {
  if (restaurant.ownerId !== userId) {
    const error = new Error("Você não tem permissão para gerenciar este restaurante");
    error.statusCode = 403;
    throw error;
  }
}


async function getDishWithRestaurant(dishId) {
  const id = parseId(dishId);
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: { restaurant: true }
  });
  if (!dish) {
    const error = new Error("Prato não encontrado");
    error.statusCode = 404;
    throw error;
  }
  return dish;
}

async function createDish(restaurantId, data, userId) {
  const id = parseId(restaurantId);
  const validated = validateDish(data);
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) {
    const error = new Error("Restaurante não encontrado");
    error.statusCode = 404;
    throw error;
  }

  ensureOwnership(restaurant, userId);

  return prisma.dish.create({
    data: { ...validated, restaurantId: id }
  });
}

async function listDishes(restaurantId) {
  const id = parseId(restaurantId);
  return prisma.dish.findMany({
    where: { restaurantId: id },
    orderBy: { id: "asc" }
  });
}

async function getDish(dishId) {
  const id = parseId(dishId);
  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish) {
    const error = new Error("Prato não encontrado");
    error.statusCode = 404;
    throw error;
  }
  return dish;
}

async function updateDish(dishId, data, userId) {
  const validated = validateDish(data);
  const dish = await getDishWithRestaurant(dishId);

  ensureOwnership(dish.restaurant, userId);

  return prisma.dish.update({
    where: { id: dish.id },
    data: validated
  });
}

async function deleteDish(dishId, userId) {
  const dish = await getDishWithRestaurant(dishId);

  ensureOwnership(dish.restaurant, userId);

  const deleted = await prisma.dish.delete({ where: { id: dish.id } });
  await imageService.removeImage(deleted.imageUrl);
}

async function uploadDishImage(dishId, buffer, userId) {
  const dish = await getDishWithRestaurant(dishId);
  ensureOwnership(dish.restaurant, userId);

  const imageUrl = await imageService.optimizeImage(buffer, "dish");
  let updated;
  try {
    // Evita substituir uma imagem alterada por outro upload durante a otimização.
    updated = await prisma.dish.update({
      where: { id: dish.id, imageUrl: dish.imageUrl },
      data: { imageUrl }
    });
  } catch (error) {
    await imageService.removeImage(imageUrl);
    if (error.code === "P2025") {
      throw Object.assign(new Error("O prato foi alterado durante o envio"), { statusCode: 409 });
    }
    throw error;
  }

  await imageService.removeImage(dish.imageUrl);
  return updated;
}

module.exports = {
  uploadDishImage,
  createDish,
  listDishes,
  getDish,
  updateDish,
  deleteDish,
  parseId
};