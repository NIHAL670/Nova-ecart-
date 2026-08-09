/**
 * Seed script — boots the DB and inserts demo categories, products and a
 * coupon so the frontend has real data on first run.
 *
 *   npm run seed   (from backend/)
 *
 * Idempotent: skips categories/products that already exist by slug, and
 * re-runs safely.
 */
import { connectDB, disconnectDB } from '../config/database';
import { findOrCreateAdmin } from '../services/auth.service';
import { Category, Product, Coupon } from '../models';
import { CouponType } from '../types/enums';
import { slugify } from '../utils/slugify';

// eslint-disable-next-line no-console
const log = (...args: unknown[]) => console.log(...args);

const CATEGORIES = [
  { name: 'Electronics', children: ['Headphones', 'Smartphones', 'Laptops', 'Wearables'] },
  { name: 'Fashion', children: ['Men', 'Women', 'Footwear', 'Accessories'] },
  { name: 'Home & Living', children: ['Furniture', 'Decor', 'Kitchen'] },
  { name: 'Beauty & Care', children: ['Skincare', 'Makeup', 'Haircare'] },
  { name: 'Sports & Outdoors', children: ['Fitness', 'Outdoor Gear'] },
];

interface DemoProduct {
  name: string;
  category: string;
  price: number;
  compareAt?: number;
  stock: number;
  tags: string[];
  featured?: boolean;
  bestSeller?: boolean;
  onSale?: boolean;
  rating?: number;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  { name: 'Noise-Cancelling Headphones Pro', category: 'Headphones', price: 199, compareAt: 249, stock: 40, tags: ['audio', 'wireless'], featured: true, bestSeller: true, onSale: true, rating: 4.8 },
  { name: 'Wireless Earbuds Air', category: 'Headphones', price: 89, compareAt: 119, stock: 120, tags: ['audio', 'wireless', 'portable'], featured: true, onSale: true, rating: 4.6 },
  { name: 'Studio Monitor Headset', category: 'Headphones', price: 149, stock: 30, tags: ['audio', 'studio'], rating: 4.5 },
  { name: 'Flagship Smartphone X', category: 'Smartphones', price: 899, stock: 25, tags: ['mobile', '5g'], featured: true, bestSeller: true, rating: 4.9 },
  { name: 'Ultrabook 14" Slim', category: 'Laptops', price: 999, compareAt: 1199, stock: 15, tags: ['laptop', 'work'], featured: true, onSale: true, rating: 4.7 },
  { name: 'Smart Watch Series 6', category: 'Wearables', price: 249, stock: 60, tags: ['watch', 'fitness'], featured: true, rating: 4.6 },
  { name: 'Classic Denim Jacket', category: 'Men', price: 79, compareAt: 99, stock: 90, tags: ['denim', 'jacket'], onSale: true, rating: 4.3 },
  { name: 'Running Shoes Flex', category: 'Footwear', price: 69, stock: 100, tags: ['shoes', 'running'], bestSeller: true, rating: 4.4 },
  { name: 'Leather Backpack', category: 'Accessories', price: 59, stock: 55, tags: ['bag', 'leather'], rating: 4.2 },
  { name: 'Modular Sofa Set', category: 'Furniture', price: 799, stock: 8, tags: ['furniture', 'sofa'], rating: 4.5 },
  { name: 'Ceramic Dinnerware Set', category: 'Kitchen', price: 45, stock: 70, tags: ['kitchen', 'tableware'], rating: 4.1 },
  { name: 'Vitamin C Serum', category: 'Skincare', price: 25, stock: 200, tags: ['skincare', 'serum'], bestSeller: true, rating: 4.7 },
];

/** Flipkart-style product templates — each is expanded into colour / capacity / size variants. */
interface ProductTemplate {
  name: string;
  price: number;
  compareAt?: number;
  stock: number;
  tags: string[];
  rating?: number;
  featured?: boolean;
  bestSeller?: boolean;
  onSale?: boolean;
}

/** Default variant suffixes applied per sub-category (mirrors how real marketplaces list SKUs). */
const DEFAULT_VARIANTS: Record<string, string[]> = {
  Headphones: ['Black', 'Silver', 'Navy'],
  Smartphones: ['64 GB', '128 GB', '256 GB'],
  Laptops: ['i5 / 8 GB', 'i7 / 16 GB', 'i7 / 32 GB'],
  Wearables: ['42 mm', '44 mm', '46 mm'],
  Men: ['S', 'M', 'L', 'XL'],
  Women: ['S', 'M', 'L'],
  Footwear: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
  Accessories: ['Black', 'Brown', 'Tan'],
  Furniture: ['Walnut', 'White', 'Grey'],
  Decor: ['White', 'Black', 'Beige'],
  Kitchen: ['1 L', '2 L', '3 L'],
  Skincare: ['30 ml', '50 ml', '100 ml'],
  Makeup: ['Rose', 'Nude', 'Berry'],
  Haircare: ['250 ml', '500 ml', '1 L'],
  Fitness: ['Standard', 'Pro', 'Elite'],
  'Outdoor Gear': ['Green', 'Orange', 'Olive'],
};

