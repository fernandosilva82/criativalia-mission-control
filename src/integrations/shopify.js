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

  async getOrdersFromDate(startDate, endDate = new Date()) {
    const url = `${this.baseUrl}/orders.json?created_at_min=${startDate.toISOString()}&created_at_max=${endDate.toISOString()}&limit=250&status=any`;
    const data = await this.fetch(url);
    
    return data.orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      totalPrice: parseFloat(order.total_price),
      subtotalPrice: parseFloat(order.subtotal_price),
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      items: order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      customer: order.customer ? {
        id: order.customer.id,
        email: order.customer.email,
        ordersCount: order.customer.orders_count,
      } : null,
    }));
  }

  async getOrders(days = 30) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    return this.getOrdersFromDate(dateFrom);
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

  async getMetrics() {
    const now = new Date();
    
    // MTD: desde o dia 1 do mês atual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const ordersMTD = await this.getOrdersFromDate(startOfMonth, now);
    
    // Mês anterior completo
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const ordersLastMonth = await this.getOrdersFromDate(startOfLastMonth, endOfLastMonth);
    
    // YTD: desde 1º de janeiro
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const ordersYTD = await this.getOrdersFromDate(startOfYear, now);
    
    // YTD ano anterior (mesmo período)
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYearSameDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const ordersLastYTD = await this.getOrdersFromDate(startOfLastYear, endOfLastYearSameDate);
    
    // Calcular métricas MTD
    const totalRevenue = ordersMTD.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalOrders = ordersMTD.length;
    const totalItems = ordersMTD.reduce((sum, o) => sum + o.items, 0);
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Mês anterior
    const lastMonthRevenue = ordersLastMonth.reduce((sum, o) => sum + o.totalPrice, 0);
    const lastMonthOrders = ordersLastMonth.length;
    
    // YTD
    const ytdRevenue = ordersYTD.reduce((sum, o) => sum + o.totalPrice, 0);
    const ytdOrders = ordersYTD.length;
    const ytdItems = ordersYTD.reduce((sum, o) => sum + o.items, 0);
    
    // YTD ano anterior
    const lastYtdRevenue = ordersLastYTD.reduce((sum, o) => sum + o.totalPrice, 0);
    const lastYtdOrders = ordersLastYTD.length;
    
    // Unique customers MTD
    const uniqueCustomers = new Set(ordersMTD.map(o => o.customer?.id).filter(Boolean));
    
    // Taxa de recompra (clientes com mais de 1 pedido no período)
    const customerOrders = {};
    ordersMTD.forEach(o => {
      if (o.customer) {
        customerOrders[o.customer.id] = (customerOrders[o.customer.id] || 0) + 1;
      }
    });
    const returningCustomers = Object.values(customerOrders).filter(c => c > 1).length;
    const repurchaseRate = Object.keys(customerOrders).length > 0 
      ? (returningCustomers / Object.keys(customerOrders).length) * 100 
      : 0;
    
    // Variações
    const mom = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    const yoy = lastYtdRevenue > 0 ? ((ytdRevenue - lastYtdRevenue) / lastYtdRevenue) * 100 : 0;
    
    return {
      mtd: {
        gross: totalRevenue,
        net: totalRevenue * 0.8,
        orders: totalOrders,
        items: totalItems,
        days_in_month: now.getDate(),
      },
      previous_month: {
        gross: lastMonthRevenue,
        net: lastMonthRevenue * 0.8,
        orders: lastMonthOrders,
        items: ordersLastMonth.reduce((sum, o) => sum + o.items, 0),
      },
      ytd: {
        gross: ytdRevenue,
        net: ytdRevenue * 0.8,
        orders: ytdOrders,
        items: ytdItems,
      },
      previous_ytd: {
        gross: lastYtdRevenue,
        net: lastYtdRevenue * 0.8,
        orders: lastYtdOrders,
        items: ordersLastYTD.reduce((sum, o) => sum + o.items, 0),
      },
      metrics: {
        aov,
        items_per_order: totalOrders > 0 ? totalItems / totalOrders : 0,
        conversion_rate: 2.8,
      },
      variations: {
        mom: parseFloat(mom.toFixed(1)),
        yoy: parseFloat(yoy.toFixed(1)),
      },
      shopify: {
        repurchaseRate: parseFloat(repurchaseRate.toFixed(1)),
        uniqueCustomers: uniqueCustomers.size,
        connected: true,
      },
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
