const JobOrder = require('../models/JobOrder')
const Material = require('../models/Material')
const Invoice = require('../models/Invoice')
const ProductionLog = require('../models/ProductionLog')

const getDashboard = async (req, res) => {
  const totalOrders = await JobOrder.countDocuments()
  const inProgress = await JobOrder.countDocuments({
    status: { $in: ['pending', 'cutting', 'polishing', 'engraving', 'assembly'] }
  })
  const completed = await JobOrder.countDocuments({ status: 'completed' })
  const cancelled = await JobOrder.countDocuments({ status: 'cancelled' })

  const materials = await Material.find()
  const lowStockAlerts = materials.filter(m => m.quantity_in_stock <= m.min_threshold)

  const invoices = await Invoice.find()
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0)

  res.json({
    totalOrders,
    inProgress,
    completed,
    cancelled,
    lowStockAlerts: lowStockAlerts.map(m => ({ name: m.name, quantity: m.quantity_in_stock })),
    totalRevenue
  })
}


const getDeadStock = async (req, res) => {
  const monthsThreshold = parseInt (req.query.months) || 6
  const cutoffDate = new Date ()
  cutoffDate.setMonth(cutoffDate.getMonth () - monthsThreshold)

  const deadMaterials = await Material.find ({
    updatedAt: { $lt: cutoffDate },
    quantity_in_stock: { $gt: 0 }
  })

  res.json ({
    Threshold: `${monthsThreshold} months`,
    Count: deadMaterials.length,
    Materials: deadMaterials
  })
}

const getProductionReport = async (req, res) => {
  const logs = await ProductionLog.find({ status: 'completed', endTime: { $exists: true } })

  const byWorkstation = {}
  for (const log of logs) {
    const duration = (log.endTime - log.startTime) / 60000  
    if (!byWorkstation[log.workstation]) {
      byWorkstation[log.workstation] = { total: 0, count: 0 }
    }
    byWorkstation[log.workstation].total += duration
    byWorkstation[log.workstation].count += 1
  }

  const report = Object.entries(byWorkstation).map(([station, data]) => ({
    workstation: station,
    avgMinutes: (data.total / data.count).toFixed(1),
    totalJobs: data.count
  }))

  res.json(report)
}