const TEMPLATES: Record<string, ProductTemplate[]> = {
  Headphones: [
    { name: 'Aura Wireless Over-Ear Headphones', price: 129, compareAt: 179, stock: 45, tags: ['audio', 'wireless'], rating: 4.6, featured: true, onSale: true },
    { name: 'Pulse Bluetooth Earbuds', price: 59, compareAt: 79, stock: 130, tags: ['audio', 'earbuds', 'wireless'], rating: 4.4, bestSeller: true },
    { name: 'Vertex Gaming Headset', price: 89, compareAt: 119, stock: 40, tags: ['audio', 'gaming'], rating: 4.5, featured: true },
    { name: 'Zeno ANC Headphones', price: 199, compareAt: 249, stock: 35, tags: ['audio', 'anc', 'wireless'], rating: 4.7, onSale: true },
    { name: 'Orb Studio Monitor Headset', price: 149, stock: 25, tags: ['audio', 'studio'], rating: 4.5 },
    { name: 'Lume Sports Earbuds', price: 49, stock: 90, tags: ['audio', 'sport', 'earbuds'], rating: 4.2, bestSeller: true },
    { name: 'Trail Bluetooth Neckband', price: 39, stock: 75, tags: ['audio', 'neckband'], rating: 4.1 },
    { name: 'Nova Air Earbuds Pro', price: 79, compareAt: 99, stock: 60, tags: ['audio', 'wireless', 'anc'], rating: 4.3, onSale: true },
    { name: 'Pulse Kids Headphones', price: 29, stock: 55, tags: ['audio', 'kids'], rating: 4.0 },
    { name: 'Vertex Wired Headset', price: 24, stock: 80, tags: ['audio', 'wired'], rating: 3.9 },
    { name: 'Zeno Music Party Speaker', price: 119, compareAt: 149, stock: 30, tags: ['audio', 'speaker'], rating: 4.4, featured: true, onSale: true },
  ],
  Smartphones: [
    { name: 'Zeno Nova 5G', price: 229, stock: 50, tags: ['mobile', '5g'], rating: 4.5, featured: true },
    { name: 'Pulse Max Smartphone', price: 149, stock: 90, tags: ['mobile'], rating: 4.2, bestSeller: true },
    { name: 'Aura Galaxy X', price: 399, compareAt: 459, stock: 35, tags: ['mobile', '5g', 'amoled'], rating: 4.8, featured: true, onSale: true },
    { name: 'Vertex Titan 5G', price: 549, stock: 20, tags: ['mobile', '5g', 'gaming'], rating: 4.7 },
    { name: 'Orb Mini Lite', price: 99, stock: 120, tags: ['mobile', 'budget'], rating: 4.0, bestSeller: true },
    { name: 'Zeno Note Pro', price: 279, compareAt: 329, stock: 45, tags: ['mobile', 'large-screen'], rating: 4.6, onSale: true },
    { name: 'Nova Flip Smart', price: 189, stock: 40, tags: ['mobile'], rating: 4.3 },
    { name: 'Pulse Camera King', price: 329, stock: 28, tags: ['mobile', 'camera'], rating: 4.4 },
    { name: 'Aura Edge 5G', price: 459, compareAt: 519, stock: 22, tags: ['mobile', '5g'], rating: 4.7, featured: true, onSale: true },
    { name: 'Trail Rugged Phone', price: 179, stock: 33, tags: ['mobile', 'rugged'], rating: 4.1 },
  ],
  Laptops: [
    { name: 'NovaBook Air 14', price: 699, compareAt: 799, stock: 18, tags: ['laptop', 'thin'], rating: 4.6, featured: true, onSale: true },
    { name: 'Vertex Gaming Laptop', price: 1099, stock: 12, tags: ['laptop', 'gaming'], rating: 4.7 },
    { name: 'AuraBook Pro 15', price: 849, stock: 15, tags: ['laptop', 'work'], rating: 4.5, bestSeller: true },
    { name: 'Orb Convertible 2-in-1', price: 799, compareAt: 949, stock: 10, tags: ['laptop', 'touch'], rating: 4.4, onSale: true },
    { name: 'Zeno Chromebook', price: 299, stock: 40, tags: ['laptop', 'budget'], rating: 4.1 },
    { name: 'Pulse Creator Laptop', price: 1249, stock: 8, tags: ['laptop', 'creator'], rating: 4.8 },
    { name: 'NovaBook Business 13', price: 749, stock: 14, tags: ['laptop', 'business'], rating: 4.3, featured: true },
    { name: 'Trail Ultra Slim', price: 899, compareAt: 1049, stock: 11, tags: ['laptop', 'ultrabook'], rating: 4.6, onSale: true },
  ],
  Wearables: [
    { name: 'Pulse Fitness Band', price: 49, stock: 150, tags: ['fitness', 'band'], rating: 4.2, bestSeller: true },
    { name: 'Aura Smart Watch', price: 129, compareAt: 169, stock: 80, tags: ['watch', 'fitness'], rating: 4.5, featured: true, onSale: true },
    { name: 'Vertex Smart Watch Pro', price: 199, stock: 45, tags: ['watch', 'premium'], rating: 4.7 },
    { name: 'Orb GPS Running Watch', price: 159, stock: 40, tags: ['watch', 'gps'], rating: 4.4 },
    { name: 'Zeno Kids Smart Watch', price: 59, stock: 70, tags: ['watch', 'kids'], rating: 4.1 },
    { name: 'Nova Luxe Smart Watch', price: 249, compareAt: 299, stock: 25, tags: ['watch', 'luxury'], rating: 4.8, featured: true, onSale: true },
    { name: 'Pulse Sleep Tracker', price: 79, stock: 55, tags: ['fitness', 'sleep'], rating: 4.3 },
    { name: 'Trail Adventure Watch', price: 139, stock: 30, tags: ['watch', 'outdoor'], rating: 4.2 },
    { name: 'Aura Watch Strap Pack', price: 19, stock: 110, tags: ['accessory', 'strap'], rating: 3.9 },
    { name: 'Lume Heart-Rate Band', price: 69, stock: 65, tags: ['fitness', 'heart-rate'], rating: 4.4, bestSeller: true },
  ],
  Men: [
    { name: 'Urban Slim Fit Shirt', price: 29, compareAt: 39, stock: 90, tags: ['shirt', 'formal'], rating: 4.3, featured: true, onSale: true },
    { name: 'Vertex Denim Jeans', price: 45, stock: 80, tags: ['denim', 'jeans'], rating: 4.4, bestSeller: true },
    { name: 'Zeno Casual T-Shirt', price: 15, stock: 200, tags: ['tshirt', 'casual'], rating: 4.1 },
    { name: 'Nova Blazer Jacket', price: 89, compareAt: 119, stock: 35, tags: ['blazer', 'formal'], rating: 4.6, featured: true, onSale: true },
    { name: 'Trail Cargo Trousers', price: 35, stock: 70, tags: ['trousers', 'cargo'], rating: 4.2 },
    { name: 'Pulse Polo Shirt', price: 24, stock: 110, tags: ['polo', 'casual'], rating: 4.0 },
    { name: 'Aura Hoodie', price: 39, stock: 85, tags: ['hoodie', 'street'], rating: 4.3, bestSeller: true },
    { name: 'Vertex Leather Belt', price: 19, stock: 60, tags: ['belt', 'accessory'], rating: 3.9 },
    { name: 'Urban Chinos', price: 33, stock: 75, tags: ['chinos', 'casual'], rating: 4.2 },
    { name: 'Zeno Formal Shoes', price: 59, compareAt: 79, stock: 45, tags: ['shoes', 'formal'], rating: 4.5, onSale: true },
    { name: 'Pulse Sports Jersey', price: 21, stock: 95, tags: ['sports', 'jersey'], rating: 4.1 },
  ],
  Women: [
    { name: 'Bloom Floral Dress', price: 49, compareAt: 69, stock: 60, tags: ['dress', 'summer'], rating: 4.4, featured: true, onSale: true },
    { name: 'Lume Kurti Set', price: 39, stock: 90, tags: ['kurti', 'ethnic'], rating: 4.3, bestSeller: true },
    { name: 'Nova Denim Skirt', price: 34, stock: 55, tags: ['skirt', 'denim'], rating: 4.1 },
    { name: 'Pulse Yoga Leggings', price: 27, stock: 100, tags: ['leggings', 'sport'], rating: 4.2 },
    { name: 'Aura Silk Saree', price: 79, compareAt: 99, stock: 40, tags: ['saree', 'ethnic'], rating: 4.7, featured: true, onSale: true },
    { name: 'Vertex Crop Top', price: 21, stock: 85, tags: ['top', 'casual'], rating: 4.0 },
    { name: 'Orb Midi Gown', price: 65, stock: 30, tags: ['gown', 'party'], rating: 4.5 },
    { name: 'Trail Workwear Blazer', price: 59, stock: 38, tags: ['blazer', 'work'], rating: 4.3 },
    { name: 'Bloom Handbag', price: 42, compareAt: 55, stock: 50, tags: ['handbag', 'accessory'], rating: 4.4, onSale: true },
    { name: 'Lume Anarkali Suit', price: 55, stock: 45, tags: ['suit', 'ethnic'], rating: 4.6, bestSeller: true },
  ],
  Footwear: [
    { name: 'Pulse Running Shoes', price: 55, compareAt: 75, stock: 70, tags: ['shoes', 'running'], rating: 4.5, featured: true, onSale: true },
    { name: 'Vertex Basketball Sneakers', price: 75, stock: 40, tags: ['sneakers', 'sports'], rating: 4.6, bestSeller: true },
    { name: 'Zeno Canvas Sneakers', price: 32, stock: 90, tags: ['sneakers', 'casual'], rating: 4.2 },
    { name: 'Trail Trekking Boots', price: 89, compareAt: 109, stock: 35, tags: ['boots', 'trekking'], rating: 4.7, featured: true, onSale: true },
    { name: 'Aura Formal Loafers', price: 49, stock: 55, tags: ['loafers', 'formal'], rating: 4.3 },
    { name: 'Nova Sports Sandals', price: 24, stock: 80, tags: ['sandals', 'sports'], rating: 4.0 },
    { name: 'Lume Ladies Heels', price: 39, stock: 50, tags: ['heels', 'party'], rating: 4.1 },
    { name: 'Orb Flip-Flops', price: 12, stock: 120, tags: ['flipflops', 'casual'], rating: 3.8 },
    { name: 'Pulse Kids Shoes', price: 28, stock: 75, tags: ['shoes', 'kids'], rating: 4.2 },
    { name: 'Vertex Chelsea Boots', price: 69, compareAt: 89, stock: 30, tags: ['boots', 'fashion'], rating: 4.5, onSale: true },
  ],
  Accessories: [
    { name: 'Nova Leather Backpack', price: 59, compareAt: 79, stock: 60, tags: ['bag', 'leather'], rating: 4.5, featured: true, onSale: true },
    { name: 'Aura Sunglasses', price: 19, stock: 100, tags: ['sunglasses', 'eyewear'], rating: 4.1 },
    { name: 'Vertex Wrist Watch', price: 89, compareAt: 119, stock: 40, tags: ['watch', 'fashion'], rating: 4.4, bestSeller: true, onSale: true },
    { name: 'Zeno Leather Wallet', price: 15, stock: 110, tags: ['wallet', 'leather'], rating: 4.0 },
    { name: 'Pulse Baseball Cap', price: 12, stock: 130, tags: ['cap', 'casual'], rating: 3.9 },
    { name: 'Orb Travel Duffel', price: 45, stock: 35, tags: ['bag', 'travel'], rating: 4.3, featured: true },
    { name: 'Lume Winter Scarf', price: 14, stock: 85, tags: ['scarf', 'winter'], rating: 4.1 },
    { name: 'Trail Utility Belt', price: 11, stock: 95, tags: ['belt'], rating: 3.8 },
    { name: 'Nova Crossbody Bag', price: 29, stock: 55, tags: ['bag', 'crossbody'], rating: 4.2 },
    { name: 'Aura Silver Jewellery Set', price: 39, compareAt: 49, stock: 30, tags: ['jewellery', 'silver'], rating: 4.6, onSale: true },
  ],
  Furniture: [
    { name: 'Nova Modular Sofa Set', price: 799, compareAt: 999, stock: 8, tags: ['furniture', 'sofa'], rating: 4.5, featured: true, onSale: true },
    { name: 'Vertex Wooden Bed', price: 599, stock: 6, tags: ['furniture', 'bed'], rating: 4.6 },
    { name: 'Aura Dining Table', price: 449, stock: 5, tags: ['furniture', 'dining'], rating: 4.4 },
    { name: 'Zeno Office Chair', price: 129, compareAt: 159, stock: 25, tags: ['furniture', 'office'], rating: 4.3, onSale: true },
    { name: 'Pulse Bookshelf', price: 89, stock: 20, tags: ['furniture', 'storage'], rating: 4.2, bestSeller: true },
    { name: 'Orb Coffee Table', price: 119, stock: 15, tags: ['furniture', 'coffee'], rating: 4.1 },
    { name: 'Lume Wardrobe', price: 499, stock: 4, tags: ['furniture', 'wardrobe'], rating: 4.5 },
    { name: 'Trail Study Desk', price: 159, compareAt: 189, stock: 12, tags: ['furniture', 'desk'], rating: 4.4, featured: true, onSale: true },
  ],
  Decor: [
    { name: 'Bloom Wall Art Canvas', price: 24, stock: 60, tags: ['decor', 'wall'], rating: 4.2 },
    { name: 'Lume Table Lamp', price: 29, compareAt: 39, stock: 55, tags: ['decor', 'lamp'], rating: 4.4, onSale: true },
    { name: 'Nova Cushion Cover Set', price: 18, stock: 90, tags: ['decor', 'cushion'], rating: 4.0, bestSeller: true },
    { name: 'Aura Fairy Lights', price: 15, stock: 120, tags: ['decor', 'lights'], rating: 4.3 },
    { name: 'Vertex Photo Frames', price: 21, stock: 70, tags: ['decor', 'frame'], rating: 4.1 },
    { name: 'Orb Indoor Plant Pot', price: 16, stock: 85, tags: ['decor', 'plant'], rating: 4.2, featured: true },
    { name: 'Pulse Scented Candles', price: 13, stock: 110, tags: ['decor', 'candle'], rating: 4.0 },
    { name: 'Zeno Curtains', price: 34, compareAt: 44, stock: 45, tags: ['decor', 'curtain'], rating: 4.3, onSale: true },
    { name: 'Lume Vase Set', price: 26, stock: 50, tags: ['decor', 'vase'], rating: 4.4 },
    { name: 'Trail Shaggy Rug', price: 39, stock: 30, tags: ['decor', 'rug'], rating: 4.2 },
  ],
  Kitchen: [
    { name: 'Nova Non-Stick Cookware Set', price: 89, compareAt: 119, stock: 30, tags: ['kitchen', 'cookware'], rating: 4.6, featured: true, onSale: true },
    { name: 'Aura Mixer Grinder', price: 49, stock: 45, tags: ['kitchen', 'appliance'], rating: 4.4, bestSeller: true },
    { name: 'Vertex Coffee Maker', price: 79, compareAt: 99, stock: 25, tags: ['kitchen', 'coffee'], rating: 4.5, onSale: true },
    { name: 'Zeno Dinnerware Set', price: 45, stock: 50, tags: ['kitchen', 'tableware'], rating: 4.3 },
    { name: 'Pulse Air Fryer', price: 99, stock: 20, tags: ['kitchen', 'appliance'], rating: 4.7, featured: true },
    { name: 'Orb Water Bottle Pack', price: 14, stock: 100, tags: ['kitchen', 'bottle'], rating: 4.0 },
    { name: 'Lume Storage Containers', price: 19, stock: 80, tags: ['kitchen', 'storage'], rating: 4.1 },
    { name: 'Trail Knife Set', price: 36, compareAt: 46, stock: 40, tags: ['kitchen', 'knife'], rating: 4.4, onSale: true },
    { name: 'Bloom Electric Kettle', price: 29, stock: 55, tags: ['kitchen', 'kettle'], rating: 4.2 },
    { name: 'Nova Toaster', price: 39, stock: 35, tags: ['kitchen', 'appliance'], rating: 4.3 },
    { name: 'Aura Frying Pan', price: 24, stock: 65, tags: ['kitchen', 'cookware'], rating: 4.2 },
  ],
  Skincare: [
    { name: 'Vitamin C Serum', price: 25, compareAt: 35, stock: 150, tags: ['skincare', 'serum'], rating: 4.7, bestSeller: true, onSale: true },
    { name: 'Aura Hydrating Cleanser', price: 18, stock: 120, tags: ['skincare', 'cleanser'], rating: 4.3 },
    { name: 'Lume Moisturizer Cream', price: 22, stock: 100, tags: ['skincare', 'moisturizer'], rating: 4.5, featured: true },
    { name: 'Zeno Sunscreen SPF 50', price: 16, stock: 140, tags: ['skincare', 'sunscreen'], rating: 4.4 },
    { name: 'Pulse Face Wash', price: 12, stock: 180, tags: ['skincare', 'facewash'], rating: 4.1 },
    { name: 'Orb Eye Cream', price: 28, compareAt: 36, stock: 60, tags: ['skincare', 'eye'], rating: 4.6, onSale: true },
    { name: 'Nova Night Repair Cream', price: 35, stock: 50, tags: ['skincare', 'night'], rating: 4.7, featured: true },
    { name: 'Trail Exfoliating Scrub', price: 17, stock: 90, tags: ['skincare', 'scrub'], rating: 4.2 },
    { name: 'Bloom Toner Mist', price: 14, stock: 110, tags: ['skincare', 'toner'], rating: 4.3 },
    { name: 'Vertex Sheet Mask Pack', price: 11, stock: 200, tags: ['skincare', 'mask'], rating: 4.0, bestSeller: true },
  ],
  Makeup: [
    { name: 'Lume Matte Lipstick', price: 14, stock: 150, tags: ['makeup', 'lipstick'], rating: 4.3, bestSeller: true },
    { name: 'Aura Foundation', price: 24, stock: 90, tags: ['makeup', 'foundation'], rating: 4.4 },
    { name: 'Zeno Kajal & Eyeliner', price: 9, stock: 180, tags: ['makeup', 'eyes'], rating: 4.1 },
    { name: 'Pulse Eyeshadow Palette', price: 29, compareAt: 39, stock: 60, tags: ['makeup', 'eyes'], rating: 4.6, featured: true, onSale: true },
    { name: 'Orb Blush Duo', price: 16, stock: 85, tags: ['makeup', 'blush'], rating: 4.2 },
    { name: 'Nova Compact Powder', price: 19, stock: 95, tags: ['makeup', 'powder'], rating: 4.0 },
    { name: 'Vertex Lip Gloss', price: 12, stock: 110, tags: ['makeup', 'lips'], rating: 4.2 },
    { name: 'Bloom Makeup Brush Set', price: 27, compareAt: 35, stock: 55, tags: ['makeup', 'brushes'], rating: 4.5, onSale: true },
    { name: 'Lume Setting Spray', price: 15, stock: 80, tags: ['makeup', 'setting'], rating: 4.1 },
    { name: 'Aura Highlighter', price: 13, stock: 75, tags: ['makeup', 'highlighter'], rating: 4.3, featured: true },
  ],
  Haircare: [
    { name: 'Lume Repair Shampoo', price: 15, stock: 130, tags: ['haircare', 'shampoo'], rating: 4.3, bestSeller: true },
    { name: 'Aura Silky Conditioner', price: 17, stock: 110, tags: ['haircare', 'conditioner'], rating: 4.2 },
    { name: 'Nova Hair Growth Serum', price: 21, compareAt: 27, stock: 85, tags: ['haircare', 'serum'], rating: 4.5, onSale: true },
    { name: 'Zeno Hair Dryer', price: 45, stock: 40, tags: ['haircare', 'dryer'], rating: 4.4, featured: true },
    { name: 'Pulse Coconut Hair Oil', price: 13, stock: 140, tags: ['haircare', 'oil'], rating: 4.0 },
    { name: 'Orb Hair Straightener', price: 39, compareAt: 49, stock: 35, tags: ['haircare', 'styling'], rating: 4.5, onSale: true },
    { name: 'Vertex Hair Mask', price: 19, stock: 90, tags: ['haircare', 'mask'], rating: 4.3 },
    { name: 'Bloom Hair Spa Kit', price: 29, stock: 50, tags: ['haircare', 'spa'], rating: 4.4, bestSeller: true },
  ],
  Fitness: [
    { name: 'Pulse Yoga Mat', price: 22, stock: 80, tags: ['fitness', 'yoga'], rating: 4.3, bestSeller: true },
    { name: 'Vertex Dumbbell Set', price: 45, compareAt: 59, stock: 40, tags: ['fitness', 'dumbbell'], rating: 4.6, onSale: true },
    { name: 'Aura Folding Treadmill', price: 599, stock: 5, tags: ['fitness', 'cardio'], rating: 4.7, featured: true },
    { name: 'Zeno Resistance Bands', price: 18, stock: 100, tags: ['fitness', 'bands'], rating: 4.1 },
    { name: 'Nova Adjustable Kettlebell', price: 35, stock: 45, tags: ['fitness', 'strength'], rating: 4.4 },
    { name: 'Orb Exercise Bike', price: 449, stock: 6, tags: ['fitness', 'cardio'], rating: 4.5 },
    { name: 'Pulse Skipping Rope', price: 9, stock: 150, tags: ['fitness', 'rope'], rating: 4.0 },
    { name: 'Trail Push-Up Bars', price: 16, stock: 70, tags: ['fitness', 'bodyweight'], rating: 4.2 },
    { name: 'Lume Gym Bottle', price: 12, stock: 120, tags: ['fitness', 'bottle'], rating: 4.1 },
    { name: 'Vertex Adjustable Bench', price: 129, compareAt: 159, stock: 15, tags: ['fitness', 'bench'], rating: 4.6, featured: true, onSale: true },
  ],
  'Outdoor Gear': [
    { name: 'Trail Trekking Backpack', price: 55, compareAt: 69, stock: 45, tags: ['outdoor', 'backpack'], rating: 4.5, featured: true, onSale: true },
    { name: 'Aura Camping Tent', price: 89, stock: 25, tags: ['outdoor', 'tent'], rating: 4.6 },
    { name: 'Vertex Sleeping Bag', price: 49, stock: 40, tags: ['outdoor', 'sleeping'], rating: 4.3 },
    { name: 'Zeno Rechargeable Flashlight', price: 19, stock: 90, tags: ['outdoor', 'light'], rating: 4.2 },
    { name: 'Nova Camping Stove', price: 34, stock: 35, tags: ['outdoor', 'cooking'], rating: 4.4, bestSeller: true },
    { name: 'Orb Hiking Poles', price: 29, stock: 50, tags: ['outdoor', 'hiking'], rating: 4.1 },
    { name: 'Pulse Waterproof Jacket', price: 69, compareAt: 89, stock: 30, tags: ['outdoor', 'jacket'], rating: 4.5, onSale: true },
    { name: 'Lume Hammock', price: 24, stock: 55, tags: ['outdoor', 'hammock'], rating: 4.2 },
    { name: 'Trail Cooler Box', price: 42, stock: 28, tags: ['outdoor', 'cooler'], rating: 4.3 },
    { name: 'Vertex Binoculars', price: 39, stock: 32, tags: ['outdoor', 'binoculars'], rating: 4.4, featured: true },
  ],
};

