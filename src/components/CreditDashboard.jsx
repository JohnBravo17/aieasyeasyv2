import React, { useState, useEffect } from "react";
import { CreditCard, Plus, Clock, TrendingUp, TrendingDown, Gift } from "lucide-react";
import creditService from "../services/creditService";
import "./CreditDashboard.css";

const CreditDashboard = () => {
  const [creditBalance, setCreditBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEver, setTotalEver] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    try {
      setLoading(true);
      
      // Load all credit data
      const [balance, history, ever, spent] = await Promise.all([
        creditService.getCreditBalance(),
        creditService.getTransactionHistory(20),
        creditService.getTotalCreditsEver(),
        creditService.getTotalSpentCredits()
      ]);
      
      setCreditBalance(balance);
      setTransactions(history);
      setTotalEver(ever);
      setTotalSpent(spent);
      
    } catch (error) {
      console.error('Error loading credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type, amount) => {
    if (type === 'topup' || amount > 0) {
      return <TrendingUp className="transaction-icon positive" size={16} />;
    } else {
      return <TrendingDown className="transaction-icon negative" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="credit-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading credit information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="credit-dashboard">
      {/* Credit Balance Card */}
      <div className="credit-balance-card">
        <div className="balance-header">
          <div className="balance-icon">
            <CreditCard size={32} />
          </div>
          <div className="balance-info">
            <h2 className="balance-title">Credit Balance</h2>
            <div className="balance-amount">
              <span className="credits">{creditBalance}</span>
              <span className="credits-label">Credits</span>
            </div>
          </div>
        </div>
        
        <div className="balance-actions">
          <button className="top-up-btn">
            <Plus size={16} />
            Top Up Credits
          </button>
        </div>
      </div>

      {/* Credit Statistics */}
      <div className="credit-stats">
        <div className="stat-card">
          <div className="stat-icon purchased">
            <Gift size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalEver}</div>
            <div className="stat-label">Total Purchased</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon spent">
            <TrendingDown size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalSpent}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon efficiency">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {totalEver > 0 ? Math.round((totalSpent / totalEver) * 100) : 0}%
            </div>
            <div className="stat-label">Usage Rate</div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-history">
        <div className="history-header">
          <h3 className="history-title">
            <Clock size={20} />
            Recent Transactions
          </h3>
        </div>
        
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transactions yet</p>
              <span>Your credit transactions will appear here</span>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-left">
                  {getTransactionIcon(transaction.type, transaction.amount)}
                  <div className="transaction-details">
                    <div className="transaction-description">
                      {transaction.description}
                    </div>
                    <div className="transaction-date">
                      {formatDate(transaction.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="transaction-right">
                  <div className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                  </div>
                  <div className="balance-after">
                    Balance: {transaction.balanceAfter}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Credit Packages (for future top-up feature) */}
      <div className="credit-packages-preview">
        <h4>Available Credit Packages</h4>
        <div className="packages-grid">
          {creditService.getCreditPackages().map(pkg => (
            <div key={pkg.id} className={`package-card ${pkg.popular ? 'popular' : ''}`}>
              {pkg.popular && <div className="popular-badge">Most Popular</div>}
              <div className="package-credits">{pkg.credits} Credits</div>
              <div className="package-price">฿{pkg.thbPrice}</div>
              <button className="package-btn" disabled>
                Coming Soon
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreditDashboard;