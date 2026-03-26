/**
 * Shopify Integration - Dados Reais
 */

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || 'criativalia.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

class ShopifyAPI {
  constructor() {
    this.baseUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01`;
    this.headers = {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    };
    this.enabled = !!SHOPIFY_ACCESS_TOKEN;
  }

  async fetch(url) {
    if (!this.enabled) throw new Error('Shopify not configured');
    const response = await fetch(url, { headers: this.headers });
    if (!response.ok) throw new Error(`Shopify API error: ${response.status}`);
    return response.json();
  }

  async getOrders(days = 30) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    const url = `${this.baseUrl}/orders.json?created_at_min=${dateFrom.toISOString()}&limit=250`;
    const data = await this.fetch(url);
    
    return data.orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      totalPrice: parseFloat(order.total_price),
      subtotalPrice: parseFloat(order.subtotal_price),
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      items: order.line_items?.length || 0,
      customer: order.customer ? {
        id: order.customer.id,
        email: order.customer.email,
        ordersCount: order.customer.orders_count,
      } : null,
    }));
  }

  async getProducts() {
    const url = `${this.baseUrl}/products.json?limit=250`;
    const data = await this.fetch(url);
    
    return data.products.map(p => ({
      id: p.id,
      title: p.title,
      variants: p.variants?.length || 0,
      inventory: p.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0,
    }));
  }

  async getMetrics(days = 30) {
    const orders = await this.getOrders(days);
    
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Unique customers
    const uniqueCustomers = new Set(orders.map(o => o.customer?.id).filter(Boolean));
    
    // Returning customers (ordersCount > 1)
    const returningCustomers = orders.filter(o => o.customer?.ordersCount > 1).length;
    const repurchaseRate = totalOrders > 0 ? (returningCustomers / totalOrders) * 100 : 0;
    
    return {
      revenue: totalRevenue,
      orders: totalOrders,
      aov,
      uniqueCustomers: uniqueCustomers.size,
      repurchaseRate,
      period: days,
    };
  }

  async getInactiveCustomers(daysInactive = 90) {
    const allOrders = await this.getOrders(365);
    
    const customerActivity = {};
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    allOrders.forEach(order => {
      if (!order.customer) return;
      
      const id = order.customer.id;
      if (!customerActivity[id]) {
        customerActivity[id] = { ...order.customer, lastOrder: order.createdAt, totalSpent: 0 };
      }
      customerActivity[id].totalSpent += order.totalPrice;
      if (new Date(order.createdAt) > new Date(customerActivity[id].lastOrder)) {
        customerActivity[id].lastOrder = order.createdAt;
      }
    });
    
    return Object.values(customerActivity)
      .filter(c => new Date(c.lastOrder) < cutoffDate)
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }
}

export const shopify = new ShopifyAPI();
export default shopify;