/** Expand the templates (× colour/capacity/size variants) into the final product list. */
function buildCatalog(): DemoProduct[] {
  const catalog: DemoProduct[] = [];
  for (const [category, list] of Object.entries(TEMPLATES)) {
    const variants: (string | undefined)[] = DEFAULT_VARIANTS[category] ?? [undefined];
    for (const t of list) {
      for (const variant of variants) {
        catalog.push({
          name: variant ? `${t.name} — ${variant}` : t.name,
          category,
          price: t.price,
          compareAt: t.compareAt,
          stock: Math.max(8, t.stock + Math.floor(Math.random() * 30)),
          tags: t.tags,
          featured: t.featured,
          bestSeller: t.bestSeller,
          onSale: t.onSale,
          rating: t.rating,
        });
      }
    }
  }
  return catalog;
}

const CATEGORY_GROUP: Record<string, 'electronics' | 'fashion' | 'home' | 'beauty' | 'sports'> = {
  Headphones: 'electronics',
  Smartphones: 'electronics',
  Laptops: 'electronics',
  Wearables: 'electronics',
  Men: 'fashion',
  Women: 'fashion',
  Footwear: 'fashion',
  Accessories: 'fashion',
  Furniture: 'home',
  Decor: 'home',
  Kitchen: 'home',
  Skincare: 'beauty',
  Makeup: 'beauty',
  Haircare: 'beauty',
  Fitness: 'sports',
  'Outdoor Gear': 'sports',
};