const getFinancialStats = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 1. Aggregating monthly revenue and expenses
    const monthlyStats = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          revenue: {
            $sum: { $ifNull: ["$amountPaid", 0] }
          },
          expenses: {
            $sum: { $add: [{ $ifNull: ["$materialsCost", 0] }, { $ifNull: ["$laborCost", 0] }] }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueData = monthlyStats.map(stat => ({
      month: months[stat._id.month - 1],
      revenue: stat.revenue,
      expenses: stat.expenses
    }));

    // 2. Summary stats
    const allInvoices = await Invoice.find().populate({
      path: 'jobOrder',
      populate: { path: 'customer' }
    });
    let totalRevenue = 0;
    let totalMaterials = 0;
    let totalLabor = 0;
    let pendingAmount = 0;
    let pendingCount = 0;

    allInvoices.forEach(inv => {
      totalRevenue += (inv.amountPaid || 0);
      if (inv.paymentStatus !== 'paid') {
        pendingAmount += (inv.amount - (inv.amountPaid || 0));
        pendingCount++;
      }
      totalMaterials += (inv.materialsCost || 0);
      totalLabor += (inv.laborCost || 0);
    });

    // 3. Cost breakdown
    // Adding some estimation for utilities/maintenance as discussed
    const estimatedUtilities = totalRevenue * 0.05; 
    const estimatedMaintenance = totalRevenue * 0.03;

    const costBreakdown = [
      { name: 'Materials', value: totalMaterials, color: '#3b82f6' },
      { name: 'Labor', value: totalLabor, color: '#10b981' },
      { name: 'Utilities', value: Math.round(estimatedUtilities), color: '#f59e0b' },
      { name: 'Maintenance', value: Math.round(estimatedMaintenance), color: '#8b5cf6' },
    ];

    res.json({
      invoices: allInvoices.map(inv => ({
        id: inv._id,
        orderId: inv.jobOrder?._id,
        customer: inv.jobOrder?.customer?.name || "Unknown Customer",
        amount: `$${(inv.amount || 0).toLocaleString()}`,
        rawAmount: inv.amount || 0,
        status: inv.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
        dueDate: new Date(inv.createdAt).toLocaleDateString(), // Use createdAt for now
        paidDate: inv.paymentStatus === 'paid' ? new Date(inv.updatedAt).toLocaleDateString() : "-",
        materialsCost: inv.materialsCost || 0,
        laborCost: inv.laborCost || 0
      })),
      revenueData,
      summary: {
        totalRevenue,
        totalExpenses: totalMaterials + totalLabor + estimatedUtilities + estimatedMaintenance,
        pendingAmount,
        pendingCount
      },
      costBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFullReport = async (req, res) => {
  try {
    // 1. Production Efficiency (Last 7 days/weeks)
    const logs = await ProductionLog.find({ status: 'completed', endTime: { $exists: true } });
    const efficiencyByDay = {};
    logs.forEach(log => {
      const date = log.endTime.toISOString().split('T')[0];
      const duration = (log.endTime - log.startTime) / 60000; // minutes
      const efficiency = Math.min(100, (30 / duration) * 100); 
      if (!efficiencyByDay[date]) efficiencyByDay[date] = { sum: 0, count: 0 };
      efficiencyByDay[date].sum += efficiency;
      efficiencyByDay[date].count += 1;
    });

    const productionEfficiency = Object.entries(efficiencyByDay).map(([date, data]) => ({
      date,
      efficiency: Math.round(data.sum / data.count),
      target: 85
    })).sort((a, b) => a.date.localeCompare(b.date)).slice(-10);

    // 2. Inventory Usage
    const orders = await JobOrder.find({ status: 'completed' }).populate('materialsUsed.material');
    const materialUsageMap = {};
    orders.forEach(order => {
      order.materialsUsed.forEach(item => {
        const name = item.material?.name || "Unknown";
        if (!materialUsageMap[name]) materialUsageMap[name] = { used: 0, purchased: 0 };
        materialUsageMap[name].used += item.quantity;
        materialUsageMap[name].purchased += (item.material?.quantity_in_stock || 0) + item.quantity;
      });
    });

    const inventoryUsage = Object.entries(materialUsageMap).map(([material, data]) => ({
      material,
      used: data.used,
      purchased: data.purchased
    })).slice(0, 6);

    // 3. Orders by Category
    const categoryStats = await JobOrder.aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerData'
        }
      },
      { $unwind: '$customerData' },
      {
        $group: {
          _id: '$customerData.category',
          orders: { $sum: 1 },
          revenue: { $sum: '$totalCost' }
        }
      }
    ]);

    const ordersByCategory = categoryStats.map(stat => ({
      category: stat._id || 'Retail',
      orders: stat.orders,
      revenue: stat.revenue
    }));

    // 4. Financial Performance (Monthly)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyStats = await Invoice.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          revenue: { $sum: { $ifNull: ["$amountPaid", 0] } },
          expenses: { $sum: { $add: [{ $ifNull: ["$materialsCost", 0] }, { $ifNull: ["$laborCost", 0] }] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const financialPerformance = monthlyStats.map(stat => ({
      week: months[stat._id.month - 1],
      revenue: stat.revenue,
      costs: stat.expenses
    }));

    // 5. KPIs
    const totalInvoices = await Invoice.find();
    const totalRev = totalInvoices.reduce((s, i) => s + (i.amountPaid || 0), 0);
    const totalExp = totalInvoices.reduce((s, i) => s + ((i.materialsCost || 0) + (i.laborCost || 0)), 0);
    
    const completedOrdersCount = await JobOrder.countDocuments({ status: 'completed' });
    const completedOrders = await JobOrder.find({ status: 'completed' });
    const onTimeCount = completedOrders.filter(o => o.deliveryDate && o.updatedAt <= o.deliveryDate).length;

    const avgEff = productionEfficiency.length > 0 
      ? Math.round(productionEfficiency.reduce((s, e) => s + e.efficiency, 0) / productionEfficiency.length)
      : 88;

    res.json({
      productionEfficiency,
      inventoryUsage,
      financialPerformance,
      ordersByCategory,
      kpis: {
        avgEfficiency: avgEff,
        materialUsage: 75,
        profitMargin: totalRev > 0 ? Math.round(((totalRev - totalExp) / totalRev) * 100) : 0,
        onTimeDelivery: completedOrdersCount > 0 ? Math.round((onTimeCount / completedOrdersCount) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard , getDeadStock , getProductionReport, getFinancialStats, getFullReport }