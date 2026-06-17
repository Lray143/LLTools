const Jimp = require('jimp');

(async () => {
  try {
    const orig = await Jimp.read('public/Logo.png');
    
    // Instead of scaling the image up (which makes it blurry),
    // we just create a 256x256 transparent box...
    const canvas = new Jimp(256, 256, 0x00000000);
    
    // ...and perfectly center the 134x143 logo inside it WITHOUT resizing it!
    // This preserves 100% of the original crispness.
    const x = Math.floor((256 - orig.bitmap.width) / 2);
    const y = Math.floor((256 - orig.bitmap.height) / 2);
    
    canvas.composite(orig, x, y);
    
    await canvas.writeAsync('public/icon.png');
    console.log('Successfully created crisp 256x256 public/icon.png');
  } catch (err) {
    console.error(err);
  }
})();