const CATEGORY_IMAGES: Record<string, string[]> = {
  Headphones: [
    'photo-1505740420928-5e560c06d30e',
    'photo-1546435770-a3e426bf472b',
    'photo-1583394838336-acd977736f90',
  ],
  Smartphones: [
    'photo-1511707171634-5f897ff02aa9',
    'photo-1598327105666-5b89351aff97',
    'photo-1565849904461-09a5fe500a13',
  ],
  Laptops: [
    'photo-1496181130204-755241544e35',
    'photo-1498050108023-c5249f4df085',
    'photo-1588872657578-7efd1f1555ed',
  ],
  Wearables: [
    'photo-1508685096489-7aacd43bd3b1',
    'photo-1579586337278-3befd40fd17a',
    'photo-1434494878577-86c23bcb06b9',
  ],
  Men: [
    'photo-1488161628813-04466f872be2',
    'photo-1617137968427-85924c800a22',
    'photo-1507679799987-c73779587ccf',
  ],
  Women: [
    'photo-1483985988355-763728e1935b',
    'photo-1494790108377-be9c29b29330',
    'photo-1503342217505-b0a15ec3261c',
  ],
  Footwear: [
    'photo-1542291026-7eec264c27ff',
    'photo-1606107557195-0e29a4b5b4aa',
    'photo-1549298916-b41d501d3772',
  ],
  Accessories: [
    'photo-1523275335684-37898b6baf30',
    'photo-1627124765135-56c2ddfc3a2c',
    'photo-1509319117193-57bab727e09d',
  ],
  Furniture: [
    'photo-1555041469-a586c61ea9bc',
    'photo-1524758631624-e2822e304c36',
    'photo-1586023492125-27b2c045efd7',
  ],
  Decor: [
    'photo-1513519245088-0e12902e5a38',
    'photo-1505691938895-1758d7feb511',
    'photo-1533090161767-e6ffed986c88',
  ],
  Kitchen: [
    'photo-1584269600464-37b1b58a9fe7',
    'photo-1556911220-e15b29be8c8f',
    'photo-1590794056226-79ef3a8147e1',
  ],
  Skincare: [
    'photo-1608248597279-f99d160bfcbc',
    'photo-1556228720-195a672e8a03',
    'photo-1601049541289-9b1b7bbbfe19',
  ],
  Makeup: [
    'photo-1522335789203-aabd1fc54bc9',
    'photo-1596462502278-27bfdc403348',
    'photo-1608248597279-f99d160bfcbc',
  ],
  Haircare: [
    'photo-1527799851257-6592a18a0982',
    'photo-1535585209827-a15fcdbc4c2d',
    'photo-1522337360788-8b13dee7a37e',
  ],
  Fitness: [
    'photo-1517838277536-f5f99be501cd',
    'photo-1605296867304-46d5465a25f1',
    'photo-1599058917212-d750089bc07e',
  ],
  'Outdoor Gear': [
    'photo-1501555088652-021faa106b9b',
    'photo-1533674689011-2f8de176ec2b',
    'photo-1622560480605-d83c853bc5c3',
  ],
};

