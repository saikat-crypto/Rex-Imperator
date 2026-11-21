const sharp = require('sharp');

const inputPath = 'C:/Users/HP/.gemini/antigravity/brain/d1686c82-7e19-4748-a078-85f73cbd2989/.user_uploaded/media_1795015696755_3dcef83c.png';
const outputPath = 'e:/Antigravity/Usher/public/logo-transparent.png';

sharp(inputPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
        data[i+3] = 0;
      }
    }
    return sharp(data, { raw: info }).png().toFile(outputPath);
  })
  .then(() => console.log('Logo processed with transparency successfully'))
  .catch(err => console.error('Error processing logo:', err));
