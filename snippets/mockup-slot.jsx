export const MockupSlot = ({ label }) => (
  <div className="conty-mockup-slot" role="img" aria-label={label}>
    <span className="conty-mockup-slot-label">{label}</span>
    <span className="conty-mockup-slot-hint">Substitua por print ou mockup</span>
  </div>
);
