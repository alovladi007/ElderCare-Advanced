import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, FileText, Download, Eye, X } from 'lucide-react';
import { Card, Badge, Button, Loading, Alert, Modal } from '..';
import bookingService from '../../services/booking.service';

const PaymentHistory = ({ viewMode = 'bookings' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      let result;

      switch (viewMode) {
        case 'bookings':
          result = await bookingService.getBookings();
          break;
        case 'payments':
          result = await bookingService.getPaymentHistory();
          break;
        case 'invoices':
          result = await bookingService.getPaymentHistory({ hasInvoice: true });
          break;
        default:
          result = [];
      }

      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || `Failed to load ${viewMode}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: { variant: 'warning', text: 'Pending' },
      CONFIRMED: { variant: 'success', text: 'Confirmed' },
      COMPLETED: { variant: 'info', text: 'Completed' },
      CANCELLED: { variant: 'danger', text: 'Cancelled' },
      PAID: { variant: 'success', text: 'Paid' },
      FAILED: { variant: 'danger', text: 'Failed' },
      REFUNDED: { variant: 'default', text: 'Refunded' },
    };
    return variants[status] || { variant: 'default', text: status };
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const blob = await bookingService.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`Failed to download invoice: ${err.message}`);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingService.cancelBooking(bookingId);
      await loadData();
    } catch (err) {
      setError(`Failed to cancel booking: ${err.message}`);
    }
  };

  if (loading) {
    return <Loading variant="spinner" size="lg" text={`Loading ${viewMode}...`} />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <h2 className="text-xl font-bold text-white mb-1">
          {viewMode === 'bookings' && 'My Bookings'}
          {viewMode === 'payments' && 'Payment History'}
          {viewMode === 'invoices' && 'Invoices'}
        </h2>
        <p className="text-gray-400 text-sm">
          {viewMode === 'bookings' && 'View and manage your service bookings'}
          {viewMode === 'payments' && 'Track all your payment transactions'}
          {viewMode === 'invoices' && 'Download and view your invoices'}
        </p>
      </Card>

      {/* Stats */}
      {viewMode === 'bookings' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="sm" className="bg-white/10 backdrop-blur-md border-white/20">
            <p className="text-gray-300 text-sm">Total Bookings</p>
            <p className="text-2xl font-bold text-white">{data.length}</p>
          </Card>
          <Card padding="sm" className="bg-green-500/20 border-green-500/50">
            <p className="text-green-200 text-sm">Confirmed</p>
            <p className="text-2xl font-bold text-white">
              {data.filter((b) => b.status === 'CONFIRMED').length}
            </p>
          </Card>
          <Card padding="sm" className="bg-yellow-500/20 border-yellow-500/50">
            <p className="text-yellow-200 text-sm">Pending</p>
            <p className="text-2xl font-bold text-white">
              {data.filter((b) => b.status === 'PENDING').length}
            </p>
          </Card>
          <Card padding="sm" className="bg-blue-500/20 border-blue-500/50">
            <p className="text-blue-200 text-sm">Completed</p>
            <p className="text-2xl font-bold text-white">
              {data.filter((b) => b.status === 'COMPLETED').length}
            </p>
          </Card>
        </div>
      )}

      {/* Data List */}
      {data.length === 0 ? (
        <Card padding="lg" className="bg-white/10 backdrop-blur-md border-white/20">
          <div className="text-center py-12">
            {viewMode === 'bookings' && <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />}
            {viewMode === 'payments' && <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />}
            {viewMode === 'invoices' && <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />}
            <h3 className="text-xl font-semibold text-white mb-2">
              No {viewMode} yet
            </h3>
            <p className="text-gray-400">
              {viewMode === 'bookings' && 'You haven\'t made any bookings yet'}
              {viewMode === 'payments' && 'No payment history available'}
              {viewMode === 'invoices' && 'No invoices generated yet'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const statusBadge = getStatusBadge(item.status);

            return (
              <Card
                key={item.id}
                padding="normal"
                className="bg-white/10 backdrop-blur-md border-white/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Booking View */}
                    {viewMode === 'bookings' && (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">
                            {item.service?.name || item.serviceType}
                          </h3>
                          <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-300">
                            <span className="text-gray-500">Customer:</span> {item.fullName}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-500">Date:</span>{' '}
                            {new Date(item.preferredDate).toLocaleDateString()} •{' '}
                            {item.preferredTime}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-500">Contact:</span> {item.email} • {item.phone}
                          </p>
                          {item.address && (
                            <p className="text-gray-400 text-xs">
                              <span className="text-gray-500">Address:</span> {item.address}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Payment View */}
                    {viewMode === 'payments' && (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">
                            ${((item.amount || 0) / 100).toFixed(2)}
                          </h3>
                          <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-300">
                            <span className="text-gray-500">Transaction ID:</span> {item.id}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-500">Date:</span>{' '}
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                          {item.metadata?.serviceName && (
                            <p className="text-gray-300">
                              <span className="text-gray-500">Service:</span>{' '}
                              {item.metadata.serviceName}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Invoice View */}
                    {viewMode === 'invoices' && (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">
                            Invoice #{item.invoiceNumber || item.id.slice(0, 8)}
                          </h3>
                          <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-300">
                            <span className="text-gray-500">Amount:</span> $
                            {((item.amount || 0) / 100).toFixed(2)}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-500">Date:</span>{' '}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-500">Service:</span>{' '}
                            {item.metadata?.serviceName || 'N/A'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleViewDetails(item)}
                      className="bg-white/5 text-white hover:bg-white/10"
                      title="View details"
                    />

                    {viewMode === 'invoices' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Download}
                        onClick={() => handleDownloadInvoice(item.id)}
                        className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                        title="Download invoice"
                      />
                    )}

                    {viewMode === 'bookings' && item.status === 'PENDING' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={X}
                        onClick={() => handleCancelBooking(item.id)}
                        className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        title="Cancel booking"
                      />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">ID</p>
                <p className="text-white font-mono text-sm">{selectedItem.id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <Badge variant={getStatusBadge(selectedItem.status).variant}>
                  {getStatusBadge(selectedItem.status).text}
                </Badge>
              </div>
            </div>

            {viewMode === 'bookings' && (
              <>
                <div>
                  <p className="text-gray-400 text-sm">Service</p>
                  <p className="text-white">{selectedItem.service?.name || selectedItem.serviceType}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Customer</p>
                  <p className="text-white">{selectedItem.fullName}</p>
                  <p className="text-gray-400 text-sm">{selectedItem.email} • {selectedItem.phone}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Schedule</p>
                  <p className="text-white">
                    {new Date(selectedItem.preferredDate).toLocaleDateString()} • {selectedItem.preferredTime}
                  </p>
                </div>
                {selectedItem.address && (
                  <div>
                    <p className="text-gray-400 text-sm">Address</p>
                    <p className="text-white">{selectedItem.address}</p>
                  </div>
                )}
                {selectedItem.specialNeeds && (
                  <div>
                    <p className="text-gray-400 text-sm">Special Needs</p>
                    <p className="text-white">{selectedItem.specialNeeds}</p>
                  </div>
                )}
              </>
            )}

            <div>
              <p className="text-gray-400 text-sm">Created</p>
              <p className="text-white">{new Date(selectedItem.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentHistory;
