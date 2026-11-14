const sharp = require("sharp");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");

const uploadsDirectory = path.resolve(__dirname, "../../../uploads");
const imageFolders = { dish: "dishes", profile: "profiles" };

async function optimizeImage(buffer, purpose) {
  const folder = imageFolders[purpose];
  const directory = path.join(uploadsDirectory, folder);
  let optimized;
  try {
    const image = sharp(buffer, { limitInputPixels: 25_000_000 });
    const { format } = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(format)) {
      throw new Error("Formato não permitido");
    }
    optimized = await image.rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw Object.assign(new Error("Imagem inválida ou formato não permitido"), { statusCode: 400 });
  }

  const filename = randomUUID() + ".webp";
  await fs.mkdir(directory, { recursive: true });
  const imageUrl = `/uploads/${folder}/${filename}`;
  try {
    await fs.writeFile(path.join(directory, filename), optimized, { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") {
      await removeImage(imageUrl);
    }
    throw error;
  }
  return imageUrl;
}

async function removeImage(imageUrl) {
  const match = /^\/uploads\/(dishes|profiles)\/([0-9a-f-]{36}\.webp)$/.exec(imageUrl);
  if (!match) {
    return;
  }

  try {
    const [, folder, filename] = match;
    await fs.rm(path.join(uploadsDirectory, folder, filename), { force: true });
  } catch (error) {
    console.error("Erro ao remover imagem:", error.message);
  }
}

module.exports = { optimizeImage, removeImage, uploadsDirectory };
