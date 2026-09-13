import { CalendarDays, Users, Clock, Building2, Printer } from 'lucide-react';

export type AppTab = 'schedule' | 'teachers' | 'timings' | 'school' | 'export';

interface TabNavigationProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  conflictCount: number;
}

export default function TabNavigation({
  activeTab,
  onChangeTab,
  conflictCount,
}: TabNavigationProps) {
  const tabs = [
    {
      id: 'schedule' as AppTab,
      label: 'Schedule',
      icon: CalendarDays,
      badge: conflictCount > 0 ? `${conflictCount}` : null,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'teachers' as AppTab,
      label: 'Teachers',
      icon: Users,
      badge: null,
    },
    {
      id: 'timings' as AppTab,
      label: 'Timings',
      icon: Clock,
      badge: null,
    },
    {
      id: 'school' as AppTab,
      label: 'School Info',
      icon: Building2,
      badge: null,
    },
    {
      id: 'export' as AppTab,
      label: 'A4 Export',
      icon: Printer,
      badge: 'A4',
      badgeColor: 'bg-amber-400 text-black',
    },
  ];

  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              id={`nav-tab-${t.id}`}
              onClick={() => onChangeTab(t.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full relative transition-all active:scale-95 ${
                isActive ? 'text-black font-bold' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {t.badge && (
                  <span
                    className={`absolute -top-1.5 -right-3 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs ${
                      t.badgeColor || 'bg-neutral-800 text-white'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{t.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-1 bg-black rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
