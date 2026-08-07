import React, { useState, useEffect } from 'react';
import { useGetSaaSSubscriptionQuery, useStartSaaSTrialMutation, useGetSaaSPlansQuery, useCreateSaaSPaymentMutation, useVerifySaaSPaymentMutation } from '../store/api';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { Button } from './ui/Button';

interface SaaSBillingGuardProps {
  children: React.ReactNode;
}

export default function SaaSBillingGuard({ children }: SaaSBillingGuardProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Only apply guard if user is associated with a workspace (not SUPER_ADMIN on their own dashboard)
  // Super Admin managing all workspaces doesn't need a guard on the super admin dashboard.
  // But if Super Admin visits a tenant dashboard, they bypass it anyway? Let's just bypass for SUPER_ADMIN role.
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  const { 
    data: subscription, 
    isLoading: isSubLoading,
    error: subError
  } = useGetSaaSSubscriptionQuery(user?.workspaceId || '', {
    skip: !user?.workspaceId || isSuperAdmin,
  });

  const { data: plans = [] } = useGetSaaSPlansQuery({}, {
    skip: !user?.workspaceId || isSuperAdmin,
  });

  const [startTrial, { isLoading: isStartingTrial }] = useStartSaaSTrialMutation();
  const [createPayment, { isLoading: isCreatingPayment }] = useCreateSaaSPaymentMutation();
  const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifySaaSPaymentMutation();

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  
  // Helper to load Razorpay script
  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (isSuperAdmin || isSubLoading) return;

    if (!subscription && !subError) {
      // No subscription found at all -> Brand new signup
      setShowWelcomeModal(true);
    } else if (subscription?.status === 'EXPIRED') {
      // Trial or Subscription expired
      setShowExpiredModal(true);
    } else {
      setShowWelcomeModal(false);
      setShowExpiredModal(false);
    }
  }, [subscription, isSubLoading, isSuperAdmin, subError]);

  const handleStartTrial = async () => {
    if (!user?.workspaceId) return;
    try {
      await startTrial({ workspaceId: user.workspaceId, days: 7 }).unwrap();
      setShowWelcomeModal(false);
    } catch (error) {
      console.error('Failed to start trial', error);
      alert('Could not start free trial. Please contact support.');
    }
  };

  const handlePayNow = async (plan: any) => {
    if (!user?.workspaceId || !plan) {
      alert("Please select a valid plan.");
      return;
    }

    const res = await loadRazorpay();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }

    try {
      const orderData = await createPayment({
        workspaceId: user.workspaceId,
        saasPlanId: plan.id,
      }).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T9hh97PsK4bGuG',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'StudyFlow',
        description: `SaaS Subscription: ${orderData.planName}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            await verifyPayment({
              workspaceId: user?.workspaceId || '',
              paymentData: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                saasPlanId: plan.id
              }
            }).unwrap();
            
            // On success, hide modals
            setShowWelcomeModal(false);
            setShowExpiredModal(false);
          } catch (err) {
            console.error('Verification failed', err);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#0ea5e9'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Error creating payment:', err);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  if (isSuperAdmin) {
    return <>{children}</>;
  }

  if (isSubLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Workspace Data...</div>;
  }

  // If there's no subscription OR it's expired, we MUST show a full screen takeover to prevent access.
  const isLocked = showWelcomeModal || showExpiredModal;

  return (
    <>
      {/* If locked, we blur the children to tease the dashboard but prevent interaction */}
      <div style={{ filter: isLocked ? 'blur(8px)' : 'none', pointerEvents: isLocked ? 'none' : 'auto', height: '100%' }}>
        {children}
      </div>

      {showWelcomeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
          <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>Welcome to StudyFlow!</h2>
            <p style={{ color: '#475569', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: 1.5 }}>
              Ready to supercharge your library management? You can start with a 7-day completely free trial, no credit card required.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button variant="primary" onClick={handleStartTrial} disabled={isStartingTrial || isCreatingPayment} style={{ padding: '1rem', fontSize: '1.1rem' }}>
                {isStartingTrial ? 'Starting Trial...' : 'Start 7-Day Free Trial'}
              </Button>
              {plans.length > 0 && (
                <Button variant="outline" disabled={isStartingTrial || isCreatingPayment} onClick={() => handlePayNow(plans[0])} style={{ padding: '1rem', fontSize: '1.1rem', color: '#0ea5e9', borderColor: '#0ea5e9' }}>
                  {isCreatingPayment ? 'Loading...' : `Pay & Get 7 Days Free (Cancel Anytime)`}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {showExpiredModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.9)' }}>
          <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', maxWidth: '900px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#ef4444' }}>Your Trial Has Expired</h2>
            <p style={{ color: '#475569', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
              We hope you loved using StudyFlow! Please purchase a plan to continue accessing your library data and managing your students.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
              {plans.map((plan: any) => (
                <div key={plan.id} style={{ border: '2px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>{plan.name}</h3>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0ea5e9', marginBottom: '1rem' }}>₹{plan.price}<span style={{fontSize:'1rem', color:'#64748b'}}>/mo</span></div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', flexGrow: 1 }}>
                    {plan.features?.map((f: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>✓ {f}</li>
                    ))}
                  </ul>
                  <Button variant="primary" fullWidth disabled={isCreatingPayment} onClick={() => handlePayNow(plan)}>
                    {isCreatingPayment ? 'Loading...' : 'Choose Plan'}
                  </Button>
                </div>
              ))}
            </div>
            
            {plans.length === 0 && (
              <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '8px' }}>
                No plans available at the moment. Please contact support.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
