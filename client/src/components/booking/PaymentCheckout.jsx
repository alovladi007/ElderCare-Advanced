import React, { useState } from 'react';
import { CreditCard, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, Button, Alert, Input } from '..';
import bookingService from '../../services/booking.service';

const PaymentCheckout = ({ bookingData, onBack, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [, setPaymentIntent] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const amount = bookingData?.service?.price || 0;
  const taxRate = 0.1; // 10% tax
  const tax = amount * taxRate;
  const total = amount + tax;

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number (add spaces every 4 digits)
    if (name === 'cardNumber') {
      formattedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim()
        .slice(0, 19);
    }

    // Format expiry date (MM/YY)
    if (name === 'expiryDate') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .slice(0, 5);
    }

    // Format CVV (3-4 digits)
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardDetails((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    try {
      setProcessing(true);
      setError(null);

      // Step 1: Create booking
      const booking = await bookingService.createBooking({
        ...bookingData,
        status: 'PENDING',
      });

      // Step 2: Create payment intent
      const intent = await bookingService.createPaymentIntent({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        bookingId: booking.id,
        metadata: {
          serviceName: bookingData.service.name,
          customerName: bookingData.fullName,
          customerEmail: bookingData.email,
        },
      });

      setPaymentIntent(intent);

      // Simulate Stripe payment processing
      // In production, use Stripe Elements or Stripe.js here
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Payment successful
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <Card padding="lg" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Payment Successful!</h2>
          <p className="text-gray-300 mb-2">
            Your booking has been confirmed.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            A confirmation email has been sent to {bookingData.email}
          </p>
          <Button variant="primary" onClick={onSuccess}>
            View My Bookings
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Order Summary</h2>
          <Button variant="ghost" icon={ArrowLeft} onClick={onBack} className="bg-white/5">
            Back
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-gray-300">
            <span>{bookingData?.service?.name}</span>
            <span className="font-semibold">${amount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-gray-400 text-sm">
            <span>Date:</span>
            <span>{new Date(bookingData?.preferredDate).toLocaleDateString()}</span>
          </div>

          <div className="flex justify-between text-gray-400 text-sm">
            <span>Time:</span>
            <span>{bookingData?.preferredTime}</span>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal:</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Tax (10%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-white/10">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Form */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="w-6 h-6 text-white" />
          <h3 className="text-xl font-bold text-white">Payment Information</h3>
        </div>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handlePayment} className="space-y-6">
          <Input
            label="Cardholder Name"
            name="cardName"
            value={cardDetails.cardName}
            onChange={handleCardChange}
            placeholder="John Doe"
            required
            inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
          />

          <Input
            label="Card Number"
            name="cardNumber"
            value={cardDetails.cardNumber}
            onChange={handleCardChange}
            placeholder="1234 5678 9012 3456"
            icon={CreditCard}
            required
            inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry Date"
              name="expiryDate"
              value={cardDetails.expiryDate}
              onChange={handleCardChange}
              placeholder="MM/YY"
              required
              inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
            />

            <Input
              label="CVV"
              name="cvv"
              value={cardDetails.cvv}
              onChange={handleCardChange}
              placeholder="123"
              type="password"
              required
              inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
            />
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-200 text-sm font-semibold mb-1">
                Secure Payment
              </p>
              <p className="text-blue-300 text-xs">
                Your payment information is encrypted and secure. We never store your
                full card details.
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={processing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={processing}
              disabled={processing}
              size="lg"
              className="flex-1"
            >
              {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
            </Button>
          </div>
        </form>
      </Card>

      {/* Test Card Info */}
      <Alert type="info">
        <p className="text-sm">
          <strong>Test Mode:</strong> Use card number <code>4242 4242 4242 4242</code> with
          any future expiry date and any 3-digit CVV for testing.
        </p>
      </Alert>
    </div>
  );
};

export default PaymentCheckout;
