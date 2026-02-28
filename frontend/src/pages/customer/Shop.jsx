import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Filter, Plus, Loader2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

export default function CustomerShop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  // Fetch actual products from admin-managed product list
  // Since there's no dedicated "list products" public endpoint, we use the cart/ecommerce flow
  useEffect(() => {
    // Products come from the admin panel; no public list endpoint → use localStorage cache or mock
    const cached = localStorage.getItem('tm_products_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      setProducts(parsed);
      const cats = ['All', ...new Set(parsed.map((p) => p.category).filter(Boolean))];
      setCategories(cats);
      setLoading(false);
    } else {
      // Default product catalogue (admin can update via admin panel)
      const defaultProducts = [
        { _id: 'p101', name: 'Emerald Silk Saree', price: 4599, category: 'Sarees', stock: 5, image: 'bg-emerald-100' },
        { _id: 'p102', name: 'Floral Cotton Kurti', price: 1299, category: 'Kurtis', stock: 12, image: 'bg-rose-100' },
        { _id: 'p103', name: 'Designer Lehenga', price: 8999, category: 'Lehengas', stock: 2, image: 'bg-purple-100' },
        { _id: 'p104', name: 'Chikankari Suit', price: 2499, category: 'Suits', stock: 8, image: 'bg-blue-100' },
        { _id: 'p105', name: 'Festive Kurti Set', price: 1899, category: 'Kurtis', stock: 15, image: 'bg-amber-100' },
        { _id: 'p106', name: 'Banarasi Silk Saree', price: 5500, category: 'Sarees', stock: 3, image: 'bg-indigo-100' },
      ];
      setProducts(defaultProducts);
      const cats = ['All', ...new Set(defaultProducts.map((p) => p.category))];
      setCategories(cats);
      setLoading(false);
    }

    // Load existing cart count
    const cartItems = JSON.parse(localStorage.getItem('tm_cart_items') || '[]');
    setCartCount(cartItems.length);
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = async (product) => {
    setAddingId(product._id);
    try {
      await api.post('/customer/cart/add', {
        productId: product._id,
        quantity: 1,
      });
    } catch {
      // If API call fails, still update local cart for optimistic UX
    }
    // Track locally
    const cartItems = JSON.parse(localStorage.getItem('tm_cart_items') || '[]');
    if (!cartItems.includes(product._id)) {
      cartItems.push(product._id);
      localStorage.setItem('tm_cart_items', JSON.stringify(cartItems));
    }
    setCartCount(cartItems.length);
    setAddingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5 h-full">
      {/* Header & Cart */}
      <div className="flex justify-between items-center mb-1">
        <div>
          <h1 className="text-2xl font-bold font-serif tracking-tight">Readymade</h1>
          <p className="text-xs text-muted-foreground">All-India Delivery Available</p>
        </div>
        <div className="relative p-2 bg-card border border-border rounded-full shadow-sm">
          <ShoppingBag size={20} className="text-foreground" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search kurtis, sarees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
        </div>
        <button className="p-3 bg-card border border-border rounded-xl text-foreground shadow-sm">
          <Filter size={18} />
        </button>
      </div>

      {/* Category Scroll */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === category
                ? 'bg-foreground text-card shadow-md'
                : 'bg-card border border-border text-muted-foreground hover:border-foreground/30'
              }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-56 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col"
            >
              <div className={`h-40 w-full ${product.image || 'bg-muted'} relative`}>
                {product.stock < 5 && (
                  <span className="absolute top-2 left-2 bg-white/90 text-destructive text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow-sm">
                    Only {product.stock} left
                  </span>
                )}
                {product.discountPrice && (
                  <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">
                    SALE
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {product.category}
                  </span>
                  <h3 className="text-sm font-bold leading-tight mt-0.5 line-clamp-2">{product.name}</h3>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-sm font-bold text-primary font-serif">
                      ₹{product.discountPrice || product.price}
                    </span>
                    {product.discountPrice && (
                      <span className="text-[10px] text-muted-foreground line-through ml-1">
                        ₹{product.price}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={addingId === product._id || product.stock === 0}
                    className="bg-primary/10 text-primary p-1.5 rounded-lg active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {addingId === product._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-10 text-muted-foreground text-sm">
              No products found.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}