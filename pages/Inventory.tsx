import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Product } from '../types';
import { Package, ShoppingCart, AlertCircle, Plus, X } from 'lucide-react';
import { formatCurrency } from '../utils/pdf';

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  
  // State for Create Product Modal
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    stock_quantity: '',
    min_stock_level: ''
  });
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    if (data) setProducts(data);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSave(true);

    const { error } = await supabase.from('products').insert([{
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      stock_quantity: parseInt(newProduct.stock_quantity),
      min_stock_level: parseInt(newProduct.min_stock_level) || 5
    }]);

    if (!error) {
      alert('Produto cadastrado com sucesso!');
      setShowModal(false);
      setNewProduct({ name: '', category: '', price: '', stock_quantity: '', min_stock_level: '' });
      fetchProducts();
    } else {
      alert('Erro ao cadastrar produto.');
    }
    setLoadingSave(false);
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
        <div className="p-4 border-b bg-gray-50 font-bold flex justify-between items-center">
            <div className="flex items-center text-gray-700">
                <Package className="mr-2"/> Produtos em Estoque
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="bg-gym-600 text-white px-3 py-1 rounded text-sm flex items-center hover:bg-gym-700 transition"
            >
                <Plus className="h-4 w-4 mr-1" /> Novo Produto
            </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
                <div key={p.id} 
                    className={`border rounded p-4 cursor-pointer hover:shadow-md transition ${p.stock_quantity <= p.min_stock_level ? 'border-red-300 bg-red-50' : 'bg-white'}`}
                    onClick={() => addToCart(p)}
                >
                    <div className="flex justify-between items-start">
                         <h3 className="font-bold text-gray-800 line-clamp-1">{p.name}</h3>
                         {p.stock_quantity <= p.min_stock_level && <AlertCircle className="h-4 w-4 text-red-500"/>}
                    </div>
                    <p className="text-sm text-gray-500">{p.category}</p>
                    <div className="mt-2 flex justify-between items-end">
                        <span className="font-bold text-gym-600">{formatCurrency(p.price)}</span>
                        <span className="text-xs text-gray-400">Estoque: {p.stock_quantity}</span>
                    </div>
                </div>
            ))}
            {products.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-400 p-10 border-2 border-dashed rounded">
                    <Package className="h-10 w-10 mb-2" />
                    <p>Nenhum produto cadastrado.</p>
                </div>
            )}
        </div>
      </div>

      {/* POS Cart */}
      <div className="bg-white rounded-lg shadow-sm border flex flex-col">
          <div className="p-4 border-b bg-gray-50 font-bold flex items-center text-gray-700">
              <ShoppingCart className="mr-2"/> Carrinho de Venda
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-2">
                      <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.qty} x {formatCurrency(item.product.price)}</p>
                      </div>
                      <div className="text-right">
                          <span className="font-bold block">{formatCurrency(item.qty * item.product.price)}</span>
                          <button 
                            onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                            className="text-xs text-red-500 hover:underline"
                          >
                              Remover
                          </button>
                      </div>
                  </div>
              ))}
              {cart.length === 0 && <p className="text-gray-400 text-center mt-10">Carrinho vazio</p>}
          </div>
          <div className="p-4 bg-gray-50 border-t">
              <div className="flex justify-between text-xl font-bold mb-4">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
              </div>
              <button 
                disabled={cart.length === 0}
                onClick={handleSell}
                className="w-full bg-emerald-600 text-white py-3 rounded font-bold hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                  FINALIZAR VENDA
              </button>
          </div>
      </div>

      {/* Modal Criar Produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-xl">
                <div className="px-6 py-4 bg-gym-900 text-white flex justify-between items-center">
                    <h3 className="font-bold text-lg">Novo Produto</h3>
                    <button onClick={() => setShowModal(false)} className="hover:text-gray-300">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                        <input 
                            type="text" required 
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none"
                            value={newProduct.name}
                            onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                            placeholder="Ex: Água Mineral 500ml"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Categoria</label>
                        <select 
                            required 
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none"
                            value={newProduct.category}
                            onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        >
                            <option value="">Selecione...</option>
                            <option value="Bebidas">Bebidas</option>
                            <option value="Suplementos">Suplementos</option>
                            <option value="Roupas">Roupas</option>
                            <option value="Acessórios">Acessórios</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Preço (Kz)</label>
                            <input 
                                type="number" required min="0" step="0.01"
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none"
                                value={newProduct.price}
                                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estoque Inicial</label>
                            <input 
                                type="number" required min="0"
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none"
                                value={newProduct.stock_quantity}
                                onChange={e => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nível Mínimo (Alerta)</label>
                        <input 
                            type="number" required min="1"
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-gym-500 outline-none"
                            value={newProduct.min_stock_level}
                            onChange={e => setNewProduct({...newProduct, min_stock_level: e.target.value})}
                            placeholder="Ex: 5"
                        />
                        <p className="text-xs text-gray-400 mt-1">O sistema avisará quando o estoque estiver abaixo deste valor.</p>
                    </div>
                    
                    <div className="pt-4 flex space-x-3 justify-end">
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={loadingSave}
                            className="px-4 py-2 bg-gym-600 text-white rounded font-medium hover:bg-gym-700 disabled:opacity-50"
                        >
                            {loadingSave ? 'Salvando...' : 'Cadastrar Produto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;