function getImageUrl(category: string, name: string, seed: number) {
  const safeCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `https://picsum.photos/seed/${safeCategory}-${safeName}-${seed}/600/600`;
}

function getProductImages(category: string, name: string, count = 3) {
  return Array.from({ length: count }, (_, index) => ({ url: getImageUrl(category, name, index) }));
}

const EXTRA_SEED_DATA: Record<
  string,
  {
    bases: string[];
    suffixes: string[];
    basePrice: number;
    tags: string[];
  }
> = {
  Headphones: {
    bases: ['Echo', 'Pulse', 'Wave', 'Vibe', 'Orbit', 'Nova', 'Zen', 'Aura', 'Luma', 'Titan'],
    suffixes: ['Pro', 'Max', 'Lite', 'X', 'Air', 'Flex', 'Active', 'Sport', 'Studio'],
    basePrice: 59,
    tags: ['audio', 'wireless', 'headphones'],
  },
  Smartphones: {
    bases: ['Aura', 'Nova', 'Pulse', 'Zeno', 'Vertex', 'Orb', 'Lume', 'Trail', 'Flux', 'Halo'],
    suffixes: ['5G', 'Mini', 'Plus', 'Ultra', 'Neo', 'Prime', 'Edge', 'Flip', 'Note'],
    basePrice: 179,
    tags: ['mobile', '5g', 'smartphone'],
  },
  Laptops: {
    bases: ['NovaBook', 'AuraBook', 'Vertex', 'Orbit', 'Pulse', 'ZenBook', 'Trailbook', 'LumeBook', 'PrimeBook', 'EdgeBook'],
    suffixes: ['Air', 'Pro', 'Max', 'Slim', 'Studio', 'Plus', 'Core', 'Elite', 'Neo'],
    basePrice: 699,
    tags: ['laptop', 'computer', 'notebook'],
  },
  Wearables: {
    bases: ['Aura Watch', 'Pulse Band', 'Nova Watch', 'Zeno Strap', 'Vertex Watch', 'Orb Band', 'Lume Wear', 'Trail Tracker', 'Fit Band', 'Glow Watch'],
    suffixes: ['42 mm', '44 mm', '46 mm', 'Sport', 'Premium', 'Lite', 'Active', 'Classic', 'Plus'],
    basePrice: 49,
    tags: ['watch', 'fitness', 'wearable'],
  },
  Men: {
    bases: ['Urban Shirt', 'Classic Tee', 'Slim Fit Shirt', 'Denim Jacket', 'Leather Jacket', 'Cargo Pants', 'Oxford Shirt', 'Blazer', 'Henley Tee', 'Chino Pants'],
    suffixes: ['S', 'M', 'L', 'XL', 'XXL', 'Slim', 'Regular', 'Relaxed', 'Tailored', 'Sport'],
    basePrice: 29,
    tags: ['men', 'apparel', 'fashion'],
  },
  Women: {
    bases: ['Floral Dress', 'Silk Top', 'Maxi Skirt', 'Denim Jacket', 'Summer Dress', 'Shift Dress', 'Blouse', 'Crop Top', 'Palazzo Pant', 'Jumpsuit'],
    suffixes: ['S', 'M', 'L', 'XL', 'Petite', 'Midi', 'Maxi', 'Floral', 'Lace', 'Chic'],
    basePrice: 39,
    tags: ['women', 'apparel', 'fashion'],
  },
  Footwear: {
    bases: ['Running Shoes', 'Sneakers', 'Loafers', 'Boots', 'Sandals', 'Heels', 'Sneaker Pro', 'Trail Runners', 'Slip-Ons', 'Moccasins'],
    suffixes: ['Black', 'White', 'Tan', 'Navy', 'Red', 'Grey', 'Green', 'Canvas', 'Leather', 'Sport'],
    basePrice: 49,
    tags: ['shoes', 'footwear', 'fashion'],
  },
  Accessories: {
    bases: ['Leather Bag', 'Sunglasses', 'Wrist Watch', 'Wallet', 'Baseball Cap', 'Scarf', 'Belt', 'Necklace', 'Bracelet', 'Crossbody Bag'],
    suffixes: ['Black', 'Brown', 'Gold', 'Silver', 'Tan', 'Classic', 'Statement', 'Minimal', 'Sport', 'Elegant'],
    basePrice: 19,
    tags: ['accessory', 'fashion'],
  },
  Furniture: {
    bases: ['Modular Sofa', 'Wooden Bed', 'Dining Table', 'Office Chair', 'Bookshelf', 'Coffee Table', 'Wardrobe', 'Study Desk', 'Recliner Sofa', 'Armchair'],
    suffixes: ['Walnut', 'White', 'Grey', 'Oak', 'Mahogany', 'Modern', 'Classic', 'Luxury', 'Minimalist'],
    basePrice: 199,
    tags: ['furniture', 'home', 'living'],
  },
  Decor: {
    bases: ['Wall Art Canvas', 'Table Lamp', 'Cushion Cover', 'Fairy Lights', 'Photo Frame', 'Indoor Plant Pot', 'Scented Candle', 'Curtain Panel', 'Vase', 'Shaggy Rug'],
    suffixes: ['White', 'Black', 'Beige', 'Gold', 'Silver', 'Cozy', 'Elegant', 'Modern', 'Minimalist'],
    basePrice: 19,
    tags: ['decor', 'home', 'living'],
  },
  Kitchen: {
    bases: ['Non-Stick Frying Pan', 'Mixer Grinder', 'Coffee Maker', 'Dinnerware Set', 'Air Fryer', 'Water Bottle', 'Storage Container', 'Knife Block Set', 'Electric Kettle', 'Toaster'],
    suffixes: ['1 L', '2 L', '3 L', 'Stainless Steel', 'Premium', 'Compact', 'Pro', 'Classic'],
    basePrice: 29,
    tags: ['kitchen', 'home', 'cookware'],
  },
  Skincare: {
    bases: ['Vitamin C Serum', 'Hydrating Cleanser', 'Moisturizer Cream', 'Sunscreen SPF 50', 'Face Wash', 'Eye Cream', 'Night Repair Cream', 'Exfoliating Scrub', 'Toner Mist', 'Sheet Mask'],
    suffixes: ['30 ml', '50 ml', '100 ml', 'Organic', 'Sensitive', 'Anti-Aging', 'Brightening', 'Daily'],
    basePrice: 15,
    tags: ['skincare', 'beauty', 'care'],
  },
  Makeup: {
    bases: ['Matte Lipstick', 'Liquid Foundation', 'Kajal Eyeliner', 'Eyeshadow Palette', 'Blush Duo', 'Compact Powder', 'Lip Gloss', 'Makeup Brush Set', 'Setting Spray', 'Highlighter'],
    suffixes: ['Rose', 'Nude', 'Berry', 'Red', 'Pink', 'Glitter', 'Matte', 'Waterproof', 'Shine'],
    basePrice: 12,
    tags: ['makeup', 'beauty', 'cosmetics'],
  },
  Haircare: {
    bases: ['Repair Shampoo', 'Silky Conditioner', 'Hair Growth Serum', 'Hair Dryer', 'Coconut Hair Oil', 'Hair Straightener', 'Hair Mask', 'Hair Spa Kit', 'Anti-Dandruff Shampoo', 'Hair Wax'],
    suffixes: ['250 ml', '500 ml', '1 L', 'Professional', 'Herbal', 'Damage Repair', 'Volume Boost', 'Shine'],
    basePrice: 15,
    tags: ['haircare', 'beauty', 'care'],
  },
  Fitness: {
    bases: ['Yoga Mat', 'Dumbbell Set', 'Folding Treadmill', 'Resistance Bands', 'Adjustable Kettlebell', 'Exercise Bike', 'Skipping Rope', 'Push-Up Bars', 'Gym Bottle', 'Adjustable Bench'],
    suffixes: ['Standard', 'Pro', 'Elite', 'Heavy Duty', 'Lightweight', 'Non-Slip', 'Compact', 'Speed'],
    basePrice: 25,
    tags: ['fitness', 'sports', 'workout'],
  },
  'Outdoor Gear': {
    bases: ['Trekking Backpack', 'Camping Tent', 'Sleeping Bag', 'Rechargeable Flashlight', 'Camping Stove', 'Hiking Poles', 'Waterproof Jacket', 'Hammock', 'Cooler Box', 'Binoculars'],
    suffixes: ['Green', 'Orange', 'Olive', 'Blue', 'Black', 'Double Size', 'Waterproof', 'Ultra Light'],
    basePrice: 39,
    tags: ['outdoor', 'sports', 'camping'],
  },
};

