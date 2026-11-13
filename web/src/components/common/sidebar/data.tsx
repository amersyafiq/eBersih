import {
  AlphabetIcon,
  BuildingIcon,
  ContractorIcon,
  HomeIcon,
  InvoiceIcon,
  LetterIcon,
  PieChartIcon,
  TableIcon,
  TaskIcon,
  UserIcon,
  Widget4Icon,
  WindowIcon
} from "./icon";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Overview",
        url: "/overview",
        icon: <HomeIcon />,
        items: [],
      },   
      {
        title: "Live Monitor",
        url: "/live",
        icon: <TableIcon />,
        items: [],
      },
      {
        title: "Manage Facility",
        url: "/facility",
        icon: <BuildingIcon />,
        items: [],
      },
      {
        title: "Manage Contractor",
        url: "/contractor",
        icon: <ContractorIcon />,
        items: [],
      },
      {
        title: "Manage Task",
        url: "/task",
        icon: <TaskIcon />,
        items: [],
      },
      {
        title: "Reports",
        icon: <InvoiceIcon />,
        items: [
          {
            title: "Workload Distribution",
            url: "/reports/workload",
          },
          {
            title: "GA Performance",
            url: "/reports/ga-performance",
          },
          {
            title: "Contractor Performance",
            url: "/reports/contractor-performance",
          },
          {
            title: "Completion History",
            url: "/reports/history",
          },
        ],
      },
    ],
  },
  {
    label: "GENETIC ALGORITHM",
    items: [
      {
        title: "Settings",
        url: "/settings",
        icon: <HomeIcon />,
        items: [],
      },
    ],
  },
];
