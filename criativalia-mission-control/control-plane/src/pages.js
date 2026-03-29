// Criativalia Control Plane - Pages with Olive Green Theme
module.exports = {
  index: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #1a1a15; }
        ::-webkit-scrollbar-thumb { background: #4A5D23; border-radius: 3px; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .btn-primary:hover { background: linear-gradient(135deg, #5A6D33 0%, #4A5D23 100%); }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s ease; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; transition: all 0.2s; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; transition: all 0.3s; }
        .main-content { margin-left: 0; transition: margin-left 0.3s; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    </style>
</head>
<body class="min-h-screen">
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700; color: #F5F5DC;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item active"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; border-top: 1px solid #3A4D13;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4A5D23, #D4A853); border-radius: 50%; display: flex; align-items: center; justify-content: center;"><i class="fas fa-robot"></i></div>
                <div><div style="font-size: 13px; font-weight: 500; color: #F5F5DC;">Multi-Agent</div><div style="font-size: 11px; color: #7a9e7e;">v2.0 • Online</div></div>
            </div>
        </div>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <div>
                        <h1 style="font-size: 20px; font-weight: 700; color: #F5F5DC;"><i class="fas fa-home" style="color: #D4A853; margin-right: 8px;"></i>Dashboard</h1>
                        <p style="font-size: 12px; color: #D4A853;">Multi-Agent Runtime v2.0</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div id="runtime-status" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #F5F5DC;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #7a9e7e;"></span>
                        <span>Running</span>
                    </div>
                    <button onclick="refreshData()" class="btn-primary" style="padding: 10px 16px; border-radius: 8px;"><i class="fas fa-sync-alt"></i></button>
                </div>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div class="card" style="padding: 20px; border-left: 3px solid #D4A853;">
                    <div style="font-size: 12px; color: #D4A853; text-transform: uppercase; margin-bottom: 8px;">Active Agents</div>
                    <div id="stat-agents" style="font-size: 28px; font-weight: 700; color: #F5F5DC;">-</div>
                </div>
                <div class="card" style="padding: 20px; border-left: 3px solid #7a9e7e;">
                    <div style="font-size: 12px; color: #D4A853; text-transform: uppercase; margin-bottom: 8px;">Active Tasks</div>
                    <div id="stat-tasks" style="font-size: 28px; font-weight: 700; color: #F5F5DC;">-</div>
                </div>
                <div class="card" style="padding: 20px; border-left: 3px solid #4A5D23;">
                    <div style="font-size: 12px; color: #D4A853; text-transform: uppercase; margin-bottom: 8px;">Sessions</div>
                    <div id="stat-sessions" style="font-size: 28px; font-weight: 700; color: #F5F5DC;">-</div>
                </div>
                <div class="card" style="padding: 20px; border-left: 3px solid #c17767;">
                    <div style="font-size: 12px; color: #D4A853; text-transform: uppercase; margin-bottom: 8px;">Pending Review</div>
                    <div id="stat-review" style="font-size: 28px; font-weight: 700; color: #c17767;">-</div>
                </div>
            </div>
            <div style="text-align: center; padding: 24px; color: #D4A853;"><i class="fas fa-leaf" style="margin-right: 8px;"></i>Criativalia Control Plane v2.0 - Sidebar navigation with Olive Green theme</div>
        </div>
    </main>

    <script>
        function toggleSidebar() { const s = document.getElementById('sidebar'), o = document.getElementById('sidebarOverlay'); s.classList.toggle('open'); o.classList.toggle('open'); }
        async function refreshData() { try { const r = await fetch('/api/state'); const d = await r.json(); document.getElementById('stat-agents').textContent = d.active_agents || 0; document.getElementById('stat-tasks').textContent = d.active_tasks || 0; document.getElementById('stat-sessions').textContent = d.active_sessions || 0; document.getElementById('stat-review').textContent = d.pending_review || 0; } catch(e) {} }
        document.addEventListener('DOMContentLoaded', refreshData);
    </script>
</body>
</html>`,

  financial: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financeiro - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #1a1a15; }
        ::-webkit-scrollbar-thumb { background: #4A5D23; border-radius: 3px; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .metric-card { background: linear-gradient(135deg, #252520 0%, #2a2a22 100%); border: 1px solid #4A5D13; border-radius: 12px; position: relative; overflow: hidden; }
        .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #4A5D23, #D4A853); }
        .metric-value { background: linear-gradient(135deg, #F5F5DC 0%, #D4A853 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .btn-primary:hover { background: linear-gradient(135deg, #5A6D33 0%, #4A5D23 100%); }
        .period-selector { background: #252520; border: 1px solid #4A5D23; border-radius: 8px; overflow: hidden; }
        .period-btn { padding: 8px 16px; background: transparent; border: none; color: #F5F5DC; cursor: pointer; transition: all 0.2s; font-size: 14px; }
        .period-btn.active { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #D4A853; background: rgba(74, 93, 35, 0.2); border-bottom: 1px solid #3A4D13; }
        .data-table td { padding: 12px 16px; border-bottom: 1px solid #2a2a22; font-size: 14px; }
        .progress-bar { height: 6px; background: #2a2a22; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #4A5D23, #D4A853); border-radius: 3px; }
        .product-row:hover { background: rgba(74, 93, 35, 0.2); }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item active"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <div>
                        <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-chart-line" style="color: #D4A853; margin-right: 8px;"></i>Financeiro</h1>
                        <p style="font-size: 12px; color: #D4A853;">Analise completa de receitas e metricas</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="period-selector">
                        <button class="period-btn active" onclick="setPeriod('MTD')" id="btn-mtd">MTD</button>
                        <button class="period-btn" onclick="setPeriod('YTD')" id="btn-ytd">YTD</button>
                    </div>
                    <button onclick="refreshData()" class="btn-primary" style="padding: 10px 16px; border-radius: 8px;"><i class="fas fa-sync-alt"></i></button>
                </div>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div class="metric-card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Receita Liquida</span>
                        <i class="fas fa-wallet" style="color: #4A5D23;"></i>
                    </div>
                    <div id="metric-net-revenue" class="metric-value" style="font-size: 28px; font-weight: 700;">R$ 45.678,90</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #7a9e7e;"><i class="fas fa-arrow-up"></i> 12.5% vs mes anterior</div>
                </div>
                <div class="metric-card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Receita Bruta</span>
                        <i class="fas fa-coins" style="color: #D4A853;"></i>
                    </div>
                    <div id="metric-gross-revenue" class="metric-value" style="font-size: 28px; font-weight: 700;">R$ 52.345,00</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #7a9e7e;"><i class="fas fa-arrow-up"></i> 8.3% vs mes anterior</div>
                </div>
                <div class="metric-card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Margem Media</span>
                        <i class="fas fa-percentage" style="color: #7a9e7e;"></i>
                    </div>
                    <div id="metric-margin" class="metric-value" style="font-size: 28px; font-weight: 700;">58.2%</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #7a9e7e;">+2.1% vs periodo anterior</div>
                </div>
                <div class="metric-card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Ticket Medio</span>
                        <i class="fas fa-receipt" style="color: #D4A853;"></i>
                    </div>
                    <div id="metric-aov" class="metric-value" style="font-size: 28px; font-weight: 700;">R$ 371,37</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #7a9e7e;"><i class="fas fa-arrow-up"></i> 3.7% vs mes anterior</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; margin-bottom: 24px;">
                <div class="card">
                    <div style="padding: 16px 20px; border-bottom: 1px solid #3A4D13; display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-chart-area" style="color: #D4A853;"></i>Comparativo de Receita</div>
                        <span style="font-size: 12px; padding: 4px 10px; background: rgba(212,168,83,0.2); color: #D4A853; border-radius: 10px;">MTD</span>
                    </div>
                    <div style="padding: 20px;">
                        <div style="position: relative; height: 300px;"><canvas id="revenueChart"></canvas></div>
                    </div>
                </div>
                <div class="card">
                    <div style="padding: 16px 20px; border-bottom: 1px solid #3A4D13; display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-trophy" style="color: #D4A853;"></i>Produtos Mais Vendidos</div>
                        <div><button class="period-btn active" style="padding: 6px 12px; font-size: 12px;">Qtd</button><button class="period-btn" style="padding: 6px 12px; font-size: 12px;">Valor</button></div>
                    </div>
                    <div style="max-height: 340px; overflow-y: auto;">
                        <div class="product-row" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #2a2a22;">
                            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #D4A853, #4A5D23); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #1a1a15;">1</div>
                            <div style="flex: 1;"><div style="font-weight: 500;">Camiseta Oversized Premium</div><div style="font-size: 12px; color: #7a9e7e;">89 vendas</div></div>
                            <div style="text-align: right;"><div style="font-weight: 600; color: #D4A853;">R$ 4.455,50</div><div style="font-size: 11px; color: #888;">45 pedidos</div></div>
                        </div>
                        <div class="product-row" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #2a2a22;">
                            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #D4A853, #4A5D23); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #1a1a15;">2</div>
                            <div style="flex: 1;"><div style="font-weight: 500;">Bone Dad Hat Criativalia</div><div style="font-size: 12px; color: #7a9e7e;">52 unidades</div></div>
                            <div style="text-align: right;"><div style="font-weight: 600; color: #D4A853;">R$ 1.899,00</div><div style="font-size: 11px; color: #888;">38 vendas</div></div>
                        </div>
                        <div class="product-row" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #2a2a22;">
                            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #D4A853, #4A5D23); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #1a1a15;">3</div>
                            <div style="flex: 1;"><div style="font-weight: 500;">Calca Jogger Comfort</div><div style="font-size: 12px; color: #7a9e7e;">41 unidades</div></div>
                            <div style="text-align: right;"><div style="font-weight: 600; color: #D4A853;">R$ 3.196,80</div><div style="font-size: 11px; color: #888;">32 vendas</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 24px;">
                <div class="card">
                    <div style="padding: 16px 20px; border-bottom: 1px solid #3A4D13;"><div style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-users" style="color: #D4A853;"></i>CAC & LTV</div></div>
                    <div style="padding: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div style="text-align: center; padding: 16px; background: rgba(74,93,35,0.1); border-radius: 8px;">
                                <div style="font-size: 11px; color: #D4A853; text-transform: uppercase; margin-bottom: 8px;">CAC</div>
                                <div style="font-size: 24px; font-weight: 700;">R$ 45,50</div>
                                <div style="font-size: 11px; color: #7a9e7e; margin-top: 4px;">Custo Aquisicao</div>
                            </div>
                            <div style="text-align: center; padding: 16px; background: rgba(212,168,83,0.1); border-radius: 8px;">
                                <div style="font-size: 11px; color: #D4A853; text-transform: uppercase; margin-bottom: 8px;">LTV</div>
                                <div style="font-size: 24px; font-weight: 700;">R$ 485,20</div>
                                <div style="font-size: 11px; color: #7a9e7e; margin-top: 4px;">Valor Vida Util</div>
                            </div>
                        </div>
                        <div style="margin-top: 16px; padding: 12px; background: rgba(74,93,35,0.2); border-radius: 8px; text-align: center;">
                            <span style="font-size: 12px; color: #D4A853;">Ratio LTV/CAC: </span><span style="font-size: 18px; font-weight: 700;">10.7x</span>
                            <div style="font-size: 11px; color: #7a9e7e; margin-top: 4px;">Meta: &gt; 3.0</div>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div style="padding: 16px 20px; border-bottom: 1px solid #3A4D13;"><div style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-funnel-dollar" style="color: #D4A853;"></i>Taxa de Conversao</div></div>
                    <div style="padding: 20px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 48px; font-weight: 700; color: #D4A853;">2.85%</div>
                            <div style="font-size: 12px;">Taxa Global</div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><span style="font-size: 12px; color: #D4A853;">Sessoes</span><span>4.321</span></div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><span style="font-size: 12px; color: #D4A853;">Pedidos</span><span>123</span></div>
                        <div class="progress-bar"><div class="progress-fill" style="width: 28.5%;"></div></div>
                    </div>
                </div>
                <div class="card">
                    <div style="padding: 16px 20px; border-bottom: 1px solid #3A4D13;"><div style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-crystal-ball" style="color: #D4A853;"></i>Previsao de Receita</div></div>
                    <div style="padding: 20px;">
                        <div style="text-align: center; margin-bottom: 16px;">
                            <div style="font-size: 11px; color: #D4A853; text-transform: uppercase;">Projecao Mensal</div>
                            <div style="font-size: 32px; font-weight: 700; margin-top: 4px;">R$ 62.500,00</div>
                        </div>
                        <div style="background: rgba(74,93,35,0.2); border-radius: 8px; padding: 16px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="font-size: 12px; color: #D4A853;">Realizado</span><span>R$ 45.678,90</span></div>
                            <div class="progress-bar" style="margin-bottom: 12px;"><div class="progress-fill" style="width: 73%;"></div></div>
                            <div style="display: flex; justify-content: space-between; font-size: 11px;"><span style="color: #7a9e7e;">Confianca: 87%</span><span style="color: #D4A853;">Faltam: R$ 16.821,10</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
                <div class="card">
                    <div style="padding: 16px 20px; border-bottom: 1px solid #3A4D13;"><div style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-percentage" style="color: #D4A853;"></i>Margem por Produto</div></div>
                    <div style="overflow-x: auto;">
                        <table class="data-table">
                            <thead><tr><th>Produto</th><th>Preco</th><th>Custo</th><th>Margem</th><th>Lucro</th></tr></thead>
                            <tbody>
                                <tr><td style="font-weight: 500;">Camiseta Oversized</td><td>R$ 89,90</td><td style="color: #888;">R$ 35,00</td><td style="color: #7a9e7e; font-weight: 600;">61.1%</td><td style="color: #7a9e7e;">R$ 54,90</td></tr>
                                <tr><td style="font-weight: 500;">Bone Dad Hat</td><td>R$ 59,90</td><td style="color: #888;">R$ 22,00</td><td style="color: #7a9e7e; font-weight: 600;">63.3%</td><td style="color: #7a9e7e;">R$ 37,90</td></tr>
                                <tr><td style="font-weight: 500;">Calca Jogger</td><td>R$ 129,90</td><td style="color: #888;">R$ 55,00</td><td style="color: #D4A853; font-weight: 600;">57.7%</td><td style="color: #7a9e7e;">R$ 74,90</td></tr>
                                <tr><td style="font-weight: 500;">Moletom Essential</td><td>R$ 199,90</td><td style="color: #888;">R$ 85,00</td><td style="color: #D4A853; font-weight: 600;">57.5%</td><td style="color: #7a9e7e;">R$ 114,90</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card">
                    <div style="padding: 16px 20px; border-bottom: 1px solid #3A4D13;"><div style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-tags" style="color: #D4A853;"></i>Ticket Medio por Categoria</div></div>
                    <div style="padding: 20px;">
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="font-size: 13px;">Vestuario</span><span style="font-size: 13px; font-weight: 600; color: #D4A853;">R$ 425,50</span></div>
                            <div class="progress-bar"><div class="progress-fill" style="width: 100%;"></div></div>
                            <div style="font-size: 11px; color: #7a9e7e; margin-top: 4px;">68 pedidos</div>
                        </div>
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="font-size: 13px;">Acessorios</span><span style="font-size: 13px; font-weight: 600; color: #D4A853;">R$ 189,90</span></div>
                            <div class="progress-bar"><div class="progress-fill" style="width: 45%;"></div></div>
                            <div style="font-size: 11px; color: #7a9e7e; margin-top: 4px;">32 pedidos</div>
                        </div>
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="font-size: 13px;">Decoracao</span><span style="font-size: 13px; font-weight: 600; color: #D4A853;">R$ 245,00</span></div>
                            <div class="progress-bar"><div class="progress-fill" style="width: 58%;"></div></div>
                            <div style="font-size: 11px; color: #7a9e7e; margin-top: 4px;">23 pedidos</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="text-align: center; padding: 24px; color: #D4A853; font-size: 12px; border-top: 1px solid #3A4D13; margin-top: 24px;"><i class="fas fa-leaf" style="margin-right: 8px;"></i>Criativalia Control Plane v2.0 - Dados em tempo real do Shopify</div>
        </div>
    </main>

    <script>
        function toggleSidebar() { const s = document.getElementById('sidebar'), o = document.getElementById('sidebarOverlay'); s.classList.toggle('open'); o.classList.toggle('open'); }
        function setPeriod(p) { document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active')); document.getElementById('btn-' + p.toLowerCase()).classList.add('active'); }
        function refreshData() { alert('Atualizando dados do Shopify...'); }
        document.addEventListener('DOMContentLoaded', () => {
            const ctx = document.getElementById('revenueChart').getContext('2d');
            new Chart(ctx, { type: 'line', data: { labels: ['1','5','10','15','20','25','30'], datasets: [{ label: 'Mes Atual', data: [1200,2800,1500,3200,4100,3800,2900], borderColor: '#D4A853', backgroundColor: 'rgba(212,168,83,0.1)', borderWidth: 3, fill: true, tension: 0.4 }, { label: 'Mes Anterior', data: [1000,2200,1800,2800,3500,3200,2500], borderColor: '#4A5D23', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5,5], tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#F5F5DC' } } }, scales: { y: { grid: { color: '#3A4D13' }, ticks: { color: '#D4A853' } }, x: { grid: { display: false }, ticks: { color: '#D4A853' } } } } });
        });
    </script>
</body>
</html>`,

  dashboard: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shopify Dashboard - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .metric-card { background: linear-gradient(135deg, #252520 0%, #2a2a22 100%); border: 1px solid #4A5D13; border-radius: 12px; position: relative; overflow: hidden; }
        .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #4A5D23, #D4A853); }
        .metric-value { background: linear-gradient(135deg, #F5F5DC 0%, #D4A853 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item active"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <div>
                        <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-store" style="color: #D4A853; margin-right: 8px;"></i>Shopify Dashboard</h1>
                        <p style="font-size: 12px; color: #D4A853;">Real-time Store Analytics</p>
                    </div>
                </div>
                <button onclick="refreshDashboard()" class="btn-primary" style="padding: 10px 16px; border-radius: 8px;"><i class="fas fa-sync-alt"></i></button>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div class="metric-card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><span style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Receita MTD</span><i class="fas fa-dollar-sign" style="color: #D4A853;"></i></div>
                    <div class="metric-value" style="font-size: 28px; font-weight: 700;">R$ 45.678,90</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #7a9e7e;"><i class="fas fa-arrow-up"></i> 12.5% vs mes anterior</div>
                </div>
                <div class="metric-card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><span style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Pedidos</span><i class="fas fa-shopping-bag" style="color: #7a9e7e;"></i></div>
                    <div class="metric-value" style="font-size: 28px; font-weight: 700;">123</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #7a9e7e;"><i class="fas fa-arrow-up"></i> 8.3% vs mes anterior</div>
                </div>
                <div class="metric-card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><span style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Ticket Medio</span><i class="fas fa-receipt" style="color: #D4A853;"></i></div>
                    <div class="metric-value" style="font-size: 28px; font-weight: 700;">R$ 371,37</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #7a9e7e;"><i class="fas fa-arrow-up"></i> 3.7% vs mes anterior</div>
                </div>
                <div class="metric-card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><span style="font-size: 12px; color: #D4A853; text-transform: uppercase;">Taxa Recompra</span><i class="fas fa-redo" style="color: #7a9e7e;"></i></div>
                    <div class="metric-value" style="font-size: 28px; font-weight: 700;">32.5%</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #c17767;"><i class="fas fa-arrow-down"></i> -2.1% vs mes anterior</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px;">
                <div class="card">
                    <div style="padding: 16px 20px; border-bottom: 1px solid #3A4D13;"><div style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-chart-bar" style="color: #D4A853;"></i>Receita - Ultimos 7 Dias</div></div>
                    <div style="padding: 20px;"><div style="position: relative; height: 300px;"><canvas id="revenueChart"></canvas></div></div>
                </div>
                <div class="card">
                    <div style="padding: 16px 20px; border-bottom: 1px solid #3A4D13;"><div style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-trophy" style="color: #D4A853;"></i>Top Produtos</div></div>
                    <div style="max-height: 340px; overflow-y: auto;">
                        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #3A4D13;">
                            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #D4A853, #4A5D23); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #1a1a15;">1</div>
                            <div style="flex: 1;"><div style="font-weight: 500;">Camiseta Oversized</div><div style="font-size: 12px; color: #888;">45 vendas</div></div>
                            <div style="text-align: right;"><div style="font-weight: 600; color: #D4A853;">R$ 4.455,50</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="text-align: center; padding: 24px; color: #D4A853; font-size: 12px; border-top: 1px solid #3A4D13; margin-top: 24px;"><i class="fas fa-leaf" style="margin-right: 8px;"></i>Criativalia Control Plane v2.0 - Shopify Integration</div>
        </div>
    </main>

    <script>
        function toggleSidebar() { const s = document.getElementById('sidebar'), o = document.getElementById('sidebarOverlay'); s.classList.toggle('open'); o.classList.toggle('open'); }
        function refreshDashboard() { alert('Atualizando dados...'); }
        document.addEventListener('DOMContentLoaded', () => {
            const ctx = document.getElementById('revenueChart').getContext('2d');
            new Chart(ctx, { type: 'bar', data: { labels: ['Seg','Ter','Qua','Qui','Sex','Sab','Dom'], datasets: [{ label: 'Receita', data: [5234,7891,4567,6234,8912,7234,5423], backgroundColor: 'rgba(212,168,83,0.8)', borderColor: '#D4A853', borderWidth: 1, borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#3A4D13' }, ticks: { color: '#888' } }, x: { grid: { display: false }, ticks: { color: '#888' } } } } });
        });
    </script>
</body>
</html>`,

  kanban: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kanban - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .kanban-column { background: rgba(74, 93, 35, 0.1); border-radius: 8px; min-height: 400px; }
        .kanban-card { background: #252520; border: 1px solid #3A4D13; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: grab; }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item active"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <div>
                        <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-columns" style="color: #D4A853; margin-right: 8px;"></i>Kanban</h1>
                        <p style="font-size: 12px; color: #D4A853;">Task Management Board</p>
                    </div>
                </div>
                <button class="btn-primary" style="padding: 10px 16px; border-radius: 8px;"><i class="fas fa-plus"></i> New Task</button>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h3 style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-circle" style="color: #888; font-size: 8px;"></i>Backlog</h3>
                        <span style="background: #3A4D13; padding: 2px 8px; border-radius: 10px; font-size: 12px;">3</span>
                    </div>
                    <div class="kanban-column" style="padding: 12px;">
                        <div class="kanban-card">
                            <div style="font-weight: 500; margin-bottom: 8px;">Setup Shopify Integration</div>
                            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888;">
                                <span style="background: rgba(212,168,83,0.2); color: #D4A853; padding: 2px 6px; border-radius: 4px;">P8</span>
                                <span><i class="fas fa-clock" style="margin-right: 4px;"></i>2h</span>
                            </div>
                        </div>
                        <div class="kanban-card">
                            <div style="font-weight: 500; margin-bottom: 8px;">Create Marketing Campaign</div>
                            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888;">
                                <span style="background: rgba(212,168,83,0.2); color: #D4A853; padding: 2px 6px; border-radius: 4px;">P5</span>
                                <span><i class="fas fa-clock" style="margin-right: 4px;"></i>4h</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h3 style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-circle" style="color: #D4A853; font-size: 8px;"></i>In Progress</h3>
                        <span style="background: #3A4D13; padding: 2px 8px; border-radius: 10px; font-size: 12px;">2</span>
                    </div>
                    <div class="kanban-column" style="padding: 12px;">
                        <div class="kanban-card">
                            <div style="font-weight: 500; margin-bottom: 8px;">Build Financial Dashboard</div>
                            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888;">
                                <span style="background: rgba(193,119,103,0.2); color: #c17767; padding: 2px 6px; border-radius: 4px;">P10</span>
                                <span><i class="fas fa-clock" style="margin-right: 4px;"></i>6h</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h3 style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-circle" style="color: #7a9e7e; font-size: 8px;"></i>Done</h3>
                        <span style="background: #3A4D13; padding: 2px 8px; border-radius: 10px; font-size: 12px;">5</span>
                    </div>
                    <div class="kanban-column" style="padding: 12px;">
                        <div class="kanban-card">
                            <div style="font-weight: 500; margin-bottom: 8px;">Olive Green Theme Update</div>
                            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888;">
                                <span style="background: rgba(122,158,126,0.2); color: #7a9e7e; padding: 2px 6px; border-radius: 4px;">P7</span>
                                <span><i class="fas fa-check" style="margin-right: 4px;"></i>Done</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        function toggleSidebar() { const s = document.getElementById('sidebar'), o = document.getElementById('sidebarOverlay'); s.classList.toggle('open'); o.classList.toggle('open'); }
    </script>
</body>
</html>`,

  timesheet: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timesheet - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .timesheet-table { width: 100%; border-collapse: collapse; }
        .timesheet-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #D4A853; background: rgba(74, 93, 35, 0.2); border-bottom: 1px solid #3A4D13; }
        .timesheet-table td { padding: 12px 16px; border-bottom: 1px solid #2a2a22; font-size: 14px; }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item active"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <div>
                        <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-clock" style="color: #D4A853; margin-right: 8px;"></i>Timesheet</h1>
                        <p style="font-size: 12px; color: #D4A853;">Agent Activity Tracking</p>
                    </div>
                </div>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div class="card">
                <div style="padding: 16px 20px; border-bottom: 1px solid #3A4D13;"><div style="font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-list" style="color: #D4A853;"></i>Agent Activity Log - Last 24 Hours</div></div>
                <div style="overflow-x: auto;">
                    <table class="timesheet-table">
                        <thead>
                            <tr><th>Agent</th><th>Task</th><th>Started</th><th>Duration</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            <tr><td style="font-weight: 500;">CEO Agent</td><td>Financial Dashboard Design</td><td style="color: #888;">2026-03-29 01:30</td><td>4h 15m</td><td><span style="background: rgba(122,158,126,0.2); color: #7a9e7e; padding: 4px 10px; border-radius: 10px; font-size: 12px;">Completed</span></td></tr>
                            <tr><td style="font-weight: 500;">Traffic Scanner</td><td>Opportunity Detection</td><td style="color: #888;">2026-03-29 00:00</td><td>12h 30m</td><td><span style="background: rgba(212,168,83,0.2); color: #D4A853; padding: 4px 10px; border-radius: 10px; font-size: 12px;">Running</span></td></tr>
                            <tr><td style="font-weight: 500;">Shopify Agent</td><td>Product Sync</td><td style="color: #888;">2026-03-28 22:00</td><td>2h 45m</td><td><span style="background: rgba(122,158,126,0.2); color: #7a9e7e; padding: 4px 10px; border-radius: 10px; font-size: 12px;">Completed</span></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <script>
        function toggleSidebar() { const s = document.getElementById('sidebar'), o = document.getElementById('sidebarOverlay'); s.classList.toggle('open'); o.classList.toggle('open'); }
    </script>
</body>
</html>`,

  deliverables: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entregas - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .deliverable-card { background: #252520; border: 1px solid #3A4D13; border-radius: 8px; padding: 16px; transition: all 0.2s; }
        .deliverable-card:hover { border-color: #D4A853; }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item active"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <div>
                        <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-box" style="color: #D4A853; margin-right: 8px;"></i>Entregas</h1>
                        <p style="font-size: 12px; color: #D4A853;">Agent Deliverables & Outputs</p>
                    </div>
                </div>
                <button class="btn-primary" style="padding: 10px 16px; border-radius: 8px;"><i class="fas fa-download"></i> Export All</button>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
                <div class="deliverable-card">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <i class="fas fa-file-code" style="color: #D4A853;"></i>
                        <span style="font-size: 12px; color: #7a9e7e;">financial.html</span>
                    </div>
                    <div style="font-weight: 600; margin-bottom: 8px;">Financial Dashboard Page</div>
                    <div style="font-size: 12px; color: #888; margin-bottom: 12px;">Complete financial analytics with olive green theme, responsive design, and Shopify integration.</div>
                    <div style="display: flex; gap: 8px;">
                        <span style="font-size: 11px; padding: 4px 8px; background: rgba(74,93,35,0.3); border-radius: 4px;">HTML</span>
                        <span style="font-size: 11px; padding: 4px 8px; background: rgba(212,168,83,0.2); border-radius: 4px;">UI</span>
                    </div>
                </div>
                <div class="deliverable-card">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <i class="fas fa-paint-brush" style="color: #D4A853;"></i>
                        <span style="font-size: 12px; color: #7a9e7e;">theme.css</span>
                    </div>
                    <div style="font-weight: 600; margin-bottom: 8px;">Criativalia Theme Update</div>
                    <div style="font-size: 12px; color: #888; margin-bottom: 12px;">Olive green color palette (#4A5D23) with off-white text (#F5F5DC) for consistent branding.</div>
                    <div style="display: flex; gap: 8px;">
                        <span style="font-size: 11px; padding: 4px 8px; background: rgba(74,93,35,0.3); border-radius: 4px;">CSS</span>
                        <span style="font-size: 11px; padding: 4px 8px; background: rgba(212,168,83,0.2); border-radius: 4px;">Design</span>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        function toggleSidebar() { const s = document.getElementById('sidebar'), o = document.getElementById('sidebarOverlay'); s.classList.toggle('open'); o.classList.toggle('open'); }
    </script>
</body>
</html>`,

  agent: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent - Criativalia Control Plane</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #4A5D23 #1a1a15; }
        body { font-family: 'Inter', sans-serif; background: #1a1a15; color: #F5F5DC; }
        .card { background: linear-gradient(145deg, #252520 0%, #1e1e18 100%); border: 1px solid #3A4D13; border-radius: 12px; }
        .btn-primary { background: linear-gradient(135deg, #4A5D23 0%, #3A4D13 100%); color: #F5F5DC; border: 1px solid #5A6D33; }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: linear-gradient(180deg, #252520 0%, #1a1a15 100%); border-right: 1px solid #3A4D13; z-index: 100; transform: translateX(-100%); transition: transform 0.3s; }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .sidebar-overlay.open { opacity: 1; visibility: visible; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #E5E5CC; text-decoration: none; border-left: 3px solid transparent; }
        .sidebar-item:hover, .sidebar-item.active { background: rgba(74, 93, 35, 0.3); border-left-color: #D4A853; color: #F5F5DC; }
        .sidebar-item i { width: 24px; text-align: center; color: #D4A853; }
        .hamburger { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; }
        .hamburger span { width: 24px; height: 2px; background: #F5F5DC; }
        .main-content { margin-left: 0; }
        @media (min-width: 1024px) { .sidebar { transform: translateX(0); } .main-content { margin-left: 260px; } .hamburger { display: none; } }
        .logo-container { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #3A4D13; }
        .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #4A5D23 0%, #D4A853 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
        <div class="logo-container">
            <div class="logo-icon"><i class="fas fa-leaf"></i></div>
            <div><div style="font-size: 18px; font-weight: 700;">Criativalia</div><div style="font-size: 11px; color: #D4A853;">CONTROL PLANE</div></div>
        </div>
        <nav style="padding: 16px 0;">
            <a href="/" class="sidebar-item"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="/kanban" class="sidebar-item"><i class="fas fa-columns"></i><span>Kanban</span></a>
            <a href="/timesheet" class="sidebar-item"><i class="fas fa-clock"></i><span>Timesheet</span></a>
            <a href="/deliverables" class="sidebar-item"><i class="fas fa-box"></i><span>Entregas</span></a>
            <a href="/financial" class="sidebar-item"><i class="fas fa-chart-line"></i><span>Financeiro</span></a>
            <a href="/dashboard" class="sidebar-item"><i class="fas fa-store"></i><span>Shopify</span></a>
        </nav>
    </aside>

    <main class="main-content">
        <header style="border-bottom: 1px solid #3A4D13; background: linear-gradient(180deg, #252520 0%, #1e1e18 100%); position: sticky; top: 0; z-index: 50;">
            <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="hamburger" onclick="toggleSidebar()"><span></span><span></span><span></span></div>
                    <div>
                        <h1 style="font-size: 20px; font-weight: 700;"><i class="fas fa-robot" style="color: #D4A853; margin-right: 8px;"></i>Agent Details</h1>
                        <p style="font-size: 12px; color: #D4A853;">View agent information and activity</p>
                    </div>
                </div>
            </div>
        </header>

        <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
            <div class="card" style="padding: 24px;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #4A5D23, #D4A853); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px;"><i class="fas fa-robot"></i></div>
                    <div>
                        <div style="font-size: 24px; font-weight: 700;">CEO Agent</div>
                        <div style="font-size: 14px; color: #D4A853;">Strategic Planning & Coordination</div>
                        <div style="margin-top: 8px;"><span style="font-size: 12px; padding: 4px 12px; background: rgba(122,158,126,0.2); color: #7a9e7e; border-radius: 10px;">Running</span></div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div style="background: rgba(74,93,35,0.1); padding: 16px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #D4A853; margin-bottom: 4px;">Active Sessions</div>
                        <div style="font-size: 24px; font-weight: 700;">3</div>
                    </div>
                    <div style="background: rgba(74,93,35,0.1); padding: 16px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #D4A853; margin-bottom: 4px;">Tasks Completed</div>
                        <div style="font-size: 24px; font-weight: 700;">47</div>
                    </div>
                    <div style="background: rgba(74,93,35,0.1); padding: 16px; border-radius: 8px;">
                        <div style="font-size: 12px; color: #D4A853; margin-bottom: 4px;">Runtime Hours</div>
                        <div style="font-size: 24px; font-weight: 700;">128.5h</div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        function toggleSidebar() { const s = document.getElementById('sidebar'), o = document.getElementById('sidebarOverlay'); s.classList.toggle('open'); o.classList.toggle('open'); }
    </script>
</body>
</html>`
};
