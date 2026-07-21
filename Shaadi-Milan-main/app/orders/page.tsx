'use client';
import { useState } from 'react';
import { usePaginatedPayments, usePaymentsSummary, useOriginalAgents } from '@/hooks/use-queries';
import { Card, CardHeader, Button, Table, Tr, Td, Skeleton, Badge, Select } from '@/components/ui';

const PLAN_PRICES: Record<string, number> = { Standard: 1999, Premium: 2999, VIP: 4999 };

// Helper to determine plan from amount
const getPlanFromAmount = (amount: number): string => {
  if (amount >= 4000) return 'VIP';
  if (amount >= 2500) return 'Premium';
  return 'Standard';
};

// Helper to generate and download PDF/HTML invoice
const downloadInvoice = (payment: any, type: 'invoice' | 'receipt') => {
  const plan = getPlanFromAmount(payment.amount);
  const date = new Date(payment.createdAt?.toDate?.() || payment.createdAt);
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const invoiceNumber = payment.orderId || payment.id;
  const title = type === 'invoice' ? 'TAX INVOICE' : 'PAYMENT RECEIPT';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #f5f5f5;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
        }
        .invoice-wrapper {
          max-width: 800px;
          width: 100%;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .invoice-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .invoice-header h1 {
          font-size: 28px;
          margin-bottom: 8px;
          letter-spacing: 2px;
        }
        .invoice-header p {
          opacity: 0.8;
          font-size: 14px;
        }
        .invoice-body {
          padding: 30px;
        }
        .company-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }
        .company-info h3 {
          color: #1a1a2e;
          margin-bottom: 8px;
        }
        .company-info p {
          color: #666;
          font-size: 12px;
          line-height: 1.5;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details p {
          font-size: 12px;
          margin: 4px 0;
          color: #666;
        }
        .invoice-details strong {
          color: #1a1a2e;
        }
        .customer-details {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .customer-details h4 {
          color: #1a1a2e;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .customer-details p {
          font-size: 13px;
          margin: 4px 0;
          color: #555;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #1a1a2e;
          border-bottom: 2px solid #dee2e6;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #dee2e6;
          font-size: 13px;
          color: #555;
        }
        .total-row {
          background: #f8f9fa;
          font-weight: bold;
        }
        .total-row td {
          font-weight: bold;
          color: #1a1a2e;
        }
        .amount-highlight {
          color: #ffc84a;
          font-weight: bold;
          font-size: 16px;
        }
        .payment-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-success {
          background: #d4edda;
          color: #155724;
        }
        .status-pending {
          background: #fff3cd;
          color: #856404;
        }
        .status-failed {
          background: #f8d7da;
          color: #721c24;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          margin-top: 20px;
          border-top: 1px solid #eee;
          font-size: 11px;
          color: #999;
        }
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .invoice-wrapper {
            box-shadow: none;
          }
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-wrapper">
        <div class="invoice-header">
          <h1>✨ ARVIKA ✨</h1>
          <p>${title}</p>
        </div>
        <div class="invoice-body">
          <div class="company-details">
            <div class="company-info">
              <h3>Arvika Matrimony</h3>
              <p>123, Business Park, Andheri East<br>
              Mumbai, Maharashtra - 400069<br>
              GST: 27AAACA1234A1Z<br>
              CIN: U12345MH2023PLC123456</p>
            </div>
            <div class="invoice-details">
              <p><strong>${type === 'invoice' ? 'Invoice No' : 'Receipt No'}:</strong> ${invoiceNumber}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Payment Method:</strong> ${payment.gateway?.toUpperCase() || 'RAZORPAY'}</p>
              <p><strong>Transaction ID:</strong> ${payment.razorpayOrderId || 'N/A'}</p>
            </div>
          </div>

          <div class="customer-details">
            <h4>Bill To:</h4>
            <p><strong>${payment.fullName}</strong></p>
            <p>${payment.email}</p>
            <p>Phone: ${payment.phone}</p>
            <p>District: ${payment.district}, ${payment.region}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Plan</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Matrimony Membership - ${plan} Plan</td>
                <td>${plan}</td>
                <td class="amount-highlight">₹${payment.amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2" style="text-align: right; font-weight: 600;">Subtotal:</td>
                <td>₹${payment.amount.toLocaleString()}</td>
               </tr>
              <tr>
                <td colspan="2" style="text-align: right; font-weight: 600;">GST (18%):</td>
                <td>₹${(payment.amount * 0.18).toLocaleString()}</td>
               </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right; font-weight: 600;">Total Amount:</td>
                <td class="amount-highlight">₹${payment.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: center; margin: 20px 0;">
            <span class="payment-status ${payment.status === 'Paid' ? 'status-success' : payment.status === 'PENDING' ? 'status-pending' : 'status-failed'}">
              ${payment.status === 'Paid' ? '✓ PAID' : payment.status === 'PENDING' ? '⏳ PENDING' : '✗ FAILED'}
            </span>
          </div>

          <div class="footer">
            <p>This is a computer-generated ${type} and does not require a physical signature.</p>
            <p>For any queries, contact support@arvika.com or call +91 98765 43210</p>
            <p>Thank you for choosing Arvika Matrimony! ❤️</p>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 500);
        }
      </script>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type.toUpperCase()}_${invoiceNumber}_${payment.fullName.replace(/\s/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper to download all orders as CSV/Excel
const downloadAllOrders = (orders: any[], filename: string = 'orders_export') => {
  const headers = [
    'Order ID', 'User Name', 'Gender', 'Plan', 'Amount (₹)', 
    'Agent ID', 'Date', 'Status', 'Email', 'Phone', 
    'District', 'Region', 'Payment Gateway', 'Transaction ID'
  ];

  const csvRows = [headers.join(',')];

  orders.forEach(order => {
    const date = new Date(order.createdAt?.toDate?.() || order.createdAt);
    const row = [
      `"${order.orderId || order.id}"`,
      `"${order.fullName || ''}"`,
      `"${order.gender || ''}"`,
      `"${getPlanFromAmount(order.amount)}"`,
      order.amount,
      `"${order.agentId || ''}"`,
      `"${date.toLocaleDateString()}"`,
      `"${order.status || ''}"`,
      `"${order.email || ''}"`,
      `"${order.phone || ''}"`,
      `"${order.district || ''}"`,
      `"${order.region || ''}"`,
      `"${order.gateway || ''}"`,
      `"${order.razorpayOrderId || ''}"`
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');
  
  // Fetch agents for dropdown
  const { data: agents = [] } = useOriginalAgents();
  
  const { data, isLoading, fetchNextPage, hasNextPage } = usePaginatedPayments({
    agentId: agentFilter === 'All' ? undefined : agentFilter,
    status: statusFilter === 'All' ? undefined : statusFilter,
    // paymentType: 'registration',
  });
  
  const { data: summaryData } = usePaymentsSummary({
    agentId: agentFilter === 'All' ? undefined : agentFilter,
  });

  // Flatten all payments from all pages
  const allPayments = data?.pages.flatMap(page => page.payments) ?? [];
  
  // Apply client-side filtering for userType (gender)
  const orders = allPayments.filter(payment => {
    if (typeFilter !== 'All' && payment.gender !== typeFilter) return false;
    return true;
  });

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: `₹${summaryData?.totalRevenue?.toLocaleString() ?? 0}`,
      color: 'text-[#ffc84a]',
      bg: 'bg-[rgba(245,166,35,0.1)]',
      icon: '💰'
    },
    {
      label: 'Successful Orders',
      value: summaryData?.paidCount ?? 0,
      color: 'text-[#00c9a7]',
      bg: 'bg-[rgba(0,201,167,0.1)]',
      icon: '✅'
    },
    {
      label: 'Pending Orders',
      value: summaryData?.pendingCount ?? 0,
      color: 'text-[#ffc84a]',
      bg: 'bg-[rgba(245,166,35,0.1)]',
      icon: '⏳'
    },
    {
      label: 'Failed Orders',
      value: summaryData?.failedCount ?? 0,
      color: 'text-[#ff8fa3]',
      bg: 'bg-[rgba(232,86,106,0.1)]',
      icon: '❌'
    },
    {
      label: 'Total Orders',
      value: summaryData?.totalOrders ?? 0,
      color: 'text-[#a78bfa]',
      bg: 'bg-[rgba(124,92,252,0.1)]',
      icon: '📦'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {summaryCards.map((s, i) => (
          <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${s.bg}`}>{s.icon}</div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{s.label}</div>
              <div className={`text-xl font-semibold font-display ${s.color}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader
          title="Order History"
          subtitle="All transactions"
          action={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Agent Filter */}
              <Select value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
                <option value="All">All Agents</option>
                {agents.map((agent) => (
                  <option key={agent.uid} value={agent.agentId}>
                    {agent.agentName} ({agent.agentId})
                  </option>
                ))}
              </Select>
              
              {/* Gender Filter */}
              <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="All">All Types</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
              
              {/* Status Filter */}
              <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="Failed">Failed</option>
              </Select>
              
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => downloadAllOrders(orders, `orders_${agentFilter}_${statusFilter}_${typeFilter}`)}
                disabled={orders.length === 0}
              >
                📥 Download All ({orders.length})
              </Button>
            </div>
          }
        />
        {isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <>
            <Table headers={['Order ID', 'User', 'Type', 'Plan', 'Amount', 'Agent', 'Date', 'Status', 'Action']}>
              {orders.map((payment, i) => (
                <Tr key={payment.id || i}>
                  <Td className="font-mono text-[10px] text-[var(--text-dim)]">{payment.orderId || payment.id}</Td>
                  <Td className="font-medium text-[var(--text)] text-xs">{payment.fullName}</Td>
                  <Td><Badge variant={payment.gender === 'male' ? 'male' : 'female'}>{payment.gender}</Badge></Td>
                  <Td>
                    <Badge variant={
                      getPlanFromAmount(payment.amount) === 'VIP' ? 'warning' : 
                      getPlanFromAmount(payment.amount) === 'Premium' ? 'info' : 'neutral'
                    }>
                      {getPlanFromAmount(payment.amount)}
                    </Badge>
                  </Td>
                  <Td className="font-semibold text-[#ffc84a]">₹{payment.amount.toLocaleString()}</Td>
                  <Td className="font-mono text-[10px] text-[var(--text-dim)]">{payment.agentId}</Td>
                  <Td>{new Date(payment.createdAt?.toDate?.() || payment.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <Badge variant={
                      payment.status === 'Paid' ? 'success' : 
                      payment.status === 'PENDING' ? 'warning' : 'danger'
                    }>
                      {payment.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <button 
                        className="px-2 py-1 text-[10px] rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[#00c9a7] hover:border-[rgba(0,201,167,0.4)] transition-colors"
                        onClick={() => downloadInvoice(payment, 'receipt')}
                      >
                        🧾 Receipt
                      </button>
                      {payment.status === 'Paid' && (
                        <>
                          <button 
                            className="px-2 py-1 text-[10px] rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[#ffc84a] hover:border-[rgba(255,200,74,0.4)] transition-colors"
                            onClick={() => downloadInvoice(payment, 'invoice')}
                          >
                            📄 Invoice
                          </button>
                          <button className="px-2 py-1 text-[10px] rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[#ff8fa3] hover:border-[rgba(232,86,106,0.4)] transition-colors">
                            ↩️ Refund
                          </button>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
            
            {/* Load more button for pagination */}
            {hasNextPage && (
              <div className="p-4 text-center">
                <Button variant="primary" onClick={() => fetchNextPage()}>
                  Load More
                </Button>
              </div>
            )}
            
            {/* Empty state */}
            {orders.length === 0 && (
              <div className="p-8 text-center text-[var(--text-muted)]">
                No orders found for the selected filters.
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}