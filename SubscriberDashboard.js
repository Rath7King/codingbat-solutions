import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SubscriptionRequestComponent from './SubscriptionRequestComponent';
import DownloadReportComponent from './DownloadReportComponent';
import './SubscriberDashboard.css';

const SubscriberDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return path || 'home';
  };
  
  const activeTab = getActiveTab();

  const user = { name: 'John Doe', email: 'john.doe@bank.com', role: 'Subscriber' };

  const [subscriptions] = useState([
    { id: 1, domain: 'Equities', status: 'APPROVED', requestedAt: '2024-12-01', approvedAt: '2024-12-02' },
    { id: 2, domain: 'FX', status: 'APPROVED', requestedAt: '2024-12-05', approvedAt: '2024-12-06' },
    { id: 3, domain: 'Commodities', status: 'PENDING', requestedAt: '2024-12-15', approvedAt: null },
    { id: 4, domain: 'Fixed Income', status: 'REJECTED', requestedAt: '2024-11-20', approvedAt: '2024-11-22' }
  ]);

  const [reports] = useState([
    { id: 1, title: 'Q4 2024 Equities Market Analysis', domain: 'Equities', publishedAt: '2024-12-15', version: 'v1.2', format: 'PDF', size: '2.4 MB', downloads: 145 },
    { id: 2, title: 'FX Trading Weekly Summary', domain: 'FX', publishedAt: '2024-12-18', version: 'v2.0', format: 'XLSX', size: '856 KB', downloads: 98 },
    { id: 3, title: 'Global Equities Performance Review', domain: 'Equities', publishedAt: '2024-12-20', version: 'v1.1', format: 'PDF', size: '1.8 MB', downloads: 312 },
    { id: 4, title: 'FX Volatility Index Analysis', domain: 'FX', publishedAt: '2024-12-22', version: 'v1.0', format: 'CSV', size: '645 KB', downloads: 87 }
  ]);

  const approvedDomains = subscriptions.filter(s => s.status === 'APPROVED').map(s => s.domain);
  const filteredReports = reports.filter(r => approvedDomains.includes(r.domain));

  const statusClass = { APPROVED: 'bg-success', PENDING: 'bg-warning text-dark', REJECTED: 'bg-danger' };

  const menuItems = [
    { name: "Dashboard", icon: "", path: "home" },
    { name: "My Subscriptions", icon: "", path: "subscriptions" },
    { name: "Request Subscription", icon: "", path: "request" },
    { name: "Download Reports", icon: "", path: "downloads" }
  ];

  const StatCard = ({ label, value }) => (
    <div className="col-md-6 col-lg-3">
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="text-muted small mb-2">{label}</div>
          <div className="display-6 fw-bold text-primary">{value}</div>
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ text }) => (
    <div className="text-center py-5">
      <i className="bi bi-inbox" style={{fontSize: '4rem', opacity: 0.2}}></i>
      <p className="text-muted mt-3">{text}</p>
    </div>
  );

  return (
    <>

      <button 
        className={`sidebar-toggle ${sidebarOpen ? 'open' : 'closed'}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      <div className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-stripe"></div>
        
        <div className="sidebar-header">
          <div className="sidebar-logo"></div>
          <div className="sidebar-title-wrapper">
            <h2 className="sidebar-title">RW Tool</h2>
            <p className="sidebar-subtitle">Subscriber Panel</p>
          </div>
        </div>

        <div className="user-profile">
          <div className="user-name">{user.name}</div>
          <div className="user-email">{user.email}</div>
          <span className="user-role-badge">{user.role}</span>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">Navigation</p>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(`/dashboard/${item.path}`)}
              className={`sidebar-nav-btn ${activeTab === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-text">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={() => console.log('Logout')}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Routes>
          <Route path="/" element={
            <>
              <div className="mb-4">
                <h2 className="fw-bold mb-1">Dashboard</h2>
                <p className="text-muted">Welcome back, {user.name}</p>
              </div>
              <div className="row g-3 mb-4">
                <StatCard label="Active Subscriptions" value={subscriptions.filter(s => s.status === 'APPROVED').length}/>
                <StatCard label="Pending Requests" value={subscriptions.filter(s => s.status === 'PENDING').length}/>
                <StatCard label="Available Reports" value={filteredReports.length}/>
                <StatCard label="Total Downloads" value={reports.reduce((sum, r) => sum + r.downloads, 0)}/>
              </div>
              <div className="card">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0 fw-semibold">Recent Reports</h5>
                </div>
                <div className="card-body p-0">
                  {filteredReports.length === 0 ? <EmptyState text="No reports available. Request subscriptions to access reports."/> : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr><th>Report Title</th><th>Domain</th><th>Published</th><th>Version</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {filteredReports.slice(0, 5).map(r => (
                            <tr key={r.id}>
                              <td className="fw-semibold">{r.title}</td>
                              <td><span className="badge bg-light text-dark">{r.domain}</span></td>
                              <td className="text-muted small">{r.publishedAt}</td>
                              <td><code className="small">{r.version}</code></td>
                              <td><button className="btn-download-sm"><i className="bi bi-download me-1"></i>Download</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          } />

          <Route path="/home" element={
            <>
              <div className="mb-4">
                <h2 className="fw-bold mb-1">Dashboard</h2>
                <p className="text-muted">Welcome back, {user.name}</p>
              </div>
              <div className="row g-3 mb-4">
                <StatCard label="Active Subscriptions" value={subscriptions.filter(s => s.status === 'APPROVED').length}/>
                <StatCard label="Pending Requests" value={subscriptions.filter(s => s.status === 'PENDING').length}/>
                <StatCard label="Available Reports" value={filteredReports.length}/>
                <StatCard label="Total Downloads" value={reports.reduce((sum, r) => sum + r.downloads, 0)}/>
              </div>
              <div className="card">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0 fw-semibold">Recent Reports</h5>
                </div>
                <div className="card-body p-0">
                  {filteredReports.length === 0 ? <EmptyState text="No reports available. Request subscriptions to access reports."/> : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr><th>Report Title</th><th>Domain</th><th>Published</th><th>Version</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {filteredReports.slice(0, 5).map(r => (
                            <tr key={r.id}>
                              <td className="fw-semibold">{r.title}</td>
                              <td><span className="badge bg-light text-dark">{r.domain}</span></td>
                              <td className="text-muted small">{r.publishedAt}</td>
                              <td><code className="small">{r.version}</code></td>
                              <td><button className="btn-download-sm"><i className="bi bi-download me-1"></i>Download</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          } />

          {/* <Route path="/subscriptions" element={<YourSubscriptionsComponent subscriptions={subscriptions} />} /> */}

          {/* IMPORT YOUR COMPONENTS HERE */}
          <Route path="/request" element={<SubscriptionRequestComponent subscriptions={subscriptions} />} />
          <Route path="/downloads" element={<DownloadReportComponent reports={reports} subscriptions={subscriptions} />} />
        </Routes>
      </div>
    </>
  );
};

export default SubscriberDashboard;