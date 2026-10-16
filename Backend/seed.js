require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
const mongoose = require('mongoose');
const Product = require('./models/Product');

const locations = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali', 'Medan', 'Semarang'];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const price = (min, max) => Math.floor(Math.random() * (max - min + 1) + min) * 1000;

const imgSeeds = {
  tops:      ['fashion-tshirt','streetwear-top','minimal-shirt','tokyo-tee','dark-overshirt','monochrome-top','layered-top','loose-shirt'],
  bottoms:   ['dark-pants','cargo-trousers','minimal-jeans','wide-leg','tapered-pants','black-jogger','pleated-trouser','slim-bottom'],
  footwear:  ['sneakers-dark','minimal-shoes','black-boots','leather-loafer','chunky-sole','low-top-shoes','canvas-sneaker','runner-shoe'],
  outerwear: ['black-jacket','oversized-coat','minimal-hoodie','leather-jacket','trench-coat','bomber-jacket','zip-hoodie','puffer-coat'],
  bags:      ['minimal-bag','black-tote','leather-backpack','crossbody-bag','shoulder-bag','canvas-bag','mesh-bag','utility-pouch'],
  accessories: ['minimal-cap','silver-ring','dark-sunglasses','leather-belt','knit-beanie','chain-necklace','woven-bracelet','minimal-watch'],
  dresses:   ['minimal-dress','dark-midi','slip-dress','oversized-dress','linen-dress','wrap-dress','asymmetric-dress','sheer-dress'],
  sportswear: ['sport-jacket','athletic-shorts','compression-top','running-tee','sport-hoodie','gym-pants','sport-set','training-wear'],
};

