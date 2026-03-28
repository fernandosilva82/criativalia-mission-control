module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { endpoint } = req.query;
  const SHOPIFY_SHOP = 'm-s-negocios-2.myshopify.com';
  const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN || '';

  try {
    if (endpoint === 'products') {
      const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=50`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }
      });
      const data = await response.json();
      res.status(200).json({ products: data.products || [], count: data.products?.length || 0 });
      return;
    }

    if (endpoint === 'products/top') {
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=100`, {
          headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }
        }),
        fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?status=any&limit=100`, {
          headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }
        })
      ]);

      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();

      const productMap = new Map((productsData.products || []).map(p => [p.id.toString(), p]));
      const salesMap = new Map();

      (ordersData.orders || []).forEach(order => {
        (order.line_items || []).forEach(item => {
          if (item.product_id) {
            const id = item.product_id.toString();
            const current = salesMap.get(id) || { quantity: 0, revenue: 0 };
            salesMap.set(id, {
              quantity: current.quantity + item.quantity,
              revenue: current.revenue + (parseFloat(item.price) * item.quantity)
            });
          }
        });
      });

      const topProducts = Array.from(salesMap.entries())
        .map(([id, sales]) => {
          const product = productMap.get(id);
          return {
            id,
            title: product?.title || 'Produto Desconhecido',
            quantity: sales.quantity,
            revenue: sales.revenue,
            image: product?.image?.src || null
          };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      res.status(200).json({ products: topProducts, count: topProducts.length });
      return;
    }

    if (endpoint === 'orders') {
      const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?status=any&limit=50`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }
      });
      const data = await response.json();
      res.status(200).json({ orders: data.orders || [], count: data.orders?.length || 0 });
      return;
    }

    if (endpoint === 'stats') {
      const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?status=any&limit=100`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }
      });
      const data = await response.json();
      const orders = data.orders || [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentOrders = orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo);
      const revenue = recentOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
      const customerEmails = new Set(recentOrders.map(o => o.customer?.email).filter(Boolean));

      res.status(200).json({
        period: 'last_30_days',
        revenue,
        orders: recentOrders.length,
        averageTicket: recentOrders.length > 0 ? revenue / recentOrders.length : 0,
        customers: customerEmails.size
      });
      return;
    }

    res.status(400).json({ error: 'Invalid endpoint. Use: products, products/top, orders, stats' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};