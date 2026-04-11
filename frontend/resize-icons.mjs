import sharp from "sharp";

await sharp("public/logo.png").resize(512, 512).toFile("public/logo-512.png");
await sharp("public/logo.png").resize(192, 192).toFile("public/logo-192.png");

console.log("Done!");
