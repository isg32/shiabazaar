#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { readdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function attachCovers() {
  const outputDir = '/home/isg32/dev/shiabazaar_script/output';
  const files = readdirSync(outputDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  let uploaded = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`Found ${files.length} cover images in ${outputDir}\n`);

  for (const filename of files) {
    const slug = filename.replace(/\.(jpg|png)$/i, '');
    const filePath = path.join(outputDir, filename);

    try {
      // Find product by slug
      const product = await prisma.product.findFirst({
        where: { slug },
        include: { images: { where: { isCover: true } } },
      });

      if (!product) {
        console.log(`[SKIP] ${filename}: product not found (slug: ${slug})`);
        skipped++;
        continue;
      }

      // Upload to Cloudinary
      const folder = `shiabazaar/products/${slug}`;
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'auto',
        overwrite: false,
      });

      const { secure_url, public_id } = result;

      // Delete old cover if exists
      if (product.images.length > 0) {
        await prisma.productImage.deleteMany({
          where: { productId: product.id, isCover: true },
        });
      }

      // Create new cover image
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: secure_url,
          cloudinaryId: public_id,
          isCover: true,
          position: 0,
        },
      });

      console.log(`[OK] ${filename} → ${product.name} (${product.id})`);
      uploaded++;
    } catch (err) {
      console.log(`[FAIL] ${filename}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Uploaded & attached: ${uploaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${files.length}`);

  await prisma.$disconnect();
}

attachCovers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
