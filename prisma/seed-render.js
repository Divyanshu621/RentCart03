/**
 * Production Seed Script for Render
 * Self-contained - uses PrismaClient directly (no src/ imports)
 * Run with: node prisma/seed-render.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000);
const daysFromNow = (n) => new Date(now.getTime() + n * 86400000);

async function seed() {
  console.log('🌱 Seeding production database...');

  // Check if already seeded
  const userCount = await prisma.user.count();
  if (userCount > 2) {
    console.log(`✅ Database already has ${userCount} users, skipping seed`);
    return;
  }

  // 1. States
  console.log('→ Creating states...');
  const statesData = [
    { name: 'Delhi', code: 'DL' }, { name: 'Maharashtra', code: 'MH' },
    { name: 'Karnataka', code: 'KA' }, { name: 'Tamil Nadu', code: 'TN' },
    { name: 'Gujarat', code: 'GJ' }, { name: 'Rajasthan', code: 'RJ' },
    { name: 'Kerala', code: 'KL' }, { name: 'West Bengal', code: 'WB' },
    { name: 'Telangana', code: 'TS' }, { name: 'Uttar Pradesh', code: 'UP' },
  ];
  const states = {};
  for (const s of statesData) {
    states[s.code] = await prisma.state.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }

  // 2. Cities
  console.log('→ Creating cities...');
  const citiesData = {
    DL: ['New Delhi', 'Dwarka', 'Rohini'],
    MH: ['Mumbai', 'Pune', 'Nagpur'],
    KA: ['Bangalore', 'Mysore', 'Mangalore'],
    TN: ['Chennai', 'Coimbatore', 'Madurai'],
    GJ: ['Ahmedabad', 'Surat', 'Vadodara'],
    RJ: ['Jaipur', 'Udaipur', 'Jodhpur'],
    KL: ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
    WB: ['Kolkata', 'Howrah', 'Durgapur'],
    TS: ['Hyderabad', 'Warangal', 'Nizamabad'],
    UP: ['Lucknow', 'Noida', 'Agra'],
  };
  const cities = {};
  for (const [stateCode, cityNames] of Object.entries(citiesData)) {
    for (const cityName of cityNames) {
      const key = `${stateCode}-${cityName}`;
      cities[key] = await prisma.city.create({
        data: { name: cityName, stateId: states[stateCode].id },
      });
    }
  }

  // 3. Categories
  console.log('→ Creating categories...');
  const catsData = [
    { name: 'Electronics', slug: 'electronics', icon: 'Smartphone' },
    { name: 'Laptops', slug: 'laptops', icon: 'Laptop' },
    { name: 'Cameras', slug: 'cameras', icon: 'Camera' },
    { name: 'Gaming', slug: 'gaming', icon: 'Gamepad2' },
    { name: 'Sports', slug: 'sports', icon: 'Dumbbell' },
    { name: 'Furniture', slug: 'furniture', icon: 'Armchair' },
    { name: 'Tools', slug: 'tools', icon: 'Wrench' },
    { name: 'Vehicles', slug: 'vehicles', icon: 'Car' },
    { name: 'Home Appliances', slug: 'home-appliances', icon: 'Refrigerator' },
    { name: 'Bikes', slug: 'bikes', icon: 'Bike' },
    { name: 'Camping', slug: 'camping', icon: 'Tent' },
    { name: 'Party Equipment', slug: 'party-equipment', icon: 'PartyPopper' },
  ];
  const cats = {};
  for (const c of catsData) {
    cats[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // 4. Users
  console.log('→ Creating users...');
  const pw1 = await bcrypt.hash('admin123', 10);
  const pw2 = await bcrypt.hash('password123', 10);
  const users = {};

  users.admin = await prisma.user.upsert({
    where: { email: 'admin@rentcart.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@rentcart.com', passwordHash: pw1, role: 'SUPER_ADMIN', isVerified: true, isActive: true, trustScore: 100, stateId: states.DL.id, cityId: cities['DL-New Delhi'].id },
  });

  const ownerData = [
    { name: 'Raj Sharma', email: 'owner1@rentcart.com', state: 'MH', city: 'MH-Mumbai' },
    { name: 'Priya Patel', email: 'owner2@rentcart.com', state: 'KA', city: 'KA-Bangalore' },
    { name: 'Amit Kumar', email: 'owner3@rentcart.com', state: 'DL', city: 'DL-New Delhi' },
  ];
  for (const o of ownerData) {
    users[o.email] = await prisma.user.upsert({
      where: { email: o.email },
      update: {},
      create: { name: o.name, email: o.email, passwordHash: pw2, role: 'OWNER', isVerified: true, isActive: true, trustScore: 80, stateId: states[o.state].id, cityId: cities[o.city].id },
    });
  }

  const custData = [
    { name: 'Sneha Reddy', email: 'customer1@rentcart.com', state: 'TS', city: 'TS-Hyderabad' },
    { name: 'Vikram Singh', email: 'customer2@rentcart.com', state: 'RJ', city: 'RJ-Jaipur' },
    { name: 'Ananya Das', email: 'customer3@rentcart.com', state: 'WB', city: 'WB-Kolkata' },
    { name: 'Rohit Mehta', email: 'customer4@rentcart.com', state: 'GJ', city: 'GJ-Ahmedabad' },
    { name: 'Kavita Nair', email: 'customer5@rentcart.com', state: 'KL', city: 'KL-Kochi' },
  ];
  for (const c of custData) {
    users[c.email] = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { name: c.name, email: c.email, passwordHash: pw2, role: 'CUSTOMER', isVerified: true, isActive: true, trustScore: 50, stateId: states[c.state].id, cityId: cities[c.city].id },
    });
  }

  // 5. Products
  console.log('→ Creating products...');
  const productsData = [
    { title: 'Canon EOS R6 Mark II', slug: 'canon-eos-r6', cat: 'cameras', owner: 'owner1@rentcart.com', brand: 'Canon', dailyPrice: 1500, deposit: 5000, state: 'MH', city: 'MH-Mumbai', desc: 'Professional mirrorless camera with 24.2MP sensor, 4K video, and incredible autofocus.' },
    { title: 'Sony A7 IV Full Frame', slug: 'sony-a7iv', cat: 'cameras', owner: 'owner1@rentcart.com', brand: 'Sony', dailyPrice: 1800, deposit: 6000, state: 'MH', city: 'MH-Mumbai', desc: 'Full-frame mirrorless camera with 33MP sensor and real-time eye AF.' },
    { title: 'MacBook Pro 16" M3', slug: 'macbook-pro-16', cat: 'laptops', owner: 'owner2@rentcart.com', brand: 'Apple', dailyPrice: 2500, deposit: 15000, state: 'KA', city: 'KA-Bangalore', desc: 'MacBook Pro with M3 Pro chip, 18GB RAM, 512GB SSD.' },
    { title: 'Dell XPS 15', slug: 'dell-xps-15', cat: 'laptops', owner: 'owner2@rentcart.com', brand: 'Dell', dailyPrice: 1200, deposit: 8000, state: 'KA', city: 'KA-Bangalore', desc: 'Dell XPS 15 with Intel i7, 16GB RAM, stunning OLED display.' },
    { title: 'PS5 Console + 2 Controllers', slug: 'ps5-console', cat: 'gaming', owner: 'owner3@rentcart.com', brand: 'Sony', dailyPrice: 800, deposit: 5000, state: 'DL', city: 'DL-New Delhi', desc: 'PlayStation 5 disc edition with 2 DualSense controllers and 3 games.' },
    { title: 'Xbox Series X', slug: 'xbox-series-x', cat: 'gaming', owner: 'owner3@rentcart.com', brand: 'Microsoft', dailyPrice: 700, deposit: 4000, state: 'DL', city: 'DL-New Delhi', desc: 'Xbox Series X with Game Pass Ultimate, 1TB storage.' },
    { title: 'DJI Mavic 3 Pro Drone', slug: 'dji-mavic-3', cat: 'electronics', owner: 'owner1@rentcart.com', brand: 'DJI', dailyPrice: 3000, deposit: 20000, state: 'MH', city: 'MH-Mumbai', desc: 'Professional drone with Hasselblad camera, 43 min flight time.' },
    { title: 'Honda Activa 6G', slug: 'honda-activa-6g', cat: 'bikes', owner: 'owner2@rentcart.com', brand: 'Honda', dailyPrice: 400, deposit: 2000, state: 'KA', city: 'KA-Bangalore', desc: 'Honda Activa 6G scooter, well maintained, excellent mileage.' },
    { title: 'Royal Enfield Classic 350', slug: 'royal-enfield-350', cat: 'bikes', owner: 'owner3@rentcart.com', brand: 'Royal Enfield', dailyPrice: 700, deposit: 5000, state: 'DL', city: 'DL-New Delhi', desc: 'Classic Royal Enfield 350cc, perfect for highway rides.' },
    { title: 'Camping Tent 4-Person', slug: 'camping-tent-4p', cat: 'camping', owner: 'owner1@rentcart.com', brand: 'Coleman', dailyPrice: 300, deposit: 1000, state: 'MH', city: 'MH-Pune', desc: 'Waterproof 4-person tent with rainfly and carrying bag.' },
    { title: 'IKEA King Bed Frame', slug: 'ikea-king-bed', cat: 'furniture', owner: 'owner2@rentcart.com', brand: 'IKEA', dailyPrice: 200, deposit: 3000, state: 'KA', city: 'KA-Bangalore', desc: 'MALM king bed frame with headboard, black-brown.' },
    { title: 'DeWalt Power Drill Set', slug: 'dewalt-drill-set', cat: 'tools', owner: 'owner3@rentcart.com', brand: 'DeWalt', dailyPrice: 250, deposit: 2000, state: 'DL', city: 'DL-Dwarka', desc: 'DeWalt 20V MAX drill/driver kit with 2 batteries and case.' },
    { title: 'Samsung 55" Smart TV', slug: 'samsung-55-tv', cat: 'home-appliances', owner: 'owner1@rentcart.com', brand: 'Samsung', dailyPrice: 500, deposit: 5000, state: 'MH', city: 'MH-Mumbai', desc: 'Samsung 55" Crystal UHD 4K Smart TV with Tizen OS.' },
    { title: 'Maruti Swift for Rent', slug: 'maruti-swift', cat: 'vehicles', owner: 'owner2@rentcart.com', brand: 'Maruti', dailyPrice: 1200, deposit: 5000, state: 'KA', city: 'KA-Bangalore', desc: 'Maruti Swift VXI, well maintained, perfect for city drives.' },
    { title: 'Party Sound System JBL', slug: 'jbl-party-speaker', cat: 'party-equipment', owner: 'owner3@rentcart.com', brand: 'JBL', dailyPrice: 600, deposit: 3000, state: 'DL', city: 'DL-New Delhi', desc: 'JBL PartyBox 310 with powerful bass, Bluetooth, and karaoke.' },
    { title: 'Yoga Mat + Accessories Kit', slug: 'yoga-mat-kit', cat: 'sports', owner: 'owner1@rentcart.com', brand: 'Decathlon', dailyPrice: 100, deposit: 500, state: 'MH', city: 'MH-Pune', desc: 'Premium yoga mat with blocks, strap, and carrying bag.' },
    { title: 'GoPro Hero 12 Black', slug: 'gopro-hero-12', cat: 'cameras', owner: 'owner2@rentcart.com', brand: 'GoPro', dailyPrice: 500, deposit: 3000, state: 'KA', city: 'KA-Mysore', desc: 'GoPro Hero 12 with 5.3K video, HyperSmooth 6.0.' },
    { title: 'iPad Pro 12.9" M2', slug: 'ipad-pro-129', cat: 'laptops', owner: 'owner3@rentcart.com', brand: 'Apple', dailyPrice: 1000, deposit: 8000, state: 'DL', city: 'DL-Rohini', desc: 'iPad Pro 12.9" with M2 chip, 256GB, Apple Pencil compatible.' },
    { title: 'Cricket Kit Full Set', slug: 'cricket-kit', cat: 'sports', owner: 'owner1@rentcart.com', brand: 'SG', dailyPrice: 200, deposit: 1000, state: 'MH', city: 'MH-Nagpur', desc: 'Full cricket kit: bat, pads, gloves, helmet, guards, bag.' },
    { title: 'Projector Epson Full HD', slug: 'epson-projector', cat: 'electronics', owner: 'owner2@rentcart.com', brand: 'Epson', dailyPrice: 600, deposit: 4000, state: 'KA', city: 'KA-Bangalore', desc: 'Epson Full HD 1080p projector, 3000 lumens, perfect for presentations.' },
    { title: 'Washing Machine LG 8kg', slug: 'lg-washing-machine', cat: 'home-appliances', owner: 'owner3@rentcart.com', brand: 'LG', dailyPrice: 300, deposit: 4000, state: 'DL', city: 'DL-New Delhi', desc: 'LG 8kg Fully Automatic Front Load washing machine.' },
    { title: 'Mountain Bike Firefox', slug: 'firefox-mountain-bike', cat: 'bikes', owner: 'owner1@rentcart.com', brand: 'Firefox', dailyPrice: 350, deposit: 2000, state: 'MH', city: 'MH-Pune', desc: 'Firefox mountain bike with 21-speed Shimano gears.' },
    { title: 'Nintendo Switch OLED', slug: 'nintendo-switch-oled', cat: 'gaming', owner: 'owner2@rentcart.com', brand: 'Nintendo', dailyPrice: 500, deposit: 3000, state: 'KA', city: 'KA-Bangalore', desc: 'Nintendo Switch OLED with 3 popular games included.' },
    { title: 'Microwave LG 32L', slug: 'lg-microwave', cat: 'home-appliances', owner: 'owner3@rentcart.com', brand: 'LG', dailyPrice: 150, deposit: 2000, state: 'DL', city: 'DL-Dwarka', desc: 'LG 32L Convection Microwave with auto cook menus.' },
    { title: 'Telescope Celestron 130EQ', slug: 'celestron-telescope', cat: 'electronics', owner: 'owner1@rentcart.com', brand: 'Celestron', dailyPrice: 400, deposit: 3000, state: 'MH', city: 'MH-Mumbai', desc: 'Celestron AstroMaster 130EQ reflector telescope.' },
    { title: 'Sofa Set 3+1+1', slug: 'sofa-set-311', cat: 'furniture', owner: 'owner2@rentcart.com', brand: 'Wakefit', dailyPrice: 300, deposit: 5000, state: 'KA', city: 'KA-Bangalore', desc: '3+1+1 sofa set in grey fabric, comfortable and stylish.' },
    { title: 'Paint Sprayer Wagner', slug: 'wagner-paint-sprayer', cat: 'tools', owner: 'owner3@rentcart.com', brand: 'Wagner', dailyPrice: 350, deposit: 2000, state: 'DL', city: 'DL-New Delhi', desc: 'Wagner Flexio 590 paint sprayer for walls and furniture.' },
    { title: 'DSLR Nikon D7500', slug: 'nikon-d7500', cat: 'cameras', owner: 'owner1@rentcart.com', brand: 'Nikon', dailyPrice: 900, deposit: 4000, state: 'MH', city: 'MH-Pune', desc: 'Nikon D7500 DSLR with 18-140mm VR lens kit.' },
    { title: 'Inflatable Bounce House', slug: 'bounce-house', cat: 'party-equipment', owner: 'owner2@rentcart.com', brand: 'Little Tikes', dailyPrice: 1500, deposit: 5000, state: 'KA', city: 'KA-Bangalore', desc: 'Large inflatable bounce house for kids parties, blower included.' },
    { title: 'AC Daikin 1.5 Ton', slug: 'daikin-ac-15ton', cat: 'home-appliances', owner: 'owner3@rentcart.com', brand: 'Daikin', dailyPrice: 500, deposit: 5000, state: 'DL', city: 'DL-New Delhi', desc: 'Daikin 1.5 Ton 5 Star Inverter Split AC.' },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        title: p.title,
        slug: p.slug,
        description: p.desc,
        brand: p.brand,
        categoryId: cats[p.cat].id,
        ownerId: users[p.owner].id,
        dailyPrice: p.dailyPrice,
        weeklyPrice: p.dailyPrice * 6.5,
        securityDeposit: p.deposit,
        minRentalDays: 1,
        maxRentalDays: 30,
        stateId: states[p.state].id,
        cityId: cities[p.city].id,
        status: 'APPROVED',
        condition: ['GOOD', 'LIKE_NEW', 'NEW'][Math.floor(Math.random() * 3)],
      },
    });
  }

  // 6. Notifications for admin
  console.log('→ Creating notifications...');
  await prisma.notification.createMany({
    data: [
      { userId: users.admin.id, title: 'Welcome to RentCart!', message: 'Your marketplace is ready. Start exploring!', type: 'SYSTEM' },
      { userId: users.admin.id, title: 'New Listing Pending', message: 'A new product listing is awaiting your review.', type: 'RENTAL_REQUEST' },
    ],
    skipDuplicates: true,
  });

  // Summary
  const productCount = await prisma.product.count();
  const stateCount = await prisma.state.count();
  const cityCount = await prisma.city.count();
  const categoryCount = await prisma.category.count();
  console.log(`\n✅ Seed complete!`);
  console.log(`   ${stateCount} states, ${cityCount} cities`);
  console.log(`   ${categoryCount} categories`);
  console.log(`   ${userCount + ownerData.length + custData.length} users`);
  console.log(`   ${productCount} products`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exit(0); // Don't crash the server
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
