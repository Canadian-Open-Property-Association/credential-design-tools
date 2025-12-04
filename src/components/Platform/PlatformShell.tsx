import PlatformBar from './PlatformBar';

interface PlatformShellProps {
  children: React.ReactNode;
  showBackButton?: boolean;
}

export default function PlatformShell({ children, showBackButton = true }: PlatformShellProps) {
  return (
    <div className="flex flex-col h-screen">
      <PlatformBar showBackButton={showBackButton} />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