function buildExtraProducts(): DemoProduct[] {
  const products: DemoProduct[] = [];
  const extraCountPerCategory = 400;

  for (const [category, spec] of Object.entries(EXTRA_SEED_DATA)) {
    for (let index = 0; index < extraCountPerCategory; index += 1) {
      const baseName = spec.bases[index % spec.bases.length];
      const suffix = spec.suffixes[index % spec.suffixes.length];
      const variantIndex = Math.floor(index / spec.suffixes.length) + 1;
      const name = `${baseName} ${suffix} ${variantIndex}`;
      const price = spec.basePrice + (index % 5) * 10;
      products.push({
        name,
        category,
        price,
        compareAt: price + (index % 3 === 0 ? 20 : 0),
        stock: 20 + (index % 40),
        tags: [...spec.tags, category.toLowerCase(), CATEGORY_GROUP[category] || 'home'],
        featured: index % 15 === 0,
        bestSeller: index % 8 === 0,
        onSale: index % 4 === 0,
        rating: 3.8 + ((index % 5) * 0.2),
      });
    }
  }

  return products;
}

const ALL_PRODUCTS: DemoProduct[] = [...DEMO_PRODUCTS, ...buildCatalog(), ...buildExtraProducts()];

async function seedCategories(): Promise<Map<string, string>> {
  const slugToId = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const parentSlug = slugify(cat.name);
    let parent = await Category.findOne({ slug: parentSlug });
    if (!parent) {
      parent = await Category.create({
        name: cat.name,
        slug: parentSlug,
        isActive: true,
        sortOrder: 0,
      });
    }
    slugToId.set(cat.name, parent._id.toString());
    log(`  ✔ Category: ${cat.name}`);

    for (const childName of cat.children) {
      const childSlug = slugify(childName);
      let child = await Category.findOne({ slug: childSlug });
      if (!child) {
        child = await Category.create({
          name: childName,
          slug: childSlug,
          parent: parent._id,
          isActive: true,
          sortOrder: 0,
        });
      }
      slugToId.set(childName, child._id.toString());
      log(`    ✔ Subcategory: ${childName}`);
    }
  }
  return slugToId;
}

