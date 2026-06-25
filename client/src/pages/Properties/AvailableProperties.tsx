import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { propertyApi } from '../../lib/propertyApi';
import type { Property } from '../../lib/propertyApi';
import { useToast } from '../../contexts/ToastContext';
import PropertyCard from '../../components/Property/PropertyCard';
import Modal from '../../components/Admin/Modal';
import './Properties.css';

const AvailableProperties: React.FC = () => {
  const { showToast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['available-properties'],
    queryFn: () => propertyApi.list({ status: 'active', limit: 50 })
  });

  const applyMutation = useMutation({
    mutationFn: (payload: { propertyId: string; unitId?: string; unitNumber?: string; message: string }) =>
      propertyApi.applyForProperty(payload.propertyId, payload),
    onSuccess: () => {
      showToast('Booking request sent to owner!', 'success');
      setSelectedProperty(null);
      setMessage('');
      setSelectedUnit('');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Failed to submit application', 'error');
    }
  });

  const properties = data?.properties || [];
  
  // Filter only properties with vacant units
  const availableProperties = properties.filter(p => p.units.some(u => u.status === 'vacant'));

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    let unitInfo = {};
    if (selectedUnit) {
      const unit = selectedProperty.units.find(u => u._id === selectedUnit);
      if (unit) {
        unitInfo = { unitId: unit._id, unitNumber: unit.unitNumber };
      }
    }

    applyMutation.mutate({
      propertyId: selectedProperty._id,
      message,
      ...unitInfo
    });
  };

  return (
    <div className="properties-page">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">🏠 Available Properties</h1>
            <p className="page-subtitle">Browse and request to book your next home.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-spinner" style={{ margin: '3rem auto' }} />
        ) : availableProperties.length === 0 ? (
          <div className="empty-state">
            <h3>No properties available</h3>
            <p>Check back later for new listings.</p>
          </div>
        ) : (
          <div className="properties-grid">
            {availableProperties.map(property => (
              <PropertyCard
                key={property._id}
                property={property}
                onClick={() => setSelectedProperty(property)}
              />
            ))}
          </div>
        )}

        <Modal
          isOpen={Boolean(selectedProperty)}
          onClose={() => setSelectedProperty(null)}
          title={`Book ${selectedProperty?.name}`}
        >
          {selectedProperty && (
            <form onSubmit={handleApply} className="property-form">
              <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                Send a request to the property owner. They will review your application and confirm the booking.
              </p>

              <div className="form-group">
                <label>Select Unit</label>
                <select 
                  value={selectedUnit} 
                  onChange={e => setSelectedUnit(e.target.value)}
                  required
                >
                  <option value="">-- Choose a vacant unit --</option>
                  {selectedProperty.units.filter(u => u.status === 'vacant').map(unit => (
                    <option key={unit._id} value={unit._id}>
                      Unit {unit.unitNumber} ({unit.bedrooms}BHK - ₹{unit.monthlyRent}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Message to Owner (Optional)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Hello, I am interested in renting this property..."
                  rows={4}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedProperty(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={applyMutation.isPending}>
                  {applyMutation.isPending ? 'Sending...' : 'Send Booking Request'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default AvailableProperties;