const products = [
  { title: 'Kuroyu Essential Tee — Obsidian', category: 'tops', price: price(150,300), discount: 0 },
  { title: 'Oversized Monochrome Shirt', category: 'tops', price: price(200,400), discount: 10 },
  { title: 'Tokyo Layered Long-Sleeve', category: 'tops', price: price(180,350), discount: 15 },
  { title: 'Minimal Linen Overshirt', category: 'tops', price: price(300,550), discount: 0 },
  { title: 'Dark Wash Graphic Tee', category: 'tops', price: price(120,250), discount: 20 },
  { title: 'Relaxed Fit Oxford Shirt', category: 'tops', price: price(280,480), discount: 0 },
  { title: 'Kuroyu Cropped Polo', category: 'tops', price: price(190,340), discount: 5 },
  { title: 'Ribbed Sleeveless Top', category: 'tops', price: price(100,200), discount: 0 },

  { title: 'Straight-Cut Cargo Trousers', category: 'bottoms', price: price(320,580), discount: 0 },
  { title: 'Tapered Wide-Leg Pants', category: 'bottoms', price: price(280,500), discount: 10 },
  { title: 'Pleated Charcoal Trousers', category: 'bottoms', price: price(350,650), discount: 0 },
  { title: 'Black Slim Denim', category: 'bottoms', price: price(290,520), discount: 15 },
  { title: 'Utility Jogger — Slate', category: 'bottoms', price: price(220,400), discount: 0 },
  { title: 'Woven Linen Shorts', category: 'bottoms', price: price(150,280), discount: 0 },
  { title: 'Kuroyu Relaxed Chinos', category: 'bottoms', price: price(300,540), discount: 5 },
  { title: 'Drawstring Track Pants', category: 'bottoms', price: price(200,360), discount: 20 },

  { title: 'Kuroyu Low-Top Canvas', category: 'footwear', price: price(380,680), discount: 0 },
  { title: 'Minimal Leather Derby', category: 'footwear', price: price(580,980), discount: 10 },
  { title: 'Chunky Sole Sneaker — Black', category: 'footwear', price: price(450,820), discount: 0 },
  { title: 'Suede Chelsea Boot', category: 'footwear', price: price(620,1100), discount: 15 },
  { title: 'Slip-On Runner', category: 'footwear', price: price(280,480), discount: 0 },
  { title: 'Woven Loafer — Charcoal', category: 'footwear', price: price(420,750), discount: 5 },
  { title: 'Kuroyu Trail Sneaker', category: 'footwear', price: price(520,880), discount: 0 },
  { title: 'Sock-Fit Ankle Boot', category: 'footwear', price: price(680,1200), discount: 20 },

  { title: 'Kuroyu Oversized Coach Jacket', category: 'outerwear', price: price(580,1100), discount: 0 },
  { title: 'Wool Blend Overcoat — Charcoal', category: 'outerwear', price: price(1200,2200), discount: 10 },
  { title: 'Technical Zip Hoodie', category: 'outerwear', price: price(420,780), discount: 0 },
  { title: 'Minimal Bomber Jacket', category: 'outerwear', price: price(680,1250), discount: 15 },
  { title: 'Belted Trench Coat', category: 'outerwear', price: price(980,1800), discount: 0 },
  { title: 'Fleece Puffer — Midnight', category: 'outerwear', price: price(520,950), discount: 20 },
  { title: 'Nylon Shell Jacket', category: 'outerwear', price: price(480,880), discount: 0 },
  { title: 'Leather Moto Jacket', category: 'outerwear', price: price(1500,2800), discount: 5 },

  { title: 'Kuroyu Canvas Tote — Black', category: 'bags', price: price(180,380), discount: 0 },
  { title: 'Minimal Leather Backpack', category: 'bags', price: price(680,1300), discount: 10 },
  { title: 'Crossbody Utility Pouch', category: 'bags', price: price(220,420), discount: 0 },
  { title: 'Waxed Messenger Bag', category: 'bags', price: price(520,980), discount: 15 },
  { title: 'Micro Shoulder Bag', category: 'bags', price: price(280,520), discount: 0 },
  { title: 'Ripstop Daypack', category: 'bags', price: price(380,680), discount: 0 },
  { title: 'Leather Belt Bag', category: 'bags', price: price(320,580), discount: 5 },
  { title: 'Kuroyu Zip Tote — Slate', category: 'bags', price: price(250,480), discount: 20 },

  { title: 'Structured Baseball Cap', category: 'accessories', price: price(120,250), discount: 0 },
  { title: 'Silver Chain Necklace', category: 'accessories', price: price(180,380), discount: 10 },
  { title: 'Woven Leather Belt', category: 'accessories', price: price(220,420), discount: 0 },
  { title: 'Minimal Shield Sunglasses', category: 'accessories', price: price(280,560), discount: 15 },
  { title: 'Kuroyu Knit Beanie', category: 'accessories', price: price(80,180), discount: 0 },
  { title: 'Stacked Ring Set — Silver', category: 'accessories', price: price(120,280), discount: 5 },
  { title: 'Waffle Knit Scarf', category: 'accessories', price: price(150,320), discount: 0 },
  { title: 'Canvas Snap-Back', category: 'accessories', price: price(100,220), discount: 20 },

  { title: 'Minimal Slip Dress — Onyx', category: 'dresses', price: price(280,520), discount: 0 },
  { title: 'Oversized Shirt Dress', category: 'dresses', price: price(320,580), discount: 10 },
  { title: 'Asymmetric Hem Midi', category: 'dresses', price: price(380,720), discount: 0 },
  { title: 'Linen Wrap Dress', category: 'dresses', price: price(280,500), discount: 15 },
  { title: 'Knit Column Dress', category: 'dresses', price: price(420,780), discount: 0 },
  { title: 'Sheer Layered Maxi', category: 'dresses', price: price(480,880), discount: 5 },
  { title: 'Kuroyu Utility Shift Dress', category: 'dresses', price: price(320,600), discount: 0 },
  { title: 'Draped Jersey Dress', category: 'dresses', price: price(250,480), discount: 20 },

  { title: 'Kuroyu Performance Set', category: 'sportswear', price: price(420,780), discount: 0 },
  { title: 'Compression Long-Sleeve', category: 'sportswear', price: price(220,420), discount: 10 },
  { title: 'Technical Track Jacket', category: 'sportswear', price: price(480,880), discount: 0 },
  { title: 'Athletic Shorts — 5"', category: 'sportswear', price: price(150,300), discount: 15 },
  { title: 'Seamless Sport Hoodie', category: 'sportswear', price: price(380,680), discount: 0 },
  { title: 'Gym Tight Leggings', category: 'sportswear', price: price(200,380), discount: 5 },
  { title: 'Windbreak Running Vest', category: 'sportswear', price: price(320,580), discount: 0 },
  { title: 'Training Jogger — Slate', category: 'sportswear', price: price(250,450), discount: 20 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Product.deleteMany({});
  console.log('Cleared existing products');

  const categorySeeds = {
    tops: imgSeeds.tops, bottoms: imgSeeds.bottoms, footwear: imgSeeds.footwear,
    outerwear: imgSeeds.outerwear, bags: imgSeeds.bags, accessories: imgSeeds.accessories,
    dresses: imgSeeds.dresses, sportswear: imgSeeds.sportswear,
  };

  const docs = products.map((p, i) => {
    const seeds = categorySeeds[p.category];
    const imgSeed = seeds[i % seeds.length];
    const originalPrice = p.discount > 0 ? Math.round(p.price / (1 - p.discount / 100) / 1000) * 1000 : 0;
    return {
      ...p,
      originalPrice,
      rating: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
      soldCount: Math.floor(Math.random() * 4800) + 200,
      isOfficial: Math.random() > 0.7,
      isPowerPro: Math.random() > 0.85,
      location: rand(locations),
      image: `https://picsum.photos/seed/${imgSeed}/400/500`,
      stock: Math.floor(Math.random() * 200) + 20,
    };
  });

  await Product.insertMany(docs);
  console.log(`Seeded ${docs.length} products`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
