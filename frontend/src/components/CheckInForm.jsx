import React, { useState, useEffect } from 'react';

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.round(diff));
}

export default function CheckInForm({ villas, onSubmit, onCancel, submitting }) {
  const [villaId, setVillaId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [name, setName] = useState('');
  const [numberOfNights, setNumberOfNights] = useState('');
  const [bookingPlatform, setBookingPlatform] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (checkIn && checkOut) {
      const nights = daysBetween(checkIn, checkOut);
      setNumberOfNights(String(nights));
    }
  }, [checkIn, checkOut]);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!villaId.trim()) {
      setError('Please select a villa');
      return;
    }
    if (!checkIn.trim()) {
      setError('Check-in date is required');
      return;
    }
    if (!checkOut.trim()) {
      setError('Check-out date is required');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out must be after check-in');
      return;
    }
    if (!name.trim()) {
      setError('Guest name is required');
      return;
    }
    onSubmit({
      villaId: villaId.trim(),
      checkIn: checkIn.trim(),
      checkOut: checkOut.trim(),
      name: name.trim(),
      numberOfNights: numberOfNights.trim() || undefined,
      bookingPlatform: bookingPlatform.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="check-in-form">
      <h3>Add check-in</h3>
      <label>
        <span>Villa</span>
        <select
          value={villaId}
          onChange={e => setVillaId(e.target.value)}
          required
        >
          <option value="">Select villa</option>
          {villas.map(v => (
            <option key={v.villa_id} value={v.villa_id}>
              {v.villa_name || v.villa_id}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Check-in date</span>
        <input
          type="date"
          value={checkIn}
          onChange={e => setCheckIn(e.target.value)}
          required
        />
      </label>
      <label>
        <span>Check-out date</span>
        <input
          type="date"
          value={checkOut}
          onChange={e => setCheckOut(e.target.value)}
          required
        />
      </label>
      <label>
        <span>Guest name</span>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Guest name"
          required
        />
      </label>
      <label>
        <span>Number of nights</span>
        <input
          type="number"
          min="1"
          value={numberOfNights}
          onChange={e => setNumberOfNights(e.target.value)}
          placeholder="Auto-calculated"
        />
      </label>
      <label>
        <span>Booking platform</span>
        <input
          type="text"
          value={bookingPlatform}
          onChange={e => setBookingPlatform(e.target.value)}
          placeholder="e.g. Airbnb, Booking.com"
        />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-text" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add check-in'}
        </button>
      </div>
    </form>
  );
}
