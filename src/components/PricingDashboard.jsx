import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, BarChart3, Download, RefreshCw } from 'lucide-react'
import pricingService from '../services/pricingService'

const PricingDashboard = () => {
  const [pricingTable, setPricingTable] = useState([])
  const [costStats, setCostStats] = useState({})
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    setLoading(true)
    try {
      const table = pricingService.getPricingTable()
      const stats = pricingService.getCostStats()
      setPricingTable(table)
      setCostStats(stats)
    } catch (error) {
      console.error('Error loading pricing data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Listen for cost data updates
    const handleCostUpdate = (event) => {
      console.log('💰 New cost data received:', event.detail)
      loadData() // Refresh dashboard data
    }

    window.addEventListener('costDataUpdated', handleCostUpdate)

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('costDataUpdated', handleCostUpdate)
    }
  }, [])

  const exportData = () => {
    const exportData = pricingService.exportCostHistory()
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cost-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all cost history? This cannot be undone.')) {
      pricingService.clearCostHistory()
      loadData()
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Pricing Dashboard</h1>
            <p className="text-gray-400">Cost tracking and pricing management for AI generation</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
            >
              <Download size={16} />
              Export Data
            </button>
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
            >
              Clear History
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="text-blue-400" size={24} />
                  <h3 className="font-semibold">Total Generations</h3>
                </div>
                <p className="text-2xl font-bold">{costStats.totalGenerations || 0}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="text-red-400" size={24} />
                  <h3 className="font-semibold">Total Costs</h3>
                </div>
                <p className="text-2xl font-bold">${costStats.totalCost || 0}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="text-green-400" size={24} />
                  <h3 className="font-semibold">Total Revenue</h3>
                </div>
                <p className="text-2xl font-bold">${costStats.totalRevenue || 0}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="text-purple-400" size={24} />
                  <h3 className="font-semibold">Total Profit</h3>
                </div>
                <p className="text-2xl font-bold text-green-400">${costStats.totalProfit || 0}</p>
                <p className="text-sm text-gray-400">{costStats.profitMargin || '0%'} margin</p>
              </div>
            </div>

            {/* Pricing Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold">Current Pricing Table</h2>
                <p className="text-gray-400 mt-1">
                  Live pricing based on actual API costs. Image models: 50% markup, Video models: 35% markup
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left p-4">Model</th>
                      <th className="text-left p-4">Type</th>
                      <th className="text-left p-4">Setting</th>
                      <th className="text-right p-4">API Cost</th>
                      <th className="text-right p-4">Customer Price</th>
                      <th className="text-right p-4">Profit</th>
                      <th className="text-right p-4">Margin</th>
                      <th className="text-center p-4">Samples</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingTable.map((row, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="p-4 font-medium">{row.model}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            row.type === 'Image' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300">{row.setting}</td>
                        <td className="p-4 text-right font-mono">${row.estimatedCost}</td>
                        <td className="p-4 text-right font-mono font-bold text-green-400">${row.customerCharge}</td>
                        <td className="p-4 text-right font-mono text-green-300">${row.profit}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            row.margin > 1.4 ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
                          }`}>
                            {((row.margin - 1) * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            row.sampleSize > 0 ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {row.sampleSize > 0 ? `${row.sampleSize} real` : 'estimated'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pricingTable.length === 0 && (
                <div className="p-12 text-center">
                  <BarChart3 className="mx-auto mb-4 text-gray-600" size={48} />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No Pricing Data Available</h3>
                  <p className="text-gray-500">Generate some images or videos to see pricing information.</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            {costStats.totalGenerations === 0 && (
              <div className="mt-8 bg-blue-900 border border-blue-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
                <div className="text-blue-200 space-y-2">
                  <p>• Generate some images or videos to start collecting cost data</p>
                  <p>• The system automatically tracks API costs and calculates customer pricing</p>
                  <p>• As you generate more content, pricing becomes more accurate based on real usage</p>
                  <p>• Export your data regularly for backup and analysis</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PricingDashboard