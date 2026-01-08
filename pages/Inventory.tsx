import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Product } from '../types';
import { Package, ShoppingCart, AlertCircle } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    if (data) setProducts(data);
  };

  const handleSell = async () => {
    if (cart.length === 0) return;

    for (const item of cart) {
        // 1. Record Sale
        await supabase.from('product_sales').insert([{
            product_id: item.product.id,
            quantity: item.qty,
            total_price: item.product.price * item.qty,
            payment_method: 'cash'
        }]);

        // 2. Update Stock
        await supabase.from('products').update({
            stock_quantity: item.product.stock_quantity - item.qty
        }).eq('id', item.product.id);
    }

    setCart([]);
    fetchProducts();
    alert('Venda registrada com sucesso!');
  };

  const addToCart = (p: Product) => {
    const exists = cart.find(x => x.product.id === p.id);
    if (exists) {
        setCart(cart.map(x => x.product.id === p.id ? {...x, qty: x.qty + 1} : x));
    } else {
        setCart([...cart, {product: p, qty: 1}]);
    }
  };

  const total = cart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      {/* Product List */}
      <div className="md:col-span-2 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50 font-bold flex items-center">
            <Package className="mr-2"/> Produtos em Estoque
        </div>
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
                <div key={p.id} 
                    className={`border rounded p-4 cursor-pointer hover:shadow-md transition ${p.stock_quantity <= p.min_stock_level ? 'border-red-300 bg-red-50' : 'bg-white'}`}
                    onClick={() => addToCart(p)}
                >
                    <div className="flex justify-between items-start">
                         <h3 className="font-bold text-gray-800">{p.name}</h3>
                         {p.stock_quantity <= p.min_stock_level && <AlertCircle className="h-4 w-4 text-red-500"/>}
                    </div>
                    <p className="text-sm text-gray-500">{p.category}</p>
                    <div className="mt-2 flex justify-between items-end">
                        <span className="font-bold text-gym-600">R$ {p.price}</span>
                        <span className="text-xs text-gray-400">Estoque: {p.stock_quantity}</span>
                    </div>
                </div>
            ))}
            {products.length === 0 && (
                <button 
                  onClick={async () => {
                     await supabase.from('products').insert([
                         { name: 'Água 500ml', price: 3.50, stock_quantity: 50, category: 'Bebidas' },
                         { name: 'Whey Protein', price: 15.00, stock_quantity: 10, category: 'Suplementos' },
                     ]);
                     fetchProducts();
                  }}
                  className="border-dashed border-2 border-gray-300 rounded p-4 text-gray-400 flex items-center justify-center hover:bg-gray-50"
                >
                    + Add Mock Products
                </button>
            )}
        </div>
      </div>

      {/* POS Cart */}
      <div className="bg-white rounded-lg shadow-sm border flex flex-col">
          <div className="p-4 border-b bg-gray-50 font-bold flex items-center">
              <ShoppingCart className="mr-2"/> Carrinho de Venda
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-2">
                      <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.qty} x R$ {item.product.price}</p>
                      </div>
                      <span className="font-bold">R$ {item.qty * item.product.price}</span>
                  </div>
              ))}
              {cart.length === 0 && <p className="text-gray-400 text-center mt-10">Carrinho vazio</p>}
          </div>
          <div className="p-4 bg-gray-50 border-t">
              <div className="flex justify-between text-xl font-bold mb-4">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
              </div>
              <button 
                disabled={cart.length === 0}
                onClick={handleSell}
                className="w-full bg-emerald-600 text-white py-3 rounded font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                  FINALIZAR VENDA
              </button>
          </div>
      </div>
    </div>
  );
};

export default Inventory;
