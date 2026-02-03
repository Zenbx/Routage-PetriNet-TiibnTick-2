export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      TiiB<span className="text-primary">n</span>TicK
    </span>
  );
}

export function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold ${className}`}>
      TiiB<span className="text-primary">n</span>TicK
    </span>
  );
}
