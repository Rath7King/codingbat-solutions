import React, { useState } from 'react';

const SubscriptionRequestComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [reports, setReports] = useState([
    { id: 1, fileName: 'Q4_2024_Equities_Market_Analysis.pdf', title: 'Q4 2024 Equities Market Analysis', description: 'Comprehensive quarterly equity market analysis with sector breakdowns', category: 'Equities', size: '2.4 MB', publishedDate: '15 Dec 2024', status: null },
    { id: 2, fileName: 'FX_Trading_Weekly_Summary.xlsx', title: 'FX Trading Weekly Summary', description: 'Foreign exchange trading summary with currency pair analysis', category: 'FX', size: '856 KB', publishedDate: '18 Dec 2024', status: null },
    { id: 3, fileName: 'Commodities_Outlook_2025.pdf', title: 'Commodities Outlook 2025', description: 'Annual commodities forecast covering energy, metals, and agriculture', category: 'Commodities', size: '3.1 MB', publishedDate: '10 Dec 2024', status: null },
    { id: 4, fileName: 'Global_Equities_Performance.pdf', title: 'Global Equities Performance Review', description: 'Year-end review of global equity markets and portfolio strategies', category: 'Equities', size: '1.8 MB', publishedDate: '20 Dec 2024', status: 'approved' },
    { id: 5, fileName: 'FX_Volatility_Index.csv', title: 'FX Volatility Index Analysis', description: 'Statistical analysis of currency volatility patterns', category: 'FX', size: '645 KB', publishedDate: '22 Dec 2024', status: 'requested' }
  ]);

  const filteredReports = reports.filter(r => {
    const match = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.category.toLowerCase().includes(searchQuery.toLowerCase());
    return (filterStatus === 'all' || r.status === filterStatus) && match;
  });

  const handleRequest = (id) => setReports(reports.map(r => r.id === id && !r.status ? { ...r, status: 'requested' } : r));
  const handleCancel = (id) => setReports(reports.map(r => r.id === id && r.status === 'requested' ? { ...r, status: null } : r));
  const getCount = (status) => reports.filter(r => r.status === status).length;
  const categoryColors = { 'Equities': 'primary', 'FX': 'success', 'Commodities': 'info' };

  return (
    <>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet"/>
      
      <style>{`
        body{background:linear-gradient(135deg,#f8fafb,#e8f4f8 50%,#f0f9f4)}
        .stat-number{background:linear-gradient(135deg,#0891b2,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .btn-gradient{background:linear-gradient(135deg,#0891b2,#10b981);border:none;color:#fff;box-shadow:0 4px 12px rgba(8,145,178,.3)}
        .btn-gradient:hover{background:linear-gradient(135deg,#0e7490,#059669);color:#fff;box-shadow:0 6px 16px rgba(8,145,178,.4)}
        .filter-btn{transition:.2s}
        .filter-btn.active{background:linear-gradient(135deg,#0891b2,#10b981)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 2px 8px rgba(8,145,178,.3)!important}
        .report-card{transition:.3s;border:2px solid rgba(8,145,178,.15)!important}
        .report-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(8,145,178,.15)!important;border-color:rgba(8,145,178,.4)!important}
        .report-card.requested{background:linear-gradient(135deg,#fff9f0,#fff)!important;border-color:rgba(255,165,0,.4)!important}
        .report-card.approved{background:linear-gradient(135deg,#f0fdf7,#fff)!important;border-color:rgba(16,185,129,.4)!important}
      `}</style>

      <div className="container-fluid py-5" style={{background:'linear-gradient(135deg,#f8fafb,#e8f4f8 50%,#f0f9f4)',minHeight:'100vh'}}>
        <div className="container" style={{maxWidth:'1200px'}}>
          {/* Hero */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold text-dark mb-2">Report Subscription Center</h1>
            <p className="text-secondary mb-4">Browse and request access to premium financial reports across Equities, FX, and Commodities</p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <div className="bg-white rounded-3 shadow-sm p-3 text-center border border-2 border-primary border-opacity-10" style={{minWidth:'140px'}}>
                <div className="display-6 fw-bold stat-number">{reports.length}</div>
                <small className="text-secondary">Total Reports</small>
              </div>
              <div className="bg-white rounded-3 shadow-sm p-3 text-center border border-2 border-primary border-opacity-10" style={{minWidth:'140px'}}>
                <div className="display-6 fw-bold stat-number">{getCount('requested')}</div>
                <small className="text-secondary">Requested</small>
              </div>
              <div className="bg-white rounded-3 shadow-sm p-3 text-center border border-2 border-primary border-opacity-10" style={{minWidth:'140px'}}>
                <div className="display-6 fw-bold stat-number">{getCount('approved')}</div>
                <small className="text-secondary">Approved</small>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4" style={{background:'linear-gradient(135deg,#f8fbff,#f5fdf7)'}}>
              <div className="d-flex justify-content-center gap-2 mb-3 flex-wrap">
                <button className={`btn btn-outline-secondary filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
                  All Reports <span className="badge bg-secondary bg-opacity-25 text-dark ms-2">{reports.length}</span>
                </button>
                <button className={`btn btn-outline-secondary filter-btn ${filterStatus === 'requested' ? 'active' : ''}`} onClick={() => setFilterStatus('requested')}>
                  Requested <span className="badge bg-secondary bg-opacity-25 text-dark ms-2">{getCount('requested')}</span>
                </button>
                <button className={`btn btn-outline-secondary filter-btn ${filterStatus === 'approved' ? 'active' : ''}`} onClick={() => setFilterStatus('approved')}>
                  Approved <span className="badge bg-secondary bg-opacity-25 text-dark ms-2">{getCount('approved')}</span>
                </button>
              </div>
              <input type="text" className="form-control form-control-lg border-2" placeholder="Search by file name, title, or category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{maxWidth:'700px',margin:'0 auto'}} />
            </div>
          </div>

          {/* Reports */}
          <div className="mb-4">
            <h5 className="fw-bold text-dark mb-1">Available Reports</h5>
            <p className="text-secondary small">Click Request Access to submit your subscription request for admin approval</p>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-5"><p className="text-secondary fs-5">No reports found matching your search</p></div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredReports.map(r => (
                <div key={r.id} className={`card border-0 shadow-sm report-card ${r.status || ''}`}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="flex-grow-1">
                        <h5 className="fw-bold text-dark mb-2">{r.title}</h5>
                        <code className="small bg-light text-primary p-2 rounded border">{r.fileName}</code>
                      </div>
                      <span className={`badge bg-${categoryColors[r.category]} ms-3`}>{r.category}</span>
                    </div>
                    <p className="text-secondary mb-3">{r.description}</p>
                    <div className="d-flex gap-3 mb-3 pb-3 border-top pt-3 flex-wrap">
                      <small className="text-secondary fw-semibold"><span className="text-muted">Published:</span> {r.publishedDate}</small>
                      <small className="text-secondary fw-semibold"><span className="text-muted">Size:</span> {r.size}</small>
                      <small className="text-secondary fw-semibold"><span className="text-muted">Category:</span> {r.category}</small>
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      {r.status === 'approved' ? (
                        <button className="btn btn-success" disabled>Approved</button>
                      ) : r.status === 'requested' ? (
                        <>
                          <button className="btn btn-warning text-dark" disabled>Pending Approval</button>
                          <button className="btn btn-outline-danger" onClick={() => handleCancel(r.id)}>Cancel Request</button>
                        </>
                      ) : (
                        <button className="btn btn-gradient shadow-sm" onClick={() => handleRequest(r.id)}>Request Access</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubscriptionRequestComponent;