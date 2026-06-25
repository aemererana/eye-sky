export default function CooldownIndicator({ secondsRemaining }) {
  if (secondsRemaining <= 0) return null;

  return (
    <div className="cooldown-indicator">
      Next scan in {secondsRemaining}s…
    </div>
  );
}