async function seedProducts(slugToId: Map<string, string>): Promise<void> {
  const productsToInsert = [];
  const usedSlugs = new Set<string>();

  for (const demo of ALL_PRODUCTS) {
    const catId = slugToId.get(demo.category);
    if (!catId) continue;

    let baseSlug = slugify(demo.name);
    let slug = baseSlug;
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${n++}`;
    }
    usedSlugs.add(slug);

    const compareAtPrice = demo.compareAt;
    productsToInsert.push({
      name: demo.name,
      slug: slug,
      description: `${demo.name} — premium quality, tested and built for everyday use. Free returns within 30 days.`,
      shortDescription: demo.tags.join(', '),
      category: catId,
      brand: 'Nova',
      tags: demo.tags,
      images: getProductImages(demo.category, demo.name, 3),
      price: demo.price,
      compareAtPrice: compareAtPrice,
      stock: demo.stock,
      sku: `NV-${demo.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}${Math.floor(Math.random() * 100)}`,
      isFeatured: demo.featured ?? false,
      isBestSeller: demo.bestSeller ?? false,
      isNewArrival: !demo.featured && !demo.bestSeller,
      onSale: demo.onSale ?? false,
      rating: demo.rating ?? 4,
      reviewCount: Math.floor(Math.random() * 40),
      soldCount: Math.floor(Math.random() * 500),
      status: 'active',
    });
  }

  if (productsToInsert.length > 0) {
    log(`  📦 Inserting ${productsToInsert.length} products in bulk...`);
    await Product.insertMany(productsToInsert);
    log(`  ✔ ${productsToInsert.length} products inserted.`);
  }
}

async function seedCoupon(): Promise<void> {
  const existing = await Coupon.findOne({ code: 'WELCOME10' });
  if (existing) return;
  await Coupon.create({
    code: 'WELCOME10',
    description: '10% off your first order',
    type: CouponType.PERCENTAGE,
    value: 10,
    maxDiscount: 50,
    minOrderAmount: 20,
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true,
  });
  log('  ✔ Coupon: WELCOME10');
}

export async function seed(): Promise<void> {
  await connectDB();
  log('🌱 Seeding database…');

  log('🗑️  Clearing existing collections...');
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Coupon.deleteMany({});
  log('  ✔ Database cleared');

  await findOrCreateAdmin();
  log('  ✔ Admin user ensured');

  log('🏷️  Categories…');
  const slugToId = await seedCategories();
  log('  ✔ Categories seeded');

  log('📦 Products…');
  await seedProducts(slugToId);
  log('  ✔ Products seeded');

  log('🎟️  Coupon…');
  await seedCoupon();

  log('✅ Seeding complete.');
  await disconnectDB();
}

// Run directly when executed as a script (`npm run seed`).
if (require.main === module) {
  seed().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}