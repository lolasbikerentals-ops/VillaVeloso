import React, { useState, useMemo } from 'react';

const STATUS_OPTIONS = ['OK', 'Missing', 'Damaged', 'Not checked'];

export default function CheckRunView({ inventory, onSubmit, submitting }) {
  const [items, setItems] = useState(() =>
    inventory.map(it => ({
      itemId: it.item_id,
      item_name: it.item_name,
      category: it.category,
      quantity: it.quantity,
      unit: it.unit,
      status: 'OK',
      quantityOk: it.quantity,
      notes: '',
    }))
  );

  const byCategory = useMemo(() => {
    const map = {};
    items.forEach(it => {
      const cat = it.category || 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(it);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  function setItemStatus(itemId, field, value) {
    setItems(prev => prev.map(it => it.itemId === itemId ? { ...it, [field]: value } : it));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = items.map(it => ({
      itemId: it.itemId,
      item_name: it.item_name,
      status: it.status,
      quantityOk: it.quantityOk != null ? it.quantityOk : '',
      notes: it.notes || '',
    }));
    onSubmit(payload);
  }

  if (!items.length) {
    return <p className="empty">No items in inventory for this villa.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="check-run-view">
      {byCategory.map(([category, list]) => (
        <section key={category} className="category-block">
          <h2 className="category-title">{category}</h2>
          <ul className="item-list">
            {list.map(it => (
              <li key={it.itemId} className="item-row">
                <div className="item-info">
                  <span className="item-name">{it.item_name}</span>
                  <span className="item-qty">Qty: {it.quantity} {it.unit || ''}</span>
                </div>
                <div className="item-fields">
                  <select
                    value={it.status}
                    onChange={e => setItemStatus(it.itemId, 'status', e.target.value)}
                    className="status-select"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Notes"
                    value={it.notes}
                    onChange={e => setItemStatus(it.itemId, 'notes', e.target.value)}
                    className="notes-input"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="sticky-submit">
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Complete check'}
        </button>
      </div>
    </form>
  );
}
