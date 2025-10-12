import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DownloadReportComponent from './DownloadReportComponent';
import SubscriptionRequestComponent from './SubscriptionRequestComponent';

const SubscriberDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
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

  const NavItem = ({ icon, label, path }) => (
    <a 
      className={`nav-link d-flex align-items-center gap-2 px-3 py-2 ${activeTab === path ? 'active' : ''}`} 
      href="#" 
      onClick={(e) => { e.preventDefault(); navigate(`/dashboard/${path}`); }}
    >
      <i className={`bi bi-${icon}`}></i><span>{label}</span>
    </a>
  );

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
      <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet"/>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/bootstrap-icons.min.css" rel="stylesheet"/>
      
      <style>{`
        body{background:#e8f0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
        .sidebar{min-height:100vh;background:#fff;box-shadow:2px 0 10px rgba(0,0,0,.05);border-right:1px solid #e1e8ed}
        .nav-link{color:#4a5568;border-left:3px solid transparent;transition:.2s}
        .nav-link:hover{background:#f7fafc;color:#059669}
        .nav-link.active{background:linear-gradient(to right,#d1fae5 0%,transparent);color:#059669;border-left-color:#10b981;font-weight:600}
        .logo-gradient{background:linear-gradient(135deg,#10b981 0%,#059669 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .user-role-badge{background:#d1fae5;color:#059669}
        .btn-gradient{background:linear-gradient(135deg,#10b981 0%,#059669 100%);border:none;color:#fff}
        .btn-gradient:hover{background:linear-gradient(135deg,#059669 0%,#047857 100%);transform:translateY(-1px);box-shadow:0 4px 12px rgba(16,185,129,.3);color:#fff}
        .stat-value{color:#10b981 !important}
        .domain-card{transition:.3s;border:1px solid #e5e7eb;height:100%;background:#fff}
        .domain-card:hover{border-color:#10b981;box-shadow:0 4px 12px rgba(16,185,129,.15);transform:translateY(-2px)}
        .card{border:0;box-shadow:0 2px 8px rgba(0,0,0,.06);background:#fff}
        .stat-card{background:#fff;border:0;box-shadow:0 2px 8px rgba(0,0,0,.06)}
        .text-primary{color:#059669 !important}
        .btn-outline-primary{color:#059669;border-color:#10b981}
        .btn-outline-primary:hover{background:#d1fae5;color:#059669;border-color:#10b981}
        .page-title{color:#1f2937}
        .page-subtitle{color:#6b7280}
        .table-light{background:#f9fafb}
      `}</style>

      <div className="container-fluid">
        <div className="row">
          <div className="col-md-3 col-lg-2 px-0 sidebar">
            <div className="p-4 border-bottom">
              <h4 className="mb-0 fw-bold logo-gradient">RW Tool</h4>
            </div>
            <div className="p-3 border-bottom">
              <div className="fw-semibold mb-1">{user.name}</div>
              <div className="text-muted small">{user.email}</div>
              <span className="badge user-role-badge mt-2">{user.role}</span>
            </div>
            <nav className="nav flex-column py-3">
              <NavItem icon="house-door" label="Dashboard" path="home"/>
              <NavItem icon="check-circle" label="My Subscriptions" path="subscriptions"/>
              <NavItem icon="file-earmark-text" label="Request Subscription" path="request"/>
              <NavItem icon="download" label="Download Reports" path="downloads"/>
            </nav>
            <div className="p-3 border-top mt-auto">
              <button className="btn btn-outline-danger w-100" onClick={() => console.log('Logout')}>
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </button>
            </div>
          </div>

          <div className="col-md-9 col-lg-10 p-4">
            <Routes>
              <Route path="/" element={<navigate to="home" replace />} />
              
              {/* Home Dashboard */}
              <Route path="home" element={
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
                                  <td><button className="btn btn-sm btn-gradient"><i className="bi bi-download me-1"></i>Download</button></td>
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

              {/* <Route path="request" element={<ViewSubscription subscriptions={subscriptions} />} /> */}
              
              {/* Request Subscription - Using separate component */}
              <Route path="request" element={<SubscriptionRequestComponent subscriptions={subscriptions} />} />

              {/* Download Reports - Using separate component */}
              <Route path="downloads" element={<DownloadReportComponent reports={reports} subscriptions={subscriptions} />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriberDashboard;