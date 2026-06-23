import React, { useState } from 'react';
import type { Property, PropertyType } from '../../lib/propertyApi';
import './Property.css';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'co-living', label: 'Co-Living' },
  { value: 'independent_house', label: 'Independent House' }
];

interface PropertyFormProps {
  initialValues?: Partial<Property>;
  onSubmit: (data: Partial<Property>) => void;
  submitting?: boolean;
  mode?: 'create' | 'edit';
}

const defaultValues: Partial<Property> = {
  name: '',
  description: '',
  type: 'apartment',
  yearBuilt: undefined,
  status: 'active',
  address: { street: '', city: '', state: '', zip: '', country: 'India' }
};

const PropertyForm: React.FC<PropertyFormProps> = ({
  initialValues,
  onSubmit,
  submitting = false,
  mode = 'create'
}) => {
  const [form, setForm] = useState<Partial<Property>>({
    ...defaultValues,
    ...initialValues,
    address: { ...defaultValues.address, ...initialValues?.address } as Property['address']
  });
  const [error, setError] = useState('');

  const set = (key: string, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const setAddress = (key: string, value: string) =>
    setForm(prev => ({
      ...prev,
      address: { ...prev.address!, [key]: value }
    }));

  const validate = (): boolean => {
    if (!form.name?.trim()) { setError('Property name is required'); return false; }
    if (!form.address?.street?.trim()) { setError('Street address is required'); return false; }
    if (!form.address?.city?.trim()) { setError('City is required'); return false; }
    if (!form.address?.state?.trim()) { setError('State is required'); return false; }
    if (!form.address?.zip?.trim()) { setError('PIN/ZIP code is required'); return false; }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="property-form" noValidate>
      {error && <div className="prop-form-error">⚠️ {error}</div>}

      {/* ── Basic Info ──────────────────────────────────────────────────────── */}
      <section className="prop-form-section">
        <h4>Basic Information</h4>
        <div className="prop-form-grid">
          <div className="form-group form-group--full">
            <label className="form-label">Property Name *</label>
            <input
              type="text"
              className="form-input"
              value={form.name ?? ''}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Sunrise Apartments"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Property Type *</label>
            <select
              className="form-input"
              value={form.type ?? 'apartment'}
              onChange={e => set('type', e.target.value)}
              disabled={submitting}
            >
              {PROPERTY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={form.status ?? 'active'}
              onChange={e => set('status', e.target.value)}
              disabled={submitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="under_maintenance">Under Maintenance</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Year Built</label>
            <input
              type="number"
              className="form-input"
              value={form.yearBuilt ?? ''}
              onChange={e => set('yearBuilt', e.target.value ? Number(e.target.value) : null)}
              placeholder="e.g. 2018"
              min={1900}
              max={new Date().getFullYear()}
              disabled={submitting}
            />
          </div>

          <div className="form-group form-group--full">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description of the property..."
              rows={3}
              disabled={submitting}
            />
          </div>
        </div>
      </section>

      {/* ── Address ─────────────────────────────────────────────────────────── */}
      <section className="prop-form-section">
        <h4>Address</h4>
        <div className="prop-form-grid">
          <div className="form-group form-group--full">
            <label className="form-label">Street Address *</label>
            <input
              type="text"
              className="form-input"
              value={form.address?.street ?? ''}
              onChange={e => setAddress('street', e.target.value)}
              placeholder="e.g. 42 MG Road"
              disabled={submitting}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">City *</label>
            <input
              type="text"
              className="form-input"
              value={form.address?.city ?? ''}
              onChange={e => setAddress('city', e.target.value)}
              placeholder="Bengaluru"
              disabled={submitting}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">State *</label>
            <input
              type="text"
              className="form-input"
              value={form.address?.state ?? ''}
              onChange={e => setAddress('state', e.target.value)}
              placeholder="Karnataka"
              disabled={submitting}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">PIN / ZIP *</label>
            <input
              type="text"
              className="form-input"
              value={form.address?.zip ?? ''}
              onChange={e => setAddress('zip', e.target.value)}
              placeholder="560001"
              disabled={submitting}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              type="text"
              className="form-input"
              value={form.address?.country ?? 'India'}
              onChange={e => setAddress('country', e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>
      </section>

      {/* ── Submit ──────────────────────────────────────────────────────────── */}
      <div className="prop-form-footer">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? (
            <><span className="btn-spinner" />Saving...</>
          ) : (
            mode === 'create' ? 'Create Property' : 'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;
