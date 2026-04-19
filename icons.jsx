// Minimal line icons — stroke 1.5, hairline feel
const Icon = ({ d, size = 16, children, fill = "none", ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

const IconHome = (p) => <Icon {...p}><path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/></Icon>;
const IconUsers = (p) => <Icon {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20c0-2 1.5-4 4-4s4 1.5 4 4"/></Icon>;
const IconPlan = (p) => <Icon {...p}><rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M8 9h8M8 13h8M8 17h5"/></Icon>;
const IconInsight = (p) => <Icon {...p}><path d="M4 20V6M4 20h16"/><path d="M8 16l3-4 3 2 5-7"/></Icon>;
const IconBell = (p) => <Icon {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>;
const IconSettings = (p) => <Icon {...p}><circle cx="12" cy="12" r="2.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="6"/><path d="m20 20-4.3-4.3"/></Icon>;
const IconPlus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IconChevronR = (p) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>;
const IconChevronD = (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>;
const IconSparkle = (p) => <Icon {...p}><path d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4Z"/><path d="M19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7L19 17Z"/></Icon>;
const IconWhatsapp = (p) => <Icon {...p}><path d="M4 20l1.5-4A8 8 0 1 1 8 20l-4 0Z"/><path d="M9 10c.5 2 2 3.5 4 4l1-1c.4-.4 1-.5 1.5-.3l1.5.6c.5.2.7.7.5 1.2-.4 1-1.4 1.6-2.5 1.4A7 7 0 0 1 8 10.5C7.8 9.4 8.4 8.4 9.4 8c.5-.2 1 0 1.2.5l.6 1.5c.2.5.1 1.1-.3 1.5l-1 .5Z"/></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></Icon>;
const IconTrend = (p) => <Icon {...p}><path d="M3 17l6-6 4 4 8-9"/><path d="M14 6h6v6"/></Icon>;
const IconMeal = (p) => <Icon {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></Icon>;
const IconScale = (p) => <Icon {...p}><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 10h8"/><path d="M10 14l2-2 2 2"/></Icon>;
const IconEdit = (p) => <Icon {...p}><path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m14 6 4 4"/></Icon>;
const IconFilter = (p) => <Icon {...p}><path d="M4 5h16l-6 8v5l-4 2v-7L4 5Z"/></Icon>;
const IconDots = (p) => <Icon {...p}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></Icon>;
const IconAlert = (p) => <Icon {...p}><path d="M12 4 2 20h20L12 4Z"/><path d="M12 10v5M12 18v.5"/></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="m5 12 4 4 10-10"/></Icon>;
const IconX = (p) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18"/></Icon>;
const IconArrowR = (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>;
const IconCalendar = (p) => <Icon {...p}><rect x="4" y="5" width="16" height="16" rx="1.5"/><path d="M4 10h16M9 3v4M15 3v4"/></Icon>;
const IconDrop = (p) => <Icon {...p}><path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z"/></Icon>;
const IconTrash = (p) => <Icon {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></Icon>;
const IconArchive = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="4" rx="1"/><path d="M5 9v11h14V9M10 13h4"/></Icon>;
const IconDownload = (p) => <Icon {...p}><path d="M12 4v12M7 12l5 5 5-5"/><path d="M4 20h16"/></Icon>;

Object.assign(window, {
  Icon, IconHome, IconUsers, IconPlan, IconInsight, IconBell, IconSettings,
  IconSearch, IconPlus, IconChevronR, IconChevronD, IconSparkle, IconWhatsapp,
  IconClock, IconTrend, IconMeal, IconScale, IconEdit, IconFilter, IconDots,
  IconAlert, IconCheck, IconX, IconArrowR, IconCalendar, IconDrop, IconTrash, IconArchive, IconDownload
});